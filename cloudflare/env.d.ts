// Cloudflare bindings — available via `getCloudflareContext()` from @opennextjs/cloudflare. Global declaration: no import/export in this file.
// D1Database / R2Bucket types come from @cloudflare/workers-types (UNVERIFIED that it is
// pulled in transitively; add it to devDependencies if tsc reports them missing).

interface CloudflareEnv {
  // D1 database binding
  DB: D1Database;
  // R2 bucket for product images
  IMAGES: R2Bucket;
  // Environment
  ENVIRONMENT: string;
  // Auth secret (wrangler secret put AUTH_SECRET)
  AUTH_SECRET: string;
  // Public origin of the site (e.g. https://rebellys.com). Better Auth baseURL.
  BETTER_AUTH_URL?: string;
  // Comma-separated trusted origins for Better Auth (default https://rebellys.com).
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  // Exact public hostname of the R2 bucket serving product images (no scheme).
  R2_PUBLIC_HOST?: string;
  // Optional Cloudflare Turnstile secret for /api/contact (check skipped when unset).
  TURNSTILE_SECRET?: string;
  // Optional Cloudflare rate-limiting binding (burst guard in front of the D1 counters).
  RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  // Email (Resend)
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;
  // Business
  LOGO_EMAIL_URL?: string;
}
