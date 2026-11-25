import { type NextRequest, NextResponse } from 'next/server';
import { dbQueryOne } from '@/lib/db';


export async function GET(_req: NextRequest) {
  try {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const event = await dbQueryOne<{
      id: string; name: string; slug: string; description: string | null;
      banner_color: string; button_label: string | null; banner_image_url: string | null;
      is_active: number; auto_activate_from: string | null; auto_deactivate_at: string | null;
    }>(
      `SELECT id, name, slug, description, banner_color, button_label, banner_image_url,
              is_active, auto_activate_from, auto_deactivate_at
       FROM events
       WHERE is_active = 1
          OR (auto_activate_from <= ? AND (auto_deactivate_at IS NULL OR auto_deactivate_at >= ?))
       ORDER BY created_at DESC
       LIMIT 1`,
      [now, now]
    );

    if (!event) return NextResponse.json({ event: null });

    return NextResponse.json({
      event: {
        ...event,
        is_active: !!event.is_active,
      },
    });
  } catch {
    return NextResponse.json({ event: null });
  }
}
