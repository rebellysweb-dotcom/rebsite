import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/resend';
import type { Order } from '@/types';

export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  try {
    // H-2: Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
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

    const supabase = await createClient();
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

    // H-1: Look up actual prices server-side — client-supplied price_usd is ignored
    const adminClient = createAdminClient();
    const regularItems = items.filter((i: { is_event_product?: boolean }) => !i.is_event_product);
    const eventItems   = items.filter((i: { is_event_product?: boolean }) =>  i.is_event_product);
    const priceMap = new Map<string, number | null>();

    if (regularItems.length > 0) {
      const { data: dbProducts } = await adminClient
        .from('products')
        .select('id, price_usd')
        .in('id', regularItems.map((i: { id: string }) => i.id));
      dbProducts?.forEach((p: { id: string; price_usd: number | null }) =>
        priceMap.set(p.id, p.price_usd)
      );
    }
    if (eventItems.length > 0) {
      const { data: dbEventProducts } = await adminClient
        .from('event_products')
        .select('id, price_usd')
        .in('id', eventItems.map((i: { id: string }) => i.id));
      dbEventProducts?.forEach((p: { id: string; price_usd: number | null }) =>
        priceMap.set(p.id, p.price_usd)
      );
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

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // L-1: Cryptographically random order number suffix
    const dateStr   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = randomBytes(4).toString('hex').toUpperCase();
    const order_number = `REB-${dateStr}-${randomStr}`;

    // Insert order — use service role so RLS doesn't block (public INSERT policy removed)
    const { data: orderData, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number,
        user_id: user?.id || null,
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
        payment_status: 'pending',
        order_status: 'pending',
        total_usd,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insertion error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items with server-verified prices
    const orderItems = items.map((item: {
      id: string; name: string; quantity: number;
      image_url?: string; is_event_product?: boolean; event_id?: string;
    }) => ({
      order_id: orderData.id,
      name: item.name,
      price_usd: priceMap.get(item.id) ?? null,
      quantity: item.quantity,
      image_url: item.image_url ?? null,
      is_event_product: item.is_event_product || false,
      event_id: item.event_id || null,
    }));

    const { error: itemsError } = await adminClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items insertion error:', itemsError);
      await adminClient.from('orders').delete().eq('id', orderData.id);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Send emails (non-blocking — failures don't cancel the order)
    const fullOrder: Order = { ...orderData, items };
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
      await adminClient.from('orders').update({ email_sent: true }).eq('id', orderData.id);
    }

    return NextResponse.json({
      success: true,
      orderNumber: orderData.order_number,
      order: orderData,
    });
  } catch (error) {
    console.error('API Orders Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
