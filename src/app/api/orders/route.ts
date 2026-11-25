import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/resend';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';
import { RLS } from '@cloudflare/rls-policies';
import { getSessionUserId } from '@/lib/auth/session';
import { readJsonBody, isValidEmail, stripControl } from '@/lib/http';
import { hit, rateLimitIp } from '@/lib/rate-limit';
import { isAllowedImageUrl } from '@/lib/images';
import { ADD_ONS } from '@/lib/catalog';
import type { Order, OrderItem } from '@/types';

export const dynamic = 'force-dynamic';

const ORDER_COLUMNS =
  'id, order_number, user_id, customer_name, customer_email, customer_phone, fulfillment, delivery_address, delivery_area, delivery_date, delivery_time, occasion, card_message, notes, payment_method, payment_status, order_status, total_usd, whatsapp_sent, email_sent, created_at, updated_at';

type OrderRow = Omit<Order, 'items' | 'whatsapp_sent' | 'email_sent'> & {
  whatsapp_sent: number;
  email_sent: number;
};

// D1 stores booleans as INTEGER 0/1.
function toOrder(row: OrderRow) {
  return { ...row, whatsapp_sent: !!row.whatsapp_sent, email_sent: !!row.email_sent };
}

// Random hex from the Web Crypto API (works on Workers).
function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) =>
    b.toString(16).padStart(2, '0')
  )
    .join('')
    .toUpperCase();
}

// Optional text column: strings are trimmed and length-capped, anything else is stored as NULL.
const optText = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, max) : null;

const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 100;
const MAX_TOTAL_QTY = 200;

// Add-ons are stored as inactive products (hidden from the shop but orderable). Only these exact ids qualify.
const ADD_ON_IDS: string[] = ADD_ONS.map((a) => a.id);

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

interface CartLine {
  id: string;
  quantity: number;
  isEvent: boolean;
}

interface CatalogRow {
  id: string;
  name: string;
  price_usd: number | null;
  image_url: string | null;
  event_id?: string;
}

