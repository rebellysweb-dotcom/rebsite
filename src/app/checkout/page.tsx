import { Metadata } from 'next';
import { dbQuery, dbQueryOne } from '@/lib/db';
import type { Product } from '@/types';
import CheckoutClient from './CheckoutClient';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Flowers | Rebelly\'s Flower Shop Zalka',
  description: 'Place a flower order online at Rebelly\'s. Choose your arrangements, add delivery or pickup details, and get email confirmation instantly.',
  robots: { index: false, follow: false },
};

// D1 stores booleans as 0/1 and image_urls as a JSON string.
type ProductRow = Omit<Product, 'is_active' | 'image_urls'> & { is_active: number; image_urls: string };
const toProduct = (r: ProductRow): Product => ({
  ...r,
  is_active: !!r.is_active,
  image_urls: JSON.parse(r.image_urls || '[]'),
});

export default async function CheckoutPage() {
  let settings = null;
  let products: Product[] = CATALOG_PRODUCTS;

  try {
    settings = await dbQueryOne('SELECT * FROM site_settings LIMIT 1');
    const rows = await dbQuery<ProductRow>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order'
    );
    const dbProducts = rows.map(toProduct);
    if (dbProducts.length) products = dbProducts;
  } catch {
    // Use defaults
  }

  return <CheckoutClient products={products} settings={settings} />;
}
