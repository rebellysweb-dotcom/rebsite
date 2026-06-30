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

// PATCH /api/admin/events/:id/products/:productId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, productId } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    if (!UUID_RE.test(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const body = await request.json();

    const allowedFields = ['name', 'description', 'image_url', 'price_usd', 'tag', 'sort_order', 'is_active'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const image_url = updates.image_url as string | undefined;
    if (image_url && !isAllowedImageUrl(image_url)) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('event_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Event product not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error('Event product PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/events/:id/products/:productId
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, productId } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    if (!UUID_RE.test(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('event_products')
      .delete()
      .eq('id', productId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete event product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Event product DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
