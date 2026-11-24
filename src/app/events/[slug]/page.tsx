import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { dbQuery, dbQueryOne } from '@/lib/db';
import type { Event, EventProduct } from '@/types';
import ProductCard from '@/components/ProductCard';
import { JsonLd } from '@/components/JsonLd';
import { getEventSchema } from '@/lib/structured-data';

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
            {products.map((product) => (
              <div key={product.id} data-animate="fadeUp">
                <ProductCard product={{ ...product, is_event_product: true }} eventId={event.id} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No items available in this menu yet.</p>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card" style={{ height: '400px', background: 'rgba(45,10,30,0.05)', animation: 'pulseText 1.5s infinite' }}></div>
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
    <div style={{ padding: '6rem var(--px) 8rem', background: 'var(--cream)', minHeight: '100vh' }}>
      <div className="container">
        <div style={{
          background: event.banner_color || 'var(--rose-500)',
          color: '#fff',
          padding: '3rem',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          marginBottom: '4rem',
          boxShadow: 'var(--shadow-md)'
        }} data-animate="fadeIn">
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>Exclusive Menu</span>
          <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: '3rem', margin: '1rem 0' }}>{event.name}</h1>
          {event.description && (
            <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', opacity: 0.9 }}>
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
