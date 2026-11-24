import { NextResponse } from 'next/server';
import { dbQueryOne, dbRun } from '@/lib/db';
import { RLS } from '../../../../../cloudflare/rls-policies';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const SETTINGS_COLUMNS =
  'id, lbp_rate, whish_number, whatsapp_number, shop_phone, shop_address, shop_email, created_at, updated_at';

// Fixed allowlist. Only these names ever reach the SQL text.
const ALLOWED_FIELDS = [
  'lbp_rate', 'whish_number', 'whatsapp_number',
  'shop_phone', 'shop_address', 'shop_email',
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

interface SettingsRow {
  id: string;
  lbp_rate: string;
  whish_number: string;
  whatsapp_number: string;
  shop_phone: string;
  shop_address: string;
  shop_email: string;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/settings
export async function GET(request: Request) {
  try {
    // TODO(auth): x-user-role is a stub. Replace with the role from the verified JWT once auth lands;
    // middleware must strip and overwrite any client-supplied x-user-role, or this check is spoofable.
    const userRole = request.headers.get('x-user-role') ?? 'customer';
    // Same admin-only gate the Supabase requireAdmin() enforced on this GET.
    if (!RLS.canWriteAdminContent(userRole).allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // site_settings is a singleton row
    const settings = await dbQueryOne<SettingsRow>(
      `SELECT ${SETTINGS_COLUMNS} FROM site_settings LIMIT 1`
    );
    if (!settings) {
      console.error('Admin settings GET: no site_settings row');
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('Admin settings GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/settings
export async function PATCH(request: Request) {
  try {
    // TODO(auth): x-user-role is a stub. See GET above.
    const userRole = request.headers.get('x-user-role') ?? 'customer';
    if (!RLS.canWriteAdminContent(userRole).allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const updates: Partial<Record<AllowedField, string | number>> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        const value = body[field];
        if (typeof value !== 'string' && typeof value !== 'number') {
          return NextResponse.json({ error: `${field} must be a string or number` }, { status: 400 });
        }
        updates[field] = value;
      }
    }

    const columns = (Object.keys(updates) as AllowedField[]);
    if (columns.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const PHONE_RE = /^\d{7,15}$/
    if ('whatsapp_number' in body && !PHONE_RE.test(String(body.whatsapp_number))) {
      return NextResponse.json({ error: 'whatsapp_number must be digits only, 7-15 chars' }, { status: 400 });
    }

    // Column names come only from ALLOWED_FIELDS; values are bound parameters.
    // The Supabase `.eq('id', 1)` does not apply: D1 ids are TEXT UUIDs, so target the singleton row by subquery.
    const setSql = columns.map((c) => `${c} = ?`).join(', ');
    const result = await dbRun(
      `UPDATE site_settings SET ${setSql}, updated_at = datetime('now') WHERE id = (SELECT id FROM site_settings LIMIT 1)`,
      columns.map((c) => updates[c] as string | number)
    );
    if (result.meta.changes === 0) {
      console.error('Settings update: no site_settings row matched');
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    const settings = await dbQueryOne<SettingsRow>(
      `SELECT ${SETTINGS_COLUMNS} FROM site_settings LIMIT 1`
    );

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('Admin settings PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