export async function POST(request: Request) {
  try {
    // Rate limit: keyed ONLY on CF-Connecting-IP; durable (D1 counter) with optional CF binding in front.
    if (!(await rateLimitIp(request, 'orders-min', { limit: 5, windowSec: 60 }))) {
      return bad('Too many requests', 429);
    }
    if (!(await rateLimitIp(request, 'orders-hour', { limit: 30, windowSec: 3600 }))) {
      return bad('Too many requests', 429);
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const {
      items, customer_name, customer_email, customer_phone, fulfillment,
      delivery_address, delivery_area, delivery_date, delivery_time,
      occasion, card_message, notes, payment_method,
      // total_usd and user ids are intentionally NOT accepted from the client (computed / session-derived)
    } = parsed.body;

    // User id comes from the Better Auth session or stays null (guest checkout).
    const userId = await getSessionUserId(request);
    if (!RLS.canWriteOrder(userId !== null).allowed) {
      return bad('Forbidden', 403);
    }

    if (customer_email !== null && customer_email !== undefined && customer_email !== '' && !isValidEmail(customer_email)) {
      return bad('customer_email is invalid');
    }
    if (typeof customer_name !== 'string' || customer_name.trim().length < 1 || customer_name.length > 100) {
      return bad('customer_name must be a string between 1 and 100 characters');
    }
    if (typeof customer_phone !== 'string' || customer_phone.trim().length < 1 || customer_phone.length > 30) {
      return bad('customer_phone must be a string between 1 and 30 characters');
    }
    if (typeof fulfillment !== 'string' || !['delivery', 'pickup'].includes(fulfillment)) {
      return bad('fulfillment must be one of: delivery, pickup');
    }
    if (typeof payment_method !== 'string' || !['whish', 'cash', 'card', 'transfer'].includes(payment_method)) {
      return bad('payment_method must be one of: whish, cash, card, transfer');
    }
    for (const [field, value, max] of [
      ['delivery_address', delivery_address, 300],
      ['delivery_area', delivery_area, 100],
      ['delivery_date', delivery_date, 32],
      ['delivery_time', delivery_time, 50],
      ['occasion', occasion, 100],
      ['card_message', card_message, 500],
      ['notes', notes, 1000],
    ] as const) {
      if (typeof value === 'string' && value.length > max) {
        return bad(`${field} must be at most ${max} characters`);
      }
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
      return bad(`items must be a non-empty array with at most ${MAX_ITEMS} items`);
    }

    // Validate every line, then merge duplicates (same id + kind) BEFORE applying the caps.
    const merged = new Map<string, CartLine>();
    for (const raw of items as unknown[]) {
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return bad('Each item must be an object');
      const item = raw as Record<string, unknown>;
      if (typeof item.id !== 'string' || !item.id || item.id.length > 64) return bad('Each item must have a valid id');
      const qty = item.quantity;
      if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
        return bad(`item.quantity must be an integer between 1 and ${MAX_QTY_PER_ITEM}`);
      }
      const isEvent = item.is_event_product === true;
      const key = `${isEvent ? 'e' : 'p'}:${item.id}`;
      const line = merged.get(key);
      if (line) line.quantity += qty;
      else merged.set(key, { id: item.id, quantity: qty, isEvent });
    }
    const lines = [...merged.values()];
    let totalQty = 0;
    for (const line of lines) {
      if (line.quantity > MAX_QTY_PER_ITEM) return bad(`item.quantity must be at most ${MAX_QTY_PER_ITEM} per product`);
      totalQty += line.quantity;
    }
    if (totalQty > MAX_TOTAL_QTY) return bad(`Total quantity must be at most ${MAX_TOTAL_QTY}`);

    // Look up name, price and image from the DB. Client name/price/image/event_id are never used.
    const regular = lines.filter((l) => !l.isEvent);
    const event = lines.filter((l) => l.isEvent);
    const catalog = new Map<string, CatalogRow>();

    if (regular.length > 0) {
      const rows = await dbQuery<CatalogRow>(
        `SELECT id, name, price_usd, image_url FROM products
         WHERE id IN (${regular.map(() => '?').join(',')})
           AND (is_active = 1 OR id IN (${ADD_ON_IDS.map(() => '?').join(',')}))`,
        [...regular.map((l) => l.id), ...ADD_ON_IDS]
      );
      rows.forEach((r) => catalog.set(`p:${r.id}`, r));
    }
    if (event.length > 0) {
      const rows = await dbQuery<CatalogRow>(
        `SELECT id, name, price_usd, image_url, event_id FROM event_products
         WHERE is_active = 1 AND id IN (${event.map(() => '?').join(',')})`,
        event.map((l) => l.id)
      );
      rows.forEach((r) => catalog.set(`e:${r.id}`, r));
    }

    const orderItems: OrderItem[] = [];
    let total_usd = 0;
    for (const line of lines) {
      const row = catalog.get(`${line.isEvent ? 'e' : 'p'}:${line.id}`);
      if (!row) return bad('One or more items are unavailable');
      total_usd += (row.price_usd ?? 0) * line.quantity;
      orderItems.push({
        id: row.id,
        name: row.name,
        price_usd: row.price_usd,
        quantity: line.quantity,
        image_url: isAllowedImageUrl(row.image_url) ? row.image_url : null,
        is_event_product: line.isEvent,
        event_id: row.event_id ?? undefined,
      });
    }

    // L-1: Cryptographically random order number suffix
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const order_number = `REB-${dateStr}-${randomHex(4)}`;

    const email = typeof customer_email === 'string' && customer_email !== '' ? customer_email.trim() : null;

    // Insert order (18 columns, 18 placeholders)
    const orderId = crypto.randomUUID();
    try {
      await dbRun(
        'INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, fulfillment, delivery_address, delivery_area, delivery_date, delivery_time, occasion, card_message, notes, payment_method, payment_status, order_status, total_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          orderId,
          order_number,
          userId,
          stripControl(customer_name),
          email,
          stripControl(customer_phone),
          fulfillment,
          optText(delivery_address, 300),
          optText(delivery_area, 100),
          optText(delivery_date, 32),
          optText(delivery_time, 50),
          optText(occasion, 100),
          optText(card_message, 500),
          optText(notes, 1000),
          payment_method,
          'pending',
          'pending',
          total_usd,
        ]
      );
    } catch (orderError) {
      console.error('Order insertion error:', orderError);
      return bad('Failed to create order', 500);
    }

    const orderRow = await dbQueryOne<OrderRow>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ?`,
      [orderId]
    );
    if (!orderRow) {
      console.error('Order read-back failed for id:', orderId);
      return bad('Failed to create order', 500);
    }

    // Insert order items from DB-derived values, one statement per item
    try {
      for (const item of orderItems) {
        await dbRun(
          'INSERT INTO order_items (id, order_id, name, price_usd, quantity, image_url, is_event_product, event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            crypto.randomUUID(),
            orderId,
            item.name,
            item.price_usd,
            item.quantity,
            item.image_url,
            item.is_event_product ? 1 : 0,
            item.event_id ?? null,
          ]
        );
      }
    } catch (itemsError) {
      console.error('Order items insertion error:', itemsError);
      // Roll back: ON DELETE CASCADE removes any order_items already written
      await dbRun('DELETE FROM orders WHERE id = ?', [orderId]);
      return bad('Failed to create order', 500);
    }

    // Emails (non-blocking; failures don't cancel the order). The customer email is capped per recipient
    // per hour so the endpoint cannot be used to spam a third party.
    const fullOrder: Order = { ...toOrder(orderRow), items: orderItems };
    const adminEmail = process.env.ADMIN_EMAIL || 'info@rebellys.com';
    const mayEmailCustomer = email ? await hit('order-email', email.toLowerCase(), { limit: 3, windowSec: 3600 }) : false;
    const [emailResult, adminResult] = await Promise.allSettled([
      mayEmailCustomer ? sendOrderConfirmationEmail(fullOrder) : Promise.resolve(false),
      sendAdminNewOrderEmail(fullOrder, adminEmail),
    ]);

    if (emailResult.status === 'rejected') {
      console.error('Order confirmation email failed:', emailResult.reason);
    }
    if (adminResult.status === 'rejected') {
      console.error('Admin new order email failed:', adminResult.reason);
    }

    if (emailResult.status === 'fulfilled' && emailResult.value === true) {
      await dbRun("UPDATE orders SET email_sent = 1, updated_at = datetime('now') WHERE id = ?", [orderId]);
    }

    return NextResponse.json({
      success: true,
      orderNumber: orderRow.order_number,
      order: toOrder(orderRow),
    });
  } catch (error) {
    console.error('API Orders Error:', error);
    return bad('Internal server error', 500);
  }
}
