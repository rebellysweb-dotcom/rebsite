import { getCloudflareContext } from '@opennextjs/cloudflare';
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
