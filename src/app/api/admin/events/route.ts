import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const SLUG_RE = /^[a-z0-9-]{1,100}$/
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/

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

// GET /api/admin/events
export async function GET() {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: events, count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events: events ?? [], total: count ?? 0 });
  } catch (err) {
    console.error('Admin events GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/events — create event
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const {
      name,
      slug,
      description,
      banner_color,
      button_label,
      banner_image_url,
      is_active,
      auto_activate_from,
      auto_deactivate_at,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
    }

    if (banner_color && !HEX_COLOR_RE.test(banner_color)) {
      return NextResponse.json({ error: 'banner_color must be a valid hex color' }, { status: 400 });
    }

    if (banner_image_url && !isAllowedImageUrl(banner_image_url)) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name,
        slug,
        description: description ?? null,
        banner_color: banner_color ?? '#e91e8c',
        button_label: button_label ?? null,
        banner_image_url: banner_image_url ?? null,
        is_active: is_active ?? false,
        auto_activate_from: auto_activate_from ?? null,
        auto_deactivate_at: auto_deactivate_at ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Event insert error:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error('Admin events POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
