import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
    const supabase = await createClient();

    // Dynamic event routes
    const { data: events } = await supabase
      .from('events')
      .select('slug, created_at')
      .eq('is_active', true);

    const eventRoutes: MetadataRoute.Sitemap =
      events?.map((event) => ({
        url: `https://rebellys.com/events/${event.slug}`,
        lastModified: new Date(event.created_at),
        changeFrequency: 'daily' as const,
        priority: 0.85,
      })) ?? [];

    return [...staticRoutes, ...eventRoutes];
  } catch {
    // If Supabase is unavailable, return static routes only
    return staticRoutes;
  }
}
