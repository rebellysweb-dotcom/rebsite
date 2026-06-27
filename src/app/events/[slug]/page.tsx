import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';
import { JsonLd } from '@/components/JsonLd';
import { getEventSchema } from '@/lib/structured-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data: event } = await supabase.from('events').select('name').eq('slug', slug).single();
    if (!event) return { title: "Event Not Found | Rebelly's" };
    return {
      title: `${event.name} Menu | Rebelly's Flower Shop`,
      description: `Exclusive menu for ${event.name} at Rebelly's Flower Shop.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Event | Rebelly's Flower Shop" };
  }
}

async function EventProductsGrid({ slug, eventId }: { slug: string; eventId: string }) {
  try {
    const supabase = await createClient();
    const { data: event } = await supabase
      .from('events')
      .select('*, event_products(*)')
      .eq('slug', slug)
      .single();

    if (!event) return null;

    const products = event.event_products?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

    return (
      <>
        <JsonLd data={getEventSchema(event)} />
        {products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
            {products.map((product: any) => (
              <div key={product.id} data-animate="fadeUp">
                <ProductCard product={{ ...product, is_event_product: true }} eventId={eventId} />
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

  let event: { id: string; name: string; description: string | null; banner_color: string; is_active: boolean } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('events')
      .select('id, name, description, banner_color, is_active')
      .eq('slug', slug)
      .single();
    event = data;
  } catch {
    notFound();
  }

  if (!event || !event.is_active) {
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
          <EventProductsGrid slug={slug} eventId={event.id} />
        </Suspense>
      </div>
    </div>
  );
}
