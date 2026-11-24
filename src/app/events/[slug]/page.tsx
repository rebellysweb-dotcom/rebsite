import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { dbQuery, dbQueryOne } from '@/lib/db';
import type { Event, EventProduct } from '@/types';
import ProductCard from '@/components/ProductCard';
import { JsonLd } from '@/components/JsonLd';
import { getEventSchema } from '@/lib/structured-data';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// D1 stores booleans as 0/1 and image_urls as a JSON string.
type EventRow = Omit<Event, 'is_active' | 'event_products'> & { is_active: number };
type EventProductRow = Omit<EventProduct, 'is_active' | 'image_urls'> & { is_active: number; image_urls: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const event = await dbQueryOne<{ name: string }>(
      'SELECT name FROM events WHERE slug = ? AND is_active = 1',
      [slug]
    );
    if (!event) return { title: "Event Not Found | Rebelly's" };
    return {
      title: `${event.name} Menu | Rebelly's Flower Shop`,
      description: `Exclusive menu for ${event.name} at Rebelly's Flower Shop.`,
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Event | Rebelly's Flower Shop" };
  }
}

async function EventProductsGrid({ event }: { event: Event }) {
  try {
    const rows = await dbQuery<EventProductRow>(
      'SELECT * FROM event_products WHERE event_id = ? AND is_active = 1 ORDER BY sort_order',
      [event.id]
    );

    const products = rows.map((r) => ({
      ...r,
      is_active: !!r.is_active,
      image_urls: JSON.parse(r.image_urls || '[]') as string[],
    }));

    return (
      <>
        <JsonLd data={getEventSchema(event)} />
        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <div key={product.id} data-animate="fadeUp">
                <ProductCard product={{ ...product, is_event_product: true }} eventId={event.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No items available in this menu yet.</p>
          </div>
        )}
      </>
    );
  } catch {
    return null;
  }
}

function GridSkeleton() {
  return (
    <div className={styles.grid}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className={styles.skeleton} />
      ))}
    </div>
  );
}

export default async function EventMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let event: Event | null = null;
  try {
    const row = await dbQueryOne<EventRow>(
      'SELECT * FROM events WHERE slug = ? AND is_active = 1',
      [slug]
    );
    event = row ? { ...row, is_active: !!row.is_active } : null;
  } catch {
    notFound();
  }

  if (!event) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.banner} style={event.banner_color ? { background: event.banner_color } : undefined} data-animate="fadeIn">
          <span className={styles.kicker}>Exclusive menu</span>
          <h1 className={styles.bannerTitle}>{event.name}</h1>
          {event.description && (
            <p className={styles.bannerText}>
              {event.description}
            </p>
          )}
        </div>

        <Suspense fallback={<GridSkeleton />}>
          <EventProductsGrid event={event} />
        </Suspense>
      </div>
    </div>
  );
}
