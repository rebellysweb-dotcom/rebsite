// Shared by next.config.mjs (static route headers) and src/middleware.ts (responses the
// middleware generates itself: 401 JSON and redirects). Plain .mjs so the Node-run config can import it.

/** @param {string | undefined} r2Host exact public hostname of the R2 bucket, e.g. cdn.example.com */
export function buildSecurityHeaders(r2Host) {
  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    r2Host ? `https://${r2Host}` : null,
    'https://images.rebellys.com',
    'https://*.posthog.com',
  ].filter(Boolean);

  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        // 'unsafe-inline' is kept for scripts: Next injects inline bootstrap/hydration scripts, and a
        // nonce-based CSP would force every page to render dynamically (no static/ISR caching) on Workers.
        // Revisit with a nonce once pages are dynamic anyway.
        "script-src 'self' 'unsafe-inline' https://*.posthog.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `img-src ${imgSrc.join(' ')}`,
        "connect-src 'self' https://*.posthog.com",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
  ];
}
