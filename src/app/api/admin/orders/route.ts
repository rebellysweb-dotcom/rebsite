import { NextResponse } from 'next/server';
import { dbQuery, dbQueryOne } from '@/lib/db';
import { RLS } from '../../../../../cloudflare/rls-policies';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ORDER_COLUMNS =
  'id, order_number, user_id, customer_name, customer_email, customer_phone, fulfillment, delivery_address, delivery_area, delivery_date, delivery_time, occasion, card_message, notes, payment_method, payment_status, order_status, total_usd, whatsapp_sent, email_sent, created_at, updated_at';

const ITEM_COLUMNS =
  'id, order_id, name, price_usd, quantity, image_url, is_event_product, event_id, created_at';

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
  email_sent: number;    // INTEGER 0/1 in D1
  created_at: string;
  updated_at: string;
}

interface ItemRow {
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

// GET /api/admin/orders?page=1&limit=20&status=pending&search=REB-
export async function GET(request: Request) {
  try {
    // TODO(auth): x-user-role is a stub. Replace with the role from the verified JWT once auth lands;
    // middleware must strip and overwrite any client-supplied x-user-role, or this check is spoofable.
    const userRole = request.headers.get('x-user-role') ?? 'customer';
    if (!RLS.canReadAllOrders(userRole).allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = (() => {
      const p = parseInt(searchParams.get('page') ?? '1');
      return isNaN(p) ? 1 : Math.max(1, p);
    })();
    const limit = (() => {
      const l = parseInt(searchParams.get('limit') ?? '20');
      // Clamp to at least 1: SQLite treats a negative LIMIT as "no limit".
      return isNaN(l) ? 20 : Math.min(100, Math.max(1, l));
    })();
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // FIX H-13: Sanitize search to prevent LIKE wildcard injection
    const safeSearch = (search || '').replace(/[%_,()]/g, '').slice(0, 100);

    const from = (page - 1) * limit;

    // Only fixed SQL fragments are concatenated; every user value is a bound parameter.
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (status && status !== 'all') {
      where.push('order_status = ?');
      params.push(status);
    }
    if (safeSearch) {
      where.push('(order_number LIKE ? OR customer_name LIKE ?)');
      params.push(`%${safeSearch}%`, `%${safeSearch}%`);
    }
    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = await dbQueryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM orders ${whereSql}`,
      params
    );
    const total = countRow?.total ?? 0;

    const rows = await dbQuery<OrderRow>(
      `SELECT ${ORDER_COLUMNS} FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, from]
    );

    // Second query replaces the Supabase `order_items(*)` embed.
    const orderIds = rows.map((r) => r.id);
    const itemRows =
      orderIds.length > 0
        ? await dbQuery<ItemRow>(
            `SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
            orderIds
          )
        : [];

    const itemsByOrder = new Map<string, (Omit<ItemRow, 'is_event_product'> & { is_event_product: boolean })[]>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push({ ...item, is_event_product: !!item.is_event_product });
      itemsByOrder.set(item.order_id, list);
    }

    const orders = rows.map((r) => ({
      ...r,
      whatsapp_sent: !!r.whatsapp_sent,
      email_sent: !!r.email_sent,
      order_items: itemsByOrder.get(r.id) ?? [],
    }));

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Admin orders GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
