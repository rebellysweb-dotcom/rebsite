import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Flowers | Rebelly\'s Flower Shop Zalka',
  description: 'Place a flower order online at Rebelly\'s. Choose your arrangements, add delivery or pickup details, and get email confirmation instantly.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  let settings = null;
  let products = MOCK_PRODUCTS;

  try {
    const supabase = await createClient();
    const { data: s } = await supabase.from('site_settings').select('*').single();
    if (s) settings = s;
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (dbProducts?.length) products = dbProducts;
  } catch {
    // Use defaults
  }

  return <CheckoutClient products={products} settings={settings} />;
}
