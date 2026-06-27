import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/events/:id/products/:productId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { productId } = await params;
    const body = await request.json();

    const allowedFields = ['name', 'description', 'image_url', 'price_usd', 'tag', 'sort_order', 'is_active'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
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

    const { productId } = await params;

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
