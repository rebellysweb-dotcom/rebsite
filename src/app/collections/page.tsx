import { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';
import { JsonLd } from '@/components/JsonLd';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Flower Collections | Bouquets & Gift Boxes in Zalka',
  description: 'Explore Rebelly\'s romantic bouquets, floral gift boxes, mixed arrangements, and heart-shaped rose displays for delivery or pickup in Zalka and nearby areas.',
  alternates: {
    canonical: 'https://rebellys.com/collections',
  },
  openGraph: {
    title: 'Flower Collections | Bouquets & Gift Boxes in Zalka',
    description: 'Explore Rebelly\'s romantic bouquets, floral gift boxes, mixed arrangements, and heart-shaped rose displays for delivery or pickup in Zalka and nearby areas.',
    images: [{ url: 'https://rebellys.com/images/mixed_bouquet.png', width: 1200, height: 630, alt: "Rebelly's flower collections" }],
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

async function ProductGrid() {
  const { MOCK_PRODUCTS } = await import('@/lib/mock-data');
  let products = [...MOCK_PRODUCTS];

  try {
    const supabase = await createClient();
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    products = dbProducts?.length ? dbProducts : MOCK_PRODUCTS;
  } catch {
    products = MOCK_PRODUCTS;
  }

  const itemListSchema = products && products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: "Rebelly's Flower Collections",
    description: 'Browse our premium handcrafted floral arrangements',
    url: 'https://rebellys.com/collections',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: getProductSchema(p),
    })),
  } : null;

  return (
    <>
      {itemListSchema && <JsonLd data={itemListSchema} />}
      {products && products.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
          {products.map((product) => (
            <div key={product.id} data-animate="fadeUp">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No products available at the moment. Please check back later!</p>
        </div>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card" style={{ height: '400px', background: 'rgba(45,10,30,0.05)', animation: 'pulseText 1.5s infinite' }}></div>
      ))}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <div style={{ padding: '6rem var(--px) 8rem', background: 'var(--cream)', minHeight: '100vh' }}>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', url: 'https://rebellys.com' },
        { name: 'Collections', url: 'https://rebellys.com/collections' },
      ])} />
      <div className="container">
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">What We Offer</span>
          <h1 className="section-title">Our Signature<br /><em>Collections</em></h1>
          <p className="section-subtitle">
            Handcrafted with the finest blooms, each arrangement is a work of art designed to express what words cannot.
          </p>
        </div>

        <Suspense fallback={<GridSkeleton />}>
          <ProductGrid />
        </Suspense>
      </div>
    </div>
  );
}

