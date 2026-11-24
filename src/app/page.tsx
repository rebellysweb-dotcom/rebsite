import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense, type CSSProperties } from 'react';
import { dbQuery } from '@/lib/db';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Icon, { type IconName } from '@/components/icons/Icon';
import { getBlurDataUrl } from '@/lib/utils';
import { SHOP, whatsappHref } from '@/lib/shop';
import { photo } from '@/lib/portfolio';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Fresh Flowers & Bouquets | Rebelly\'s Zalka',
  description: 'Florist on Saydeh Street, Zalka, since 1993. Wedding and event decoration, bridal bouquets, hotel and home flowers, Christmas baskets, same-day delivery across the Metn. Order by WhatsApp.',
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

const CATEGORIES: { name: string; href: string; icon: IconName }[] = [
  { name: 'Christmas', href: '/collections', icon: 'christmas' },
  { name: 'New Born',  href: '/collections', icon: 'newborn' },
  { name: 'Bouquets',  href: '/collections', icon: 'bouquet' },
  { name: 'Events',    href: '/portfolio',   icon: 'events' },
];

const TRUST: { label: string; icon: IconName }[] = [
  { label: 'Since 1993',        icon: 'calendar' },
  { label: 'Same-day delivery', icon: 'truck' },
  { label: 'Cash on delivery',  icon: 'bag' },
  { label: 'WhatsApp orders',   icon: 'whatsapp' },
];

const WEDDING_STRIP = [photo('wedding-03-1'), photo('wedding-11-1'), photo('wedding-10-1')];

const SERVICES = [
  {
    name: 'Hotels and homes',
    text: 'Entrance pieces, tall vases and table flowers for hotels and private residences.',
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
  const { CATALOG_PRODUCTS } = await import('@/lib/catalog');
  let products: Product[] = CATALOG_PRODUCTS.slice(0, 4);

  try {
    const rows = await dbQuery<ProductRow>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order'
    );
    const dbProducts = rows.map(toProduct).slice(0, 4);
    if (dbProducts.length) products = dbProducts;
  } catch {
    // Fall back to the built-in catalog
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
            Arranged by hand in Zalka since {SHOP.founded}. Weddings, events and bouquets, delivered across the Metn.
          </p>

          <div className={`${styles.ctas} ${styles.fadeIn}`}>
            <Link href="/checkout" className="btn btn-primary">
              Order Now
              <Icon name="arrow-right" size={18} motion="nudge" />
            </Link>
            <Link href="/collections" className="btn btn-gold-outline">
              <Icon name="christmas" size={18} />
              Shop Christmas
            </Link>
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
            blurDataURL={getBlurDataUrl()}
          />
        </figure>
      </section>

      {/* ── SHOP BY OCCASION ─────────────────────────────── */}
      <nav aria-label="Shop by occasion" className={styles.catSection}>
        <ul className={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <li key={cat.name}>
              <Link href={cat.href} className={styles.catTile}>
                <span className={styles.catIcon}><Icon name={cat.icon} size={22} /></span>
                <span className={styles.catName}>{cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className={styles.trustStrip} aria-label="Trust signals">
        <ul className={styles.trustList}>
          {TRUST.map((t) => (
            <li key={t.label}>
              <Icon name={t.icon} size={18} />
              {t.label}
            </li>
          ))}
        </ul>
      </section>

      {/* ── STORY ────────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="story-title">
        <div className={styles.story}>
          <h2 id="story-title" className={styles.h2}>A flower story, since {SHOP.founded}</h2>
          <div>
            <p className={styles.storyLede}>
              Rebelly&apos;s decorates weddings and events, and makes bridal bouquets, vase arrangements and hand bouquets, all from our shop on Saydeh Street in Zalka. Walk in, call, or send us a WhatsApp photo of what you have in mind.
            </p>
            <Link href="/about" className={styles.textLink}>
              Read our story
              <Icon name="arrow-right" size={18} motion="nudge" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WEDDINGS & EVENTS ───────────────────────────────── */}
      <section className={styles.section} aria-labelledby="weddings-title">
        <div className={styles.weddingsHead}>
          <h2 id="weddings-title" className={styles.h2}>Weddings and events</h2>
          <div>
            <p className={styles.weddingsText}>
              With event planners we have decorated weddings and events in Lebanon, the UAE, Saudi Arabia, Qatar and France.
            </p>
            <Link href="/portfolio" className={styles.textLink}>
              See the portfolio
              <Icon name="arrow-right" size={18} motion="nudge" />
            </Link>
          </div>
        </div>
        <ul className={styles.weddingStrip}>
          {WEDDING_STRIP.map((p) => (
            <li key={p.id} className={styles.weddingPhoto}>
              <Image
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                className={styles.weddingImg}
                sizes="(min-width: 900px) 30vw, 92vw"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ── FEATURED ─────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.featuredHead}>
          <h2 id="featured-title" className={styles.h2}>Featured collections</h2>
          <Link href="/collections" className={styles.textLink}>
            View all flowers
            <Icon name="arrow-right" size={18} motion="nudge" />
          </Link>
        </div>

        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="services-title">
        <h2 id="services-title" className={styles.h2}>Hotels, homes, custom orders, delivery</h2>
        <ul className={styles.services}>
          {SERVICES.map((s) => (
            <li key={s.name} className={`${styles.service} stagger-item`}>
              <h3 className={styles.serviceName}>{s.name}</h3>
              <p className={styles.serviceText}>{s.text}</p>
              <Link href={s.href} className={styles.textLink}>
                {s.cta}
                <Icon name="arrow-right" size={18} motion="nudge" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── CLOSE ────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.close}`} aria-labelledby="close-title">
        <div>
          <h2 id="close-title" className={styles.h2}>Need flowers today?</h2>
          <p>Same-day delivery across the Metn, or message us on WhatsApp and we will put it together.</p>
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <Icon name="whatsapp" size={18} />
            Order on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
