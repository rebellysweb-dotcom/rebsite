import type { MetadataRoute } from 'next';
import { dbQuery } from '@/lib/db';

export const revalidate = 3600
export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: 'https://rebellys.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://rebellys.com/collections',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://rebellys.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://rebellys.com/services',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://rebellys.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rebellys.com/reviews',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  try {
    // Dynamic event routes
    const events = await dbQuery<{ slug: string }>(
      'SELECT slug FROM events WHERE is_active = 1'
    );

    const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
      url: `https://rebellys.com/events/${event.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    }));

    return [...staticRoutes, ...eventRoutes];
  } catch {
    // If the database is unavailable, return static routes only
    return staticRoutes;
  }
}
