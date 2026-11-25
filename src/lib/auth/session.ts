import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import { RLS } from '@cloudflare/rls-policies';
import { createAuth, type AuthEnv } from './index';

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  return createAuth(env as unknown as AuthEnv);
}

// Accepts a Request or a Headers object (use `await headers()` in Server Components).
export async function getSession(source: Request | Headers) {
  const headers = source instanceof Headers ? source : source.headers;
  const auth = await getAuth();
  return auth.api.getSession({ headers });
}

export type AdminCheck =
  | { user: null; error: 'Unauthorized'; status: 401 }
  | { user: { id: string; name: string; email: string; role: string }; error: 'Forbidden'; status: 403 }
  | { user: { id: string; name: string; email: string; role: string }; error: null; status: 200 };

export async function requireAdmin(source: Request | Headers): Promise<AdminCheck> {
  const session = await getSession(source);
  if (!session?.user) {
    return { user: null, error: 'Unauthorized', status: 401 };
  }
  const user = session.user as { id: string; name: string; email: string; role?: string };
  const role = user.role ?? 'customer';
  const safeUser = { id: user.id, name: user.name, email: user.email, role };
  if (role !== 'admin') {
    return { user: safeUser, error: 'Forbidden', status: 403 };
  }
  return { user: safeUser, error: null, status: 200 };
}

// Shared guard for every admin route handler and admin server page.
// Identity comes from the verified Better Auth session only (never from request headers);
// the role decision goes through the RLS policy module. Returns a response to send on denial, or null.
export async function guardAdmin(source: Request | Headers): Promise<NextResponse | null> {
  const auth = await requireAdmin(source);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!RLS.canWriteAdminContent(auth.user.role).allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// For Server Components: redirects instead of returning a response. Call before any data read.
export async function assertAdminPage(source: Headers): Promise<void> {
  const { redirect } = await import('next/navigation');
  const check = await requireAdmin(source);
  if (check.status === 401) redirect('/admin/login');
  if (check.status === 403) redirect('/');
}

// Optional user id for public routes (guest checkout): the session user or null. Never trusts headers.
export async function getSessionUserId(request: Request): Promise<string | null> {
  try {
    const session = await getSession(request);
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
