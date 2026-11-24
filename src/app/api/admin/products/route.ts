import { NextResponse } from 'next/server';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';
import { RLS } from '../../../../../cloudflare/rls-policies';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const SLUG_RE = /^[a-z0-9-]{1,100}$/

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

function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.protocol === 'https:' &&
      (u.hostname.endsWith('.r2.dev') || u.hostname === 'images.rebellys.com')
    )
  } catch {
    return false
  }
}

// GET /api/admin/products — list all products (including inactive)
export async function GET(request: Request) {
  try {
    // TODO(auth): x-user-role is a stub. Replace with the role from the verified JWT once auth lands;
    // middleware must strip and overwrite any client-supplied x-user-role, or this check is spoofable.
    const userRole = request.headers.get('x-user-role') ?? 'customer';
    if (!RLS.canWriteProducts(userRole).allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    // TODO(auth): x-user-role is a stub. See GET above.
    const userRole = request.headers.get('x-user-role') ?? 'customer';
    if (!RLS.canWriteProducts(userRole).allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, tag, description, image_url, price_usd, is_active, sort_order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
    }

    if (image_url && !isAllowedImageUrl(image_url)) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    try {
      // slug is UNIQUE, so a duplicate slug lands here and returns 500 like the Supabase version.
      await dbRun(
        'INSERT INTO products (id, name, slug, tag, description, image_url, image_urls, price_usd, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          name,
          slug,
          tag ?? null,
          description ?? null,
          image_url ?? null,
          '[]',
          price_usd ?? null,
          (is_active ?? true) ? 1 : 0,
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
