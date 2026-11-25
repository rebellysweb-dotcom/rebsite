import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/resend';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';
import { RLS } from '../../../../cloudflare/rls-policies';
import type { Order } from '@/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// TODO: Replace with Upstash Redis for persistence across Lambda cold starts
// npm i @upstash/ratelimit @upstash/redis + set UPSTASH_REDIS_REST_URL/TOKEN in Vercel env
// Simple in-memory rate limiter — ephemeral per Lambda warm instance.
// Prevents trivial scripted abuse; a persistent store (Upstash KV) would cover cold starts.
const _ipBucket = new Map<string, { count: number; ts: number }>();
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const slot = _ipBucket.get(ip);
  if (!slot || now - slot.ts > RATE_WINDOW_MS) {
    _ipBucket.set(ip, { count: 1, ts: now });
    return true;
  }
  if (slot.count >= RATE_MAX) return false;
  slot.count++;
  return true;
}

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

// Random hex from the Web Crypto API (Edge-safe; replaces Node's randomBytes).
function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) =>
    b.toString(16).padStart(2, '0')
  )
    .join('')
    .toUpperCase();
}

// Optional text column: strings are kept, anything else is stored as NULL.
const optText = (v: unknown): string | null => (typeof v === 'string' ? v : null);

export async function POST(request: Request) {
  try {
    // H-2: Rate limit by IP
    const ip =
      request.headers.get('x-real-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Content-Type guard
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      items,
      customer_name,
      customer_email,
      customer_phone,
      fulfillment,
      delivery_address,
      delivery_area,
      delivery_date,
      delivery_time,
      occasion,
      card_message,
      notes,
      payment_method,
      // total_usd intentionally NOT accepted from client — computed server-side (H-1)
    } = body;

    // TODO(auth): x-user-id must be set by the auth middleware. Until middleware strips any
    // client-supplied x-user-id and writes its own value, a caller can attach an order to any user.
    const userId: string | null = request.headers.get('x-user-id') ?? null;
    if (!RLS.canWriteOrder(userId !== null).allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Email validation
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (customer_email !== null && customer_email !== undefined) {
      if (typeof customer_email !== 'string' || !EMAIL_RE.test(customer_email) || customer_email.length > 254) {
        return NextResponse.json({ error: 'customer_email is invalid' }, { status: 400 })
      }
    }

    // Input validation
    if (typeof customer_name !== 'string' || customer_name.length < 1 || customer_name.length > 200) {
      return NextResponse.json(
        { error: 'customer_name must be a string between 1 and 200 characters' },
        { status: 400 }
      );
    }
    if (typeof customer_phone !== 'string' || customer_phone.length < 1 || customer_phone.length > 30) {
      return NextResponse.json(
        { error: 'customer_phone must be a string between 1 and 30 characters' },
        { status: 400 }
      );
    }
    if (!['delivery', 'pickup'].includes(fulfillment)) {
      return NextResponse.json(
        { error: 'fulfillment must be one of: delivery, pickup' },
        { status: 400 }
      );
    }
    if (!['whish', 'cash', 'card', 'transfer'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'payment_method must be one of: whish, cash, card, transfer' },
        { status: 400 }
      );
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: 'items must be a non-empty array with at most 50 items' },
        { status: 400 }
      );
    }
    for (const item of items) {
      if (typeof item.id !== 'string' || !item.id) {
        return NextResponse.json({ error: 'Each item must have a valid id' }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json(
          { error: 'item.quantity must be an integer between 1 and 100' },
          { status: 400 }
        );
      }
    }
    // Validated before any write (the Supabase version wrote the order first, then rejected bad items).
    for (const item of items) {
      if (typeof item.name !== 'string' || item.name.length < 1 || item.name.length > 200) {
        return NextResponse.json({ error: 'item.name must be a string between 1 and 200 characters' }, { status: 400 })
      }
      if (item.image_url) {
        // Allowed: the site's own product photos (/images/...) or an https image
        // on the configured R2 public host. Anything else is rejected.
        const img = String(item.image_url)
        const isLocal = /^\/images\/[A-Za-z0-9/_.-]+$/.test(img) && !img.includes('..')
        let isR2 = false
        const r2Host = process.env.R2_PUBLIC_HOST
        if (!isLocal && r2Host) {
          try {
            const u = new URL(img)
            isR2 = u.protocol === 'https:' && u.hostname === r2Host
          } catch { /* not a URL */ }
        }
        if (!isLocal && !isR2) {
          return NextResponse.json({ error: 'item image_url must be a site image path' }, { status: 400 })
        }
      }
    }

    // H-1: Look up actual prices server-side — client-supplied price_usd is ignored
    const regularItems = items.filter((i: { is_event_product?: boolean }) => !i.is_event_product);
    const eventItems   = items.filter((i: { is_event_product?: boolean }) =>  i.is_event_product);
    const priceMap = new Map<string, number | null>();

    if (regularItems.length > 0) {
      const products = await dbQuery<{ id: string; price_usd: number | null }>(
        'SELECT id, price_usd FROM products WHERE id IN (' + regularItems.map(() => '?').join(',') + ')',
        regularItems.map((i: { id: string }) => i.id)
      );
      products.forEach((p) => priceMap.set(p.id, p.price_usd));
    }
    if (eventItems.length > 0) {
      const eventProducts = await dbQuery<{ id: string; price_usd: number | null }>(
        'SELECT id, price_usd FROM event_products WHERE id IN (' + eventItems.map(() => '?').join(',') + ')',
        eventItems.map((i: { id: string }) => i.id)
      );
      eventProducts.forEach((p) => priceMap.set(p.id, p.price_usd));
    }

    // Reject any item ID not in our catalog
    for (const item of items) {
      if (!priceMap.has(item.id)) {
        return NextResponse.json({ error: `Unknown product: ${item.id}` }, { status: 400 });
      }
    }

    // Compute total server-side from verified prices
    const total_usd = items.reduce(
      (sum: number, item: { id: string; quantity: number }) =>
        sum + (priceMap.get(item.id) ?? 0) * item.quantity,
      0
    );

    // L-1: Cryptographically random order number suffix
    const dateStr   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const order_number = `REB-${dateStr}-${randomHex(4)}`;

    // Insert order (18 columns, 18 placeholders)
    const orderId = crypto.randomUUID();
    try {
      await dbRun(
        'INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, fulfillment, delivery_address, delivery_area, delivery_date, delivery_time, occasion, card_message, notes, payment_method, payment_status, order_status, total_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          orderId,
          order_number,
          userId,
          customer_name,
          optText(customer_email),
          customer_phone,
          fulfillment,
          optText(delivery_address),
          optText(delivery_area),
          optText(delivery_date),
          optText(delivery_time),
          optText(occasion),
          optText(card_message),
          optText(notes),
          payment_method,
          'pending',
          'pending',
          total_usd,
        ]
      );
    } catch (orderError) {
      console.error('Order insertion error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const orderRow = await dbQueryOne<OrderRow>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ?`,
      [orderId]
    );
    if (!orderRow) {
      console.error('Order read-back failed for id:', orderId);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items with server-verified prices, one statement per item
    try {
      for (const item of items as {
        id: string; name: string; quantity: number;
        image_url?: string; is_event_product?: boolean; event_id?: string;
      }[]) {
        await dbRun(
          'INSERT INTO order_items (id, order_id, name, price_usd, quantity, image_url, is_event_product, event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            crypto.randomUUID(),
            orderId,
            item.name,
            priceMap.get(item.id) ?? null,
            item.quantity,
            item.image_url ?? null,
            item.is_event_product ? 1 : 0,
            item.event_id || null,
          ]
        );
      }
    } catch (itemsError) {
      console.error('Order items insertion error:', itemsError);
      // Roll back: ON DELETE CASCADE removes any order_items already written
      await dbRun('DELETE FROM orders WHERE id = ?', [orderId]);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Send emails (non-blocking — failures don't cancel the order)
    const fullOrder: Order = { ...toOrder(orderRow), items };
    const adminEmail = process.env.ADMIN_EMAIL || 'info@rebellys.com';
    const [emailResult, adminResult] = await Promise.allSettled([
      sendOrderConfirmationEmail(fullOrder),
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
