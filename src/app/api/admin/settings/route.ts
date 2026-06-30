import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings
export async function GET() {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (err) {
    console.error('Admin settings GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/settings
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const allowedFields = [
      'lbp_rate', 'whish_number', 'whatsapp_number',
      'shop_phone', 'shop_address', 'shop_email',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const PHONE_RE = /^\d{7,15}$/
    if ('whatsapp_number' in body && !PHONE_RE.test(String(body.whatsapp_number))) {
      return NextResponse.json({ error: 'whatsapp_number must be digits only, 7-15 chars' }, { status: 400 });
    }

    // site_settings is a singleton row — update whichever row exists
    const { data, error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      console.error('Settings update error:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (err) {
    console.error('Admin settings PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
