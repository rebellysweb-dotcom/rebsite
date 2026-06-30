import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const SLUG_RE = /^[a-z0-9-]{1,100}$/

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

// GET /api/admin/products — list all products (including inactive)
export async function GET() {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: products, count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products: products ?? [], total: count ?? 0 });
  } catch (err) {
    console.error('Admin products GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/products — create product
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        tag: tag ?? null,
        description: description ?? null,
        image_url: image_url ?? null,
        price_usd: price_usd ?? null,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Product insert error:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error('Admin products POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
