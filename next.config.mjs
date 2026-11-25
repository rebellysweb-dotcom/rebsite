// CLOUDFLARE WORKERS: Build with `npm run cf:build`, deploy with `npm run cf:deploy`
// Local dev: `npm run cf:dev`  |  Uses @opennextjs/cloudflare (not next-on-pages)

import { buildSecurityHeaders } from './src/lib/security-headers.mjs';

const isDev = process.env.NODE_ENV === 'development';

// Exact public hostname of the R2 bucket / custom domain (no scheme), read at build time.
const r2Host = process.env.R2_PUBLIC_HOST || undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
    remotePatterns: [
      ...(r2Host ? [{ protocol: 'https', hostname: r2Host }] : []),
      { protocol: 'https', hostname: 'images.rebellys.com' },
    ],
  },
  async headers() {
    if (isDev) return [];
    return [{ source: '/(.*)', headers: buildSecurityHeaders(r2Host) }];
  },
};

export default nextConfig;
