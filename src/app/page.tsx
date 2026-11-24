import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense, type CSSProperties } from 'react';
import { dbQuery } from '@/lib/db';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { getBlurDataUrl } from '@/lib/utils';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Fresh Flowers & Bouquets | Rebelly\'s Zalka',
  description: 'Flower shop on Saydeh Street, Zalka, since 1990. Bouquets, wedding and event flowers, Christmas baskets, same-day delivery across the Metn. Order by WhatsApp.',
  alternates: {
    canonical: 'https://rebellys.com/',
  },
};

export const runtime = 'edge';
export const revalidate = 300;

// D1 stores booleans as 0/1 and image_urls as a JSON string.
type ProductRow = Omit<Product, 'is_active' | 'image_urls'> & { is_active: number; image_urls: string };
const toProduct = (r: ProductRow): Product => ({
  ...r,
  is_active: !!r.is_active,
  image_urls: JSON.parse(r.image_urls || '[]'),
});

const HEADLINE = ['Flowers', 'from', 'Zalka.'];

const CATEGORIES = [
  {
    name: 'Christmas',
    href: '/collections',
    icon: (
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l3 5h3l-3 3 1.5 5L12 14l-4.5 2L9 11l-3-3h3z"/>
        <line x1="12" y1="14" x2="12" y2="21"/>
        <line x1="9" y1="21" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    name: 'New Born',
    href: '/collections',
    icon: (
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2C9.5 2 7.5 4 7.5 6.5S9.5 11 12 11s4.5-2 4.5-4.5S14.5 2 12 2z"/>
        <path d="M4.5 22c0-3.5 3.4-6 7.5-6s7.5 2.5 7.5 6"/>
        <circle cx="12" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    name: 'Bouquets',
    href: '/collections',
    icon: (
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="7" r="3"/>
        <circle cx="7" cy="10.5" r="2.5"/>
        <circle cx="17" cy="10.5" r="2.5"/>
        <line x1="12" y1="10" x2="12" y2="20"/>
        <path d="M9 20h6"/>
      </svg>
    ),
  },
  {
    name: 'Events',
    href: '/services',
    icon: (
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l2.5 7H22l-6 4.5 2.3 7-6.3-4-6.3 4 2.3-7L2 9h7.5z"/>
      </svg>
    ),
  },
];

const SERVICES = [
  {
    name: 'Weddings and events',
    text: 'Bridal bouquets, church and venue flowers. Visit the shop to plan it with us.',
    href: '/services',
    cta: 'See our services',
  },
  {
    name: 'Custom arrangements',
    text: 'Send a photo or a colour on WhatsApp and we will build it.',
    href: '/contact',
    cta: 'Talk to a florist',
  },
  {
    name: 'Local delivery',
    text: 'Same-day delivery in Zalka, Antelias, Dbayeh and across the Metn.',
    href: '/checkout',
    cta: 'Order for delivery',
  },
];

async function FeaturedProducts() {
  const { MOCK_PRODUCTS } = await import('@/lib/mock-data');
  let products: Product[] = MOCK_PRODUCTS.slice(0, 4);

  try {
    const rows = await dbQuery<ProductRow>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order'
    );
    const dbProducts = rows.map(toProduct).slice(0, 4);
    if (dbProducts.length) products = dbProducts;
  } catch {
    // Fall back to mock products
  }

  return (
    <div className={styles.rail}>
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className={styles.rail} aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={styles.skeleton} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="hero" className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <h1 id="hero-title" className={styles.headline} aria-label={HEADLINE.join(' ')}>
            {HEADLINE.map((word, i) => (
              <span key={word} className={styles.word} aria-hidden="true">
                <span className={styles.wordInner} style={{ '--i': i } as CSSProperties}>
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <p className={`${styles.sub} ${styles.fadeIn}`}>
            Arranged by hand in Zalka since 1990. Christmas gifts delivered across the Metn.
          </p>

          <div className={`${styles.ctas} ${styles.fadeIn}`}>
            <Link href="/checkout" className="btn btn-primary">Order Now</Link>
            <Link href="/collections" className="btn btn-gold-outline">Shop Christmas</Link>
          </div>
        </div>

        <figure className={styles.arch}>
          <Image
            src="/images/products/christmas-basket.jpg"
            alt="A festive Christmas gift basket with Ksara wine, chocolates, and seasonal greenery"
            className={styles.archImg}
            fill
            priority
            sizes="(min-width: 768px) 460px, 72vw"
            placeholder="blur"
            blurDataURL={getBlurDataUrl('#8b2020')}
          />
        </figure>
      </section>

      {/* ── SHOP BY OCCASION ─────────────────────────────── */}
      <nav aria-label="Shop by occasion" className={styles.catSection}>
        <ul className={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <li key={cat.name}>
              <Link href={cat.href} className={styles.catTile}>
                <span className={styles.catIcon} aria-hidden="true">{cat.icon}</span>
                <span className={styles.catName}>{cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className={styles.trustStrip} aria-label="Trust signals">
        <ul className={styles.trustList}>
          <li>Est. 1990</li>
          <li>Same-day delivery</li>
          <li>Cash on delivery</li>
          <li>WhatsApp orders</li>
        </ul>
      </section>

      {/* ── STORY ────────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="story-title">
        <div className={styles.story}>
          <h2 id="story-title" className={styles.h2}>Same shop on Saydeh Street since 1990</h2>
          <div>
            <p className={styles.storyLede}>
              Every bouquet is built by hand in our Zalka shop. Walk in, call, or send us a WhatsApp photo of what you have in mind.
            </p>
            <Link href="/about" className={styles.textLink}>Read our story</Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED ─────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.featuredHead}>
          <h2 id="featured-title" className={styles.h2}>Featured collections</h2>
          <Link href="/collections" className={styles.textLink}>View all flowers</Link>
        </div>

        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="services-title">
        <h2 id="services-title" className={styles.h2}>Weddings, custom orders, delivery</h2>
        <ul className={styles.services}>
          {SERVICES.map((s) => (
            <li key={s.name} className={`${styles.service} stagger-item`}>
              <h3 className={styles.serviceName}>{s.name}</h3>
              <p className={styles.serviceText}>{s.text}</p>
              <Link href={s.href} className={styles.textLink}>{s.cta}</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── CLOSE ────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.close}`} aria-labelledby="close-title">
        <div>
          <h2 id="close-title" className={styles.h2}>Need flowers today?</h2>
          <p>Same-day delivery across the Metn, or message us on WhatsApp and we will put it together.</p>
          <a href="https://wa.me/96176585028" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Order on WhatsApp</a>
        </div>
      </section>
    </>
  );
}
