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
  description: 'Welcome to Rebelly\'s Flower Shop in Zalka, Lebanon. Discover our fresh bouquets, wedding florals, and event arrangements.',
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

const HEADLINE = ['Fresh.', 'Grown.', 'Gifted.'];

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
    text: 'Bespoke floral design for the day itself, shaped around your vision.',
    href: '/services',
    cta: 'See our services',
  },
  {
    name: 'Custom arrangements',
    text: 'Something specific in mind? Our florists will build the bouquet you are picturing.',
    href: '/contact',
    cta: 'Talk to a florist',
  },
  {
    name: 'Local delivery',
    text: 'Fresh to the door across Zalka and the surrounding Metn.',
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
            Arranged by hand in Zalka since 1990 — Christmas gifting, delivered to your door across the Metn.
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
          <h2 id="story-title" className={styles.h2} data-animate="fade-up">Rooted in passion</h2>
          <div data-animate="fade-left">
            <p className={styles.storyLede}>
              What started as a small neighbourhood florist has blossomed into a beloved local
              landmark. We pour our heart into every arrangement, and treat your moments as our own.
            </p>
            <Link href="/about" className={styles.textLink}>Read our story</Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED ─────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.featuredHead} data-animate="fade-up">
          <h2 id="featured-title" className={styles.h2}>Featured collections</h2>
          <Link href="/collections" className={styles.textLink}>View all flowers</Link>
        </div>

        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="services-title">
        <h2 id="services-title" className={styles.h2} data-animate="fade-up">What we do</h2>
        <ul className={styles.services} data-animate="stagger">
          {SERVICES.map((s) => (
            <li key={s.name} className={`${styles.service} stagger-item`}>
              <h3 className={styles.serviceName}>{s.name}</h3>
              <p className={styles.serviceText}>{s.text}</p>
              <Link href={s.href} className={styles.textLink}>{s.cta}</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── VOICE ────────────────────────────────────────────── */}
      <section className={styles.voice} aria-label="What customers say">
        <figure className={styles.voiceInner} data-animate="fade-up">
          <blockquote className={styles.quote}>
            &ldquo;Rebelly&apos;s never disappoints. The flowers are always so fresh, and the
            arrangements are absolutely stunning. They truly made my wedding day magical.&rdquo;
          </blockquote>
          <figcaption className={styles.cite}>Sarah M.</figcaption>
          <Link href="/reviews" className={styles.voiceLink}>Read more reviews</Link>
        </figure>
      </section>

      {/* ── CLOSE ────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.close}`} aria-labelledby="close-title">
        <div data-animate="scale-in">
          <h2 id="close-title" className={styles.h2}>Ready to bring joy?</h2>
          <p>Whether it is a celebration or a simple gesture, we are here to help you say it with flowers.</p>
          <Link href="/checkout" className="btn btn-primary">Start your order</Link>
        </div>
      </section>
    </>
  );
}
