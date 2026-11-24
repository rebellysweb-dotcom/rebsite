// Cloudflare bindings — available via `getRequestContext()` (or `getCloudflareContext()`)
// from @cloudflare/next-on-pages. Global declaration: no import/export in this file.
// D1Database / R2Bucket types come from @cloudflare/workers-types (UNVERIFIED that it is
// pulled in transitively; add it to devDependencies if tsc reports them missing).

interface CloudflareEnv {
  // D1 database binding
  DB: D1Database;
  // R2 bucket for product images
  IMAGES: R2Bucket;
  // Environment
  ENVIRONMENT: string;
  // Auth secret (set in Cloudflare Pages dashboard)
  AUTH_SECRET: string;
  // Email (Resend)
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;
  // Business
  LOGO_EMAIL_URL?: string;
}
