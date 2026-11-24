import { requireAdmin as betterAuthRequireAdmin } from '@/lib/auth/session';

export interface AdminSession {
  userId: string;
  role: string;
}

// Wrapper so existing callers don't need to change their import.
// Delegate to Better Auth session helper.
export async function requireAdmin(
  request: Request
): Promise<AdminSession | null> {
  const result = await betterAuthRequireAdmin(request);
  if (result.error || !result.user) return null;
  return {
    userId: result.user.id,
    role: (result.user as { role?: string }).role ?? 'admin',
  };
}
