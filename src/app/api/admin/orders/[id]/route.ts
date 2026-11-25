import { NextResponse } from 'next/server';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';
import { guardAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORDER_COLUMNS =
  'id, order_number, user_id, customer_name, customer_email, customer_phone, fulfillment, delivery_address, delivery_area, delivery_date, delivery_time, occasion, card_message, notes, payment_method, payment_status, order_status, total_usd, whatsapp_sent, email_sent, created_at, updated_at';
const ORDER_ITEM_COLUMNS =
  'id, order_id, name, price_usd, quantity, image_url, is_event_product, event_id, created_at';

// Order status values are copied from the app's validation. See the note on payment_status below.
const ALLOWED_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const;
// Matches the D1 CHECK constraint and the admin UI ("confirmed" = Whish transfer seen, not yet reconciled).
const ALLOWED_PAYMENT_STATUSES = ['pending', 'confirmed', 'paid', 'failed', 'refunded'] as const;

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  fulfillment: string;
  delivery_address: string | null;
  delivery_area: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  occasion: string | null;
  card_message: string | null;
  notes: string | null;
  payment_method: string;
  payment_status: string;
  order_status: string;
  total_usd: number | null;
  whatsapp_sent: number; // INTEGER 0/1 in D1
  email_sent: number; // INTEGER 0/1 in D1
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  name: string;
  price_usd: number | null;
  quantity: number;
  image_url: string | null;
  is_event_product: number; // INTEGER 0/1 in D1
  event_id: string | null;
  created_at: string;
}

type DbValue = string | number | null;

class BadInput extends Error {}

function flag(field: string, value: unknown): 0 | 1 {
  if (typeof value !== 'boolean') throw new BadInput(`${field} must be a boolean`);
  return value ? 1 : 0;
}

function toOrder(row: OrderRow, items: OrderItemRow[]) {
  return {
    ...row,
    whatsapp_sent: !!row.whatsapp_sent,
    email_sent: !!row.email_sent,
    order_items: items.map((item) => ({ ...item, is_event_product: !!item.is_event_product })),
  };
}


async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await request.json();
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function loadOrder(id: string) {
  const row = await dbQueryOne<OrderRow>(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ?`, [id]);
  if (!row) return null;
  const items = await dbQuery<OrderItemRow>(
    `SELECT ${ORDER_ITEM_COLUMNS} FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
    [id]
  );
  return toOrder(row, items);
}

// GET /api/admin/orders/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const order = await loadOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error('Admin order GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/orders/:id
// Body: { order_status?, payment_status?, whatsapp_sent? }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await readJsonObject(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const sets: string[] = [];
    const values: DbValue[] = [];

    if ('order_status' in body) {
      const v = body.order_status;
      if (typeof v !== 'string' || !(ALLOWED_ORDER_STATUSES as readonly string[]).includes(v)) {
        return NextResponse.json(
          { error: `Invalid order_status. Allowed values: ${ALLOWED_ORDER_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      sets.push('order_status = ?');
      values.push(v);
    }

    if ('payment_status' in body) {
      const v = body.payment_status;
      if (typeof v !== 'string' || !(ALLOWED_PAYMENT_STATUSES as readonly string[]).includes(v)) {
        return NextResponse.json(
          { error: `Invalid payment_status. Allowed values: ${ALLOWED_PAYMENT_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      sets.push('payment_status = ?');
      values.push(v);
    }

    if ('whatsapp_sent' in body) {
      sets.push('whatsapp_sent = ?');
      values.push(flag('whatsapp_sent', body.whatsapp_sent));
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    sets.push("updated_at = datetime('now')");
    const result = await dbRun(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Order not found or update failed' }, { status: 404 });
    }

    const order = await loadOrder(id);
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof BadInput) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Admin order PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
