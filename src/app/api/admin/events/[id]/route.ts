import { NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/images';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';
import { guardAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9-]{1,100}$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

const EVENT_COLUMNS =
  'id, name, slug, description, banner_color, button_label, banner_image_url, is_active, auto_activate_from, auto_deactivate_at, created_at';
const EVENT_PRODUCT_COLUMNS =
  'id, event_id, name, description, image_url, image_urls, price_usd, tag, sort_order, is_active, created_at';

interface EventRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_color: string;
  button_label: string | null;
  banner_image_url: string | null;
  is_active: number;
  auto_activate_from: string | null;
  auto_deactivate_at: string | null;
  created_at: string;
}

interface EventProductRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  image_urls: string; // JSON text in D1
  price_usd: number | null;
  tag: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
}

type DbValue = string | number | null;

class BadInput extends Error {}

function bind(field: string, value: unknown): DbValue {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  throw new BadInput(`${field} has an invalid type`);
}

function flag(field: string, value: unknown): 0 | 1 {
  if (typeof value !== 'boolean') throw new BadInput(`${field} must be a boolean`);
  return value ? 1 : 0;
}

function parseImageUrls(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toEvent(row: EventRow) {
  return { ...row, is_active: !!row.is_active };
}

function toEventProduct(row: EventProductRow) {
  return { ...row, image_urls: parseImageUrls(row.image_urls), is_active: !!row.is_active };
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


async function loadEventWithProducts(id: string) {
  const event = await dbQueryOne<EventRow>(`SELECT ${EVENT_COLUMNS} FROM events WHERE id = ?`, [id]);
  if (!event) return null;
  const products = await dbQuery<EventProductRow>(
    `SELECT ${EVENT_PRODUCT_COLUMNS} FROM event_products WHERE event_id = ? ORDER BY sort_order ASC`,
    [id]
  );
  return { ...toEvent(event), event_products: products.map(toEventProduct) };
}

// GET /api/admin/events/:id (includes event_products)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const event = await loadEventWithProducts(id);
    if (!event) {
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
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await readJsonObject(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Column names come only from this fixed allowlist, never from the request.
    const ALLOWED_FIELDS = [
      'name', 'slug', 'description', 'banner_color', 'button_label',
      'banner_image_url', 'is_active', 'auto_activate_from', 'auto_deactivate_at',
    ] as const;
    const FLAG_FIELDS: ReadonlySet<string> = new Set(['is_active']);

    const sets: string[] = [];
    const values: DbValue[] = [];
    for (const field of ALLOWED_FIELDS) {
      if (!(field in body)) continue;
      sets.push(`${field} = ?`);
      values.push(FLAG_FIELDS.has(field) ? flag(field, body[field]) : bind(field, body[field]));
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const slug = body.slug;
    if (slug !== undefined && (typeof slug !== 'string' || !SLUG_RE.test(slug))) {
      return NextResponse.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
    }

    const bannerColor = body.banner_color;
    if (bannerColor !== undefined && (typeof bannerColor !== 'string' || !HEX_COLOR_RE.test(bannerColor))) {
      return NextResponse.json({ error: 'banner_color must be a valid hex color' }, { status: 400 });
    }

    const bannerImage = body.banner_image_url;
    if (bannerImage != null && bannerImage !== '' && !isAllowedImageUrl(bannerImage)) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const result = await dbRun(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Event not found or update failed' }, { status: 404 });
    }

    const event = await loadEventWithProducts(id);
    return NextResponse.json({ event });
  } catch (err) {
    if (err instanceof BadInput) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Admin event PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/events/:id — deactivates the event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const result = await dbRun('UPDATE events SET is_active = 0 WHERE id = ?', [id]);
    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin event DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
