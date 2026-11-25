import { NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/images';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';
import { guardAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const SLUG_RE = /^[a-z0-9-]{1,100}$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

const EVENT_COLUMNS =
  'id, name, slug, description, banner_color, button_label, banner_image_url, is_active, auto_activate_from, auto_deactivate_at, created_at';

interface EventRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_color: string;
  button_label: string | null;
  banner_image_url: string | null;
  is_active: number; // INTEGER 0/1 in D1
  auto_activate_from: string | null;
  auto_deactivate_at: string | null;
  created_at: string;
}

type DbValue = string | number | null;

class BadInput extends Error {}

// D1 binds string, number and null only. Objects and arrays are rejected.
function bind(field: string, value: unknown): DbValue {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  throw new BadInput(`${field} has an invalid type`);
}

// D1 has no boolean type. Booleans are stored as INTEGER 0/1.
function flag(field: string, value: unknown): 0 | 1 {
  if (typeof value !== 'boolean') throw new BadInput(`${field} must be a boolean`);
  return value ? 1 : 0;
}

function toEvent(row: EventRow) {
  return { ...row, is_active: !!row.is_active };
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


// GET /api/admin/events
export async function GET(request: Request) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const rows = await dbQuery<EventRow>(
      `SELECT ${EVENT_COLUMNS} FROM events ORDER BY created_at DESC`
    );

    return NextResponse.json({ events: rows.map(toEvent), total: rows.length });
  } catch (err) {
    console.error('Admin events GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/events — create event
export async function POST(request: Request) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const body = await readJsonObject(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, slug } = body;
    if (typeof name !== 'string' || typeof slug !== 'string' || !name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
    }

    const bannerColor = body.banner_color || '#844057';
    if (typeof bannerColor !== 'string' || !HEX_COLOR_RE.test(bannerColor)) {
      return NextResponse.json({ error: 'banner_color must be a valid hex color' }, { status: 400 });
    }

    const bannerImageUrl = body.banner_image_url || null;
    if (bannerImageUrl !== null && (typeof bannerImageUrl !== 'string' || !isAllowedImageUrl(bannerImageUrl))) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const isActive = body.is_active === undefined ? 0 : flag('is_active', body.is_active);
    const id = crypto.randomUUID();

    // slug is UNIQUE; a duplicate slug fails here and returns 500.
    await dbRun(
      `INSERT INTO events (id, name, slug, description, banner_color, button_label, banner_image_url, is_active, auto_activate_from, auto_deactivate_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        slug,
        bind('description', body.description),
        bannerColor,
        bind('button_label', body.button_label),
        bannerImageUrl,
        isActive,
        bind('auto_activate_from', body.auto_activate_from),
        bind('auto_deactivate_at', body.auto_deactivate_at),
      ]
    );

    const event = await dbQueryOne<EventRow>(`SELECT ${EVENT_COLUMNS} FROM events WHERE id = ?`, [id]);
    return NextResponse.json({ event: event ? toEvent(event) : null }, { status: 201 });
  } catch (err) {
    if (err instanceof BadInput) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Admin events POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
