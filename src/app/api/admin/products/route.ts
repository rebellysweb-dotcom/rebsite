import { NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/images';
import { guardAdmin } from '@/lib/auth/session';
import { readJsonBody } from '@/lib/http';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SLUG_RE = /^[a-z0-9-]{1,100}$/

const MAX_PRICE = 100000;
const MAX_SORT = 100000;

function isSaneNumber(v: unknown, max: number, integer = false): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max && (!integer || Number.isInteger(v));
}

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

// GET /api/admin/products — list all products (including inactive)
export async function GET(request: Request) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const rows = await dbQuery<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY sort_order ASC`
    );
    const countRow = await dbQueryOne<{ total: number }>('SELECT COUNT(*) AS total FROM products');

    return NextResponse.json({
      products: rows.map(toProduct),
      total: countRow?.total ?? 0,
    });
  } catch (err) {
    console.error('Admin products GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/products — create product
export async function POST(request: Request) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const { name, slug, tag, description, image_url, price_usd, is_active, sort_order } = parsed.body;

    if (typeof name !== 'string' || !name.trim() || name.length > 200 || typeof slug !== 'string') {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }
    if (tag != null && (typeof tag !== 'string' || tag.length > 100)) {
      return NextResponse.json({ error: 'tag must be a string up to 100 characters' }, { status: 400 });
    }
    if (description != null && (typeof description !== 'string' || description.length > 5000)) {
      return NextResponse.json({ error: 'description must be a string up to 5000 characters' }, { status: 400 });
    }
    if (price_usd != null && !isSaneNumber(price_usd, MAX_PRICE)) {
      return NextResponse.json({ error: `price_usd must be a number between 0 and ${MAX_PRICE}` }, { status: 400 });
    }
    if (sort_order != null && !isSaneNumber(sort_order, MAX_SORT, true)) {
      return NextResponse.json({ error: `sort_order must be an integer between 0 and ${MAX_SORT}` }, { status: 400 });
    }
    if (is_active != null && typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 });
    }

    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
    }

    if (image_url != null && image_url !== '' && !isAllowedImageUrl(image_url)) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    try {
      // slug is UNIQUE, so a duplicate slug lands here and returns 500.
      await dbRun(
        'INSERT INTO products (id, name, slug, tag, description, image_url, image_urls, price_usd, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          name,
          slug,
          tag ?? null,
          description ?? null,
          image_url || null,
          '[]',
          price_usd ?? null,
          is_active === false ? 0 : 1,
          sort_order ?? 0,
        ]
      );
    } catch (error) {
      console.error('Product insert error:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    const row = await dbQueryOne<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`,
      [id]
    );
    if (!row) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ product: toProduct(row) }, { status: 201 });
  } catch (err) {
    console.error('Admin products POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
