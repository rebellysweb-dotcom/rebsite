import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.protocol === 'https:' &&
      (u.hostname.endsWith('.supabase.co') || u.hostname === 'lh3.googleusercontent.com')
    )
  } catch {
    return false
  }
}

// GET /api/admin/events/:id/products — list all products for this event
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const { data: products, error } = await supabase
      .from('event_products')
      .select('*')
      .eq('event_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch event products' }, { status: 500 });
    }

    return NextResponse.json({ products: products ?? [] });
  } catch (err) {
    console.error('Event products GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/events/:id/products — add product to event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: event_id } = await params;
    if (!UUID_RE.test(event_id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const body = await request.json();
    const { name, description, image_url, price_usd, tag, sort_order, is_active } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (image_url && !isAllowedImageUrl(image_url)) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('event_products')
      .insert({
        event_id,
        name,
        description: description ?? null,
        image_url: image_url ?? null,
        price_usd: price_usd ?? null,
        tag: tag ?? null,
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Event product insert error:', error);
      return NextResponse.json({ error: 'Failed to create event product' }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error('Event products POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
