// Single source of truth for which image URLs the app will store or render.
// Allowed: a site-local path under /images/, or an https URL on the configured R2 public host.

const LOCAL_IMAGE_RE = /^\/images\/[A-Za-z0-9/_.-]+$/;

export function isAllowedImageUrl(u: unknown): u is string {
  if (typeof u !== 'string' || u.length === 0 || u.length > 500) return false;

  if (u.startsWith('/')) {
    return LOCAL_IMAGE_RE.test(u) && !u.includes('..') && !u.includes('//');
  }

  const host = process.env.R2_PUBLIC_HOST;
  if (!host) return false;
  try {
    const parsed = new URL(u);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === host &&
      parsed.username === '' &&
      parsed.password === ''
    );
  } catch {
    return false;
  }
}
