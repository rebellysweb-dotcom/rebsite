import { Metadata } from 'next';
import { Suspense } from 'react';
import { dbQuery } from '@/lib/db';
import type { Product } from '@/types';
import CollectionsClient from './CollectionsClient';
import { JsonLd } from '@/components/JsonLd';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Flower Collections | Bouquets & Gift Boxes in Zalka',
  description: 'Christmas gifts, baskets, orchid arrangements and bouquets from Rebelly\'s, arranged by hand in Zalka for delivery across the Metn or pickup on Saydeh Street.',
  alternates: {
    canonical: 'https://rebellys.com/collections',
  },
  openGraph: {
    title: 'Flower Collections | Bouquets & Gift Boxes in Zalka',
    description: 'Christmas gifts, baskets, orchid arrangements and bouquets from Rebelly\'s, arranged by hand in Zalka for delivery across the Metn or pickup on Saydeh Street.',
    images: [{ url: 'https://rebellys.com/images/og.jpg', width: 1200, height: 630, alt: "Rebelly's flower collections" }],
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// D1 stores booleans as 0/1 and image_urls as a JSON string.
type ProductRow = Omit<Product, 'is_active' | 'image_urls'> & { is_active: number; image_urls: string };
const toProduct = (r: ProductRow): Product => ({
  ...r,
  is_active: !!r.is_active,
  image_urls: JSON.parse(r.image_urls || '[]'),
});

async function ProductGrid() {
  const { CATALOG_PRODUCTS } = await import('@/lib/catalog');
  let products: Product[] = [...CATALOG_PRODUCTS];

  try {
    const rows = await dbQuery<ProductRow>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order'
    );
    products = rows.length ? rows.map(toProduct) : CATALOG_PRODUCTS;
  } catch {
    // D1 unavailable: fall back to the built-in catalog
    products = CATALOG_PRODUCTS;
  }

  const itemListSchema = products.length > 0 ? {
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
      {products.length > 0 ? (
        <CollectionsClient products={products} />
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

