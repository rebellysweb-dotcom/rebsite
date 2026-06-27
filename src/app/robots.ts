import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/', '/checkout/'],
      },
    ],
    sitemap: 'https://rebellys.com/sitemap.xml',
    host: 'https://rebellys.com',
  };
}
