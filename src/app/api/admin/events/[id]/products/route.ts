import { NextResponse } from 'next/server';
import { dbQuery, dbQueryOne, dbRun } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { RLS } from '@cloudflare/rls-policies';

export const runtime = 'edge';
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

function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      (u.hostname.endsWith('.supabase.co') || u.hostname === 'lh3.googleusercontent.com')
    );
  } catch {
    return false;
  }
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

// Authentication comes from the verified Better Auth session, not from request headers.
// The role check goes through the RLS policy.
async function guardAdmin(request: Request): Promise<NextResponse | null> {
  const auth = await requireAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!RLS.canWriteAdminContent(auth.user.role).allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// GET /api/admin/events/:id/products — list all products for this event
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

    const rows = await dbQuery<EventProductRow>(
      `SELECT ${EVENT_PRODUCT_COLUMNS} FROM event_products WHERE event_id = ? ORDER BY sort_order ASC`,
      [id]
    );

    return NextResponse.json({ products: rows.map(toEventProduct) });
  } catch (err) {
    console.error('Event products GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/events/:id/products — add product to event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const { id: eventId } = await params;
    if (!UUID_RE.test(eventId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await readJsonObject(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name } = body;
    if (typeof name !== 'string' || !name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const imageUrl = body.image_url || null;
    if (imageUrl !== null && (typeof imageUrl !== 'string' || !isAllowedImageUrl(imageUrl))) {
      return NextResponse.json({ error: 'image_url must be from an allowed domain' }, { status: 400 });
    }

    // D1 would reject the insert with a foreign-key error (500). Return a clear 404 instead.
    const event = await dbQueryOne<{ id: string }>('SELECT id FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const id = crypto.randomUUID();
    const isActive = body.is_active === undefined ? 1 : flag('is_active', body.is_active);
    await dbRun(
      `INSERT INTO event_products (id, event_id, name, description, image_url, image_urls, price_usd, tag, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        name,
        bind('description', body.description),
        imageUrl,
        '[]',
        bind('price_usd', body.price_usd),
        bind('tag', body.tag),
        body.sort_order === undefined ? 0 : (bind('sort_order', body.sort_order) ?? 0),
        isActive,
      ]
    );

    const product = await dbQueryOne<EventProductRow>(
      `SELECT ${EVENT_PRODUCT_COLUMNS} FROM event_products WHERE id = ?`,
      [id]
    );
    return NextResponse.json({ product: product ? toEventProduct(product) : null }, { status: 201 });
  } catch (err) {
    if (err instanceof BadInput) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Event products POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
