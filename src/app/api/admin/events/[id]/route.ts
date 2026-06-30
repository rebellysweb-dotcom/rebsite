import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG_RE = /^[a-z0-9-]{1,100}$/
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/

// GET /api/admin/events/:id (includes event_products)
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
    const { data: event, error } = await supabase
      .from('events')
      .select('*, event_products(*)')
      .eq('id', id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (err) {
    console.error('Admin event GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/events/:id
export async function PATCH(
  request: Request,
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
    const body = await request.json();

    const allowedFields = [
      'name', 'slug', 'description', 'banner_color', 'button_label',
      'banner_image_url', 'is_active', 'auto_activate_from', 'auto_deactivate_at',
    ];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const slug = updates.slug as string | undefined;
    if (slug && !SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
    }

    const banner_color = updates.banner_color as string | undefined;
    if (banner_color && !HEX_COLOR_RE.test(banner_color)) {
      return NextResponse.json({ error: 'banner_color must be a valid hex color' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select('*, event_products(*)')
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (err) {
    console.error('Admin event PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/events/:id — deactivates the event
export async function DELETE(
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

    const { error } = await supabase
      .from('events')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to deactivate event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin event DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
