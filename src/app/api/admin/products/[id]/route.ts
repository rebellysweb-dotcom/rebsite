import { NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/images';
import { dbQueryOne, dbRun } from '@/lib/db';
import { guardAdmin } from '@/lib/auth/session';
import { readJsonBody } from '@/lib/http';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9-]{1,100}$/;

const PRODUCT_COLUMNS =
  'id, name, slug, tag, description, image_url, image_urls, price_usd, is_active, sort_order, created_at, updated_at';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  tag: string | null;
  description: string | null;
  image_url: string | null;
  image_urls: string; // JSON text in D1
  price_usd: number | null;
  is_active: number; // INTEGER 0/1 in D1
  sort_order: number;
  created_at: string;
  updated_at: string;
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

function toProduct(row: ProductRow) {
  return { ...row, image_urls: parseImageUrls(row.image_urls), is_active: !!row.is_active };
}


async function loadProduct(id: string) {
  const row = await dbQueryOne<ProductRow>(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`, [id]);
  return row ? toProduct(row) : null;
}

// GET /api/admin/products/:id
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

    const product = await loadProduct(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error('Admin product GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/products/:id — partial update
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

    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;

    // Column names come only from this fixed allowlist, never from the request.
    const ALLOWED_FIELDS = ['name', 'slug', 'tag', 'description', 'image_url', 'price_usd', 'is_active', 'sort_order'] as const;
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

    const imageUrl = body.image_url;
    if (imageUrl != null && imageUrl !== '' && !isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const price = body.price_usd;
    if (price != null && !(typeof price === 'number' && Number.isFinite(price) && price >= 0 && price <= 100000)) {
      return NextResponse.json({ error: 'price_usd must be a number between 0 and 100000' }, { status: 400 });
    }
    const sortOrder = body.sort_order;
    if (sortOrder != null && !(typeof sortOrder === 'number' && Number.isInteger(sortOrder) && sortOrder >= 0 && sortOrder <= 100000)) {
      return NextResponse.json({ error: 'sort_order must be an integer between 0 and 100000' }, { status: 400 });
    }
    for (const [field, max] of [['name', 200], ['tag', 100], ['description', 5000]] as const) {
      const v = body[field];
      if (v != null && (typeof v !== 'string' || v.length > max)) {
        return NextResponse.json({ error: `${field} must be a string up to ${max} characters` }, { status: 400 });
      }
    }
    if (body.name !== undefined && (body.name === null || body.name === '')) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
    }

    sets.push("updated_at = datetime('now')");
    const result = await dbRun(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Product not found or update failed' }, { status: 404 });
    }

    const product = await loadProduct(id);
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof BadInput) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Admin product PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/products/:id — soft delete (sets is_active = 0)
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

    const result = await dbRun(
      "UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
      [id]
    );
    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin product DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
