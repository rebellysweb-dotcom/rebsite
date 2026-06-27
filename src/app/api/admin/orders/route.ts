import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/orders?page=1&limit=20&status=pending&search=REB-
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const session = await requireAdmin(supabase);
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = (() => {
      const p = parseInt(searchParams.get('page') ?? '1');
      return isNaN(p) ? 1 : Math.max(1, p);
    })();
    const limit = (() => {
      const l = parseInt(searchParams.get('limit') ?? '20');
      return isNaN(l) ? 20 : Math.min(100, l);
    })();
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // FIX H-13: Sanitize search to prevent ilike injection
    const safeSearch = (search || '').replace(/[%_,()]/g, '').slice(0, 100);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && status !== 'all') {
      query = query.eq('order_status', status);
    }
    if (safeSearch) {
      query = query.or(
        `order_number.ilike.%${safeSearch}%,customer_name.ilike.%${safeSearch}%`
      );
    }

    const { data: orders, count, error } = await query;

    if (error) {
      console.error('Admin orders fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders ?? [],
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error('Admin orders GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
