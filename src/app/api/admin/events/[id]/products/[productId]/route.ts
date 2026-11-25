import { NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/images';
import { dbQueryOne, dbRun } from '@/lib/db';
import { guardAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVENT_PRODUCT_COLUMNS =
  'id, event_id, name, description, image_url, image_urls, price_usd, tag, sort_order, is_active, created_at';

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
  is_active: number; // INTEGER 0/1 in D1
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


async function loadProduct(eventId: string, productId: string) {
  const row = await dbQueryOne<EventProductRow>(
    `SELECT ${EVENT_PRODUCT_COLUMNS} FROM event_products WHERE id = ? AND event_id = ?`,
    [productId, eventId]
  );
  return row ? toEventProduct(row) : null;
}

// GET /api/admin/events/:id/products/:productId
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id, productId } = await params;
    if (!UUID_RE.test(id) || !UUID_RE.test(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const product = await loadProduct(id, productId);
    if (!product) {
      return NextResponse.json({ error: 'Event product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error('Event product GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/events/:id/products/:productId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id, productId } = await params;
    if (!UUID_RE.test(id) || !UUID_RE.test(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await readJsonObject(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Column names come only from this fixed allowlist, never from the request.
    const ALLOWED_FIELDS = ['name', 'description', 'image_url', 'price_usd', 'tag', 'sort_order', 'is_active'] as const;
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

    const imageUrl = body.image_url;
    if (imageUrl && (typeof imageUrl !== 'string' || !isAllowedImageUrl(imageUrl))) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    // Scoped to the parent event so a product id from another event cannot be changed through this path.
    const result = await dbRun(
      `UPDATE event_products SET ${sets.join(', ')} WHERE id = ? AND event_id = ?`,
      [...values, productId, id]
    );
    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Event product not found or update failed' }, { status: 404 });
    }

    const product = await loadProduct(id, productId);
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof BadInput) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Event product PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/events/:id/products/:productId
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id, productId } = await params;
    if (!UUID_RE.test(id) || !UUID_RE.test(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const result = await dbRun('DELETE FROM event_products WHERE id = ? AND event_id = ?', [productId, id]);
    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Event product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Event product DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
