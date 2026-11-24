import { Metadata } from 'next';
import { Suspense } from 'react';
import { dbQuery } from '@/lib/db';
import type { Product } from '@/types';
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
export const runtime = 'edge';

// D1 stores booleans as 0/1 and image_urls as a JSON string.
type ProductRow = Omit<Product, 'is_active' | 'image_urls'> & { is_active: number; image_urls: string };
const toProduct = (r: ProductRow): Product => ({
  ...r,
  is_active: !!r.is_active,
  image_urls: JSON.parse(r.image_urls || '[]'),
});

async function ProductGrid() {
  const { MOCK_PRODUCTS } = await import('@/lib/mock-data');
  let products: Product[] = [...MOCK_PRODUCTS];

  try {
    const rows = await dbQuery<ProductRow>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order'
    );
    const dbProducts = rows.map(toProduct);
    products = dbProducts.length ? dbProducts : MOCK_PRODUCTS;
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 'clamp(16px, 3vw, 32px)' }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 'clamp(16px, 3vw, 32px)' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ aspectRatio: '3 / 4.9', borderRadius: 'var(--radius-lg)', background: 'var(--rose-200)', opacity: 0.5, animation: 'pulseText 1.5s infinite' }}></div>
      ))}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <div style={{ padding: 'calc(var(--nav-h) + 3rem) var(--px) 8rem', minHeight: '100dvh' }}>
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

