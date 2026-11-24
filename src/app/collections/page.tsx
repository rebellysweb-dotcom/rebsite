import { Metadata } from 'next';
import { Suspense } from 'react';
import { dbQuery } from '@/lib/db';
import type { Product } from '@/types';
import { JsonLd } from '@/components/JsonLd';
import CollectionsClient from './CollectionsClient';
import styles from './page.module.css';
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
    const dbProducts = rows.map(toProduct);
    products = dbProducts.length ? dbProducts : CATALOG_PRODUCTS;
  } catch {
    products = CATALOG_PRODUCTS;
  }

  const itemListSchema = products && products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: "Rebelly's Flower Collections",
    description: 'Christmas gifts, baskets, orchids and bouquets arranged by hand in Zalka',
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
        <CollectionsClient products={products} />
      ) : (
        <div className={styles.empty}>
          <p>No products available at the moment. Please check back later!</p>
        </div>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className={styles.skeletonGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.skeleton} />
      ))}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <div className={styles.page}>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', url: 'https://rebellys.com' },
        { name: 'Collections', url: 'https://rebellys.com/collections' },
      ])} />
      <div className="container">
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">What We Offer</span>
          <h1 className="section-title">Our Signature<br /><em>Collections</em></h1>
          <p className="section-subtitle">
            Every arrangement is built by hand in our Zalka shop. Choose one, add it to your order, and we confirm the price on WhatsApp.
          </p>
        </div>

        <Suspense fallback={<GridSkeleton />}>
          <ProductGrid />
        </Suspense>
      </div>
    </div>
  );
}

