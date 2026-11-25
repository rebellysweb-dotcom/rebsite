import { NextResponse } from 'next/server';
import { dbQueryOne, dbRun } from '@/lib/db';
import { guardAdmin } from '@/lib/auth/session';
import { readJsonBody, isValidEmail } from '@/lib/http';

export const dynamic = 'force-dynamic';

const SETTINGS_COLUMNS =
  'id, lbp_rate, whish_number, whatsapp_number, shop_phone, shop_address, shop_email, created_at, updated_at';

// Fixed allowlist. Only these names ever reach the SQL text.
const ALLOWED_FIELDS = [
  'lbp_rate', 'whish_number', 'whatsapp_number',
  'shop_phone', 'shop_address', 'shop_email',
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

const PHONE_RE = /^\d{7,15}$/;
const MAX_LEN: Record<AllowedField, number> = {
  lbp_rate: 20, whish_number: 15, whatsapp_number: 15,
  shop_phone: 30, shop_address: 300, shop_email: 254,
};

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
    const denied = await guardAdmin(request);
    if (denied) return denied;

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
    const denied = await guardAdmin(request);
    if (denied) return denied;

    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;

    const updates: Partial<Record<AllowedField, string | number>> = {};
    for (const field of ALLOWED_FIELDS) {
      if (!(field in body)) continue;
      const value = body[field];
      if (typeof value !== 'string' && typeof value !== 'number') {
        return NextResponse.json({ error: `${field} must be a string or number` }, { status: 400 });
      }
      const text = String(value).trim();
      if (typeof value === 'number' && !Number.isFinite(value)) {
        return NextResponse.json({ error: `${field} must be a finite number` }, { status: 400 });
      }
      if (text.length > MAX_LEN[field]) {
        return NextResponse.json({ error: `${field} must be at most ${MAX_LEN[field]} characters` }, { status: 400 });
      }
      if (field === 'lbp_rate') {
        const rate = Number(text);
        if (!Number.isFinite(rate) || rate <= 0 || rate > 100_000_000) {
          return NextResponse.json({ error: 'lbp_rate must be a positive number' }, { status: 400 });
        }
      }
      let stored: string | number = typeof value === 'number' ? value : text;
      if (field === 'whatsapp_number' || field === 'whish_number') {
        // Accept "+961 76-585-028" style input, store digits only (7-15, no + prefix).
        const digits = text.replace(/[\s\-()]/g, '').replace(/^\+/, '');
        stored = digits;
        if (!(field === 'whish_number' && digits === '') && !PHONE_RE.test(digits)) {
          return NextResponse.json({ error: `${field} must be digits only, 7-15 chars` }, { status: 400 });
        }
      }
      if (field === 'shop_email' && text !== '' && !isValidEmail(text)) {
        return NextResponse.json({ error: 'shop_email is invalid' }, { status: 400 });
      }
      updates[field] = stored;
    }

    const columns = (Object.keys(updates) as AllowedField[]);
    if (columns.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Column names come only from ALLOWED_FIELDS; values are bound parameters.
    // D1 ids are TEXT UUIDs, so target the singleton row by subquery.
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
