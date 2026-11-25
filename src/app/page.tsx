import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { dbQuery } from '@/lib/db';
import type { Product } from '@/types';
import { SHOP, telHref } from '@/lib/shop';
import { REVIEWS } from '@/lib/reviews';
import { GOOGLE, categoryOf, inBand, DELIVERY_NOTE } from '@/lib/storefront';
import { formatUsd, getBlurDataUrl } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = {
  title: 'Christmas Gifts & Fresh Flowers | Rebelly\'s Zalka',
  description: 'Christmas Specials from $15 and New Born gifts at $75, arranged by hand at Rebelly\'s Flower Shop on Saydeh Street, Zalka, since 1993. Order online; we confirm by phone or WhatsApp.',
  alternates: {
    canonical: 'https://rebellys.com/',
  },
};


export const revalidate = 300;

// D1 stores booleans as 0/1 and image_urls as a JSON string.
type ProductRow = Omit<Product, 'is_active' | 'image_urls'> & { is_active: number; image_urls: string };
const toProduct = (r: ProductRow): Product => ({
  ...r,
  is_active: !!r.is_active,
  image_urls: JSON.parse(r.image_urls || '[]'),
});

async function loadProducts(): Promise<Product[]> {
  const { CATALOG_PRODUCTS } = await import('@/lib/catalog');
  let products: Product[] = [...CATALOG_PRODUCTS];
  try {
    const rows = await dbQuery<ProductRow>('SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order');
    if (rows.length) products = rows.map(toProduct);
  } catch {
    // D1 unavailable: fall back to the built-in catalog
  }
  return products;
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '2rem' } as const;

const minPrice = (list: Product[]) => {
  const n = list.map((p) => p.price_usd).filter((v): v is number => v != null);
  return n.length ? Math.min(...n) : null;
};

async function ShopSections() {
  const products = await loadProducts();
  const christmas = products.filter((p) => categoryOf(p) === 'christmas');
  const newBorn = products.filter((p) => categoryOf(p) === 'new-born');
  const bands = [
    { label: 'Under $35', href: '/collections?price=u35', band: 'u35' as const },
    { label: '$35 – $100', href: '/collections?price=35-100', band: '35-100' as const },
    { label: 'Over $100', href: '/collections?price=100%2B', band: '100+' as const },
  ].map((b) => ({ ...b, count: products.filter((p) => inBand(p.price_usd, b.band)).length }));
  const xmasFrom = minPrice(christmas);
  const nbFrom = minPrice(newBorn);

  return (
    <>
      {/* CHRISTMAS SPECIALS */}
      <section className="container" style={{ padding: '4rem var(--px) 2rem' }}>
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">Shop Now</span>
          <h2 className="section-title">Christmas <em>Specials</em></h2>
          <p className="section-subtitle">
            {christmas.length} gifts{xmasFrom != null ? `, from ${formatUsd(xmasFrom)}` : ''}. Add to cart, then choose a free card or a balloon.
          </p>
        </div>

        <nav aria-label="Shop by budget" style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {bands.map((b) => (
            <Link key={b.band} href={b.href} className="btn btn-outline btn-sm" style={{ minHeight: '44px' }}>
              {b.label} ({b.count})
            </Link>
          ))}
        </nav>

        <div style={gridStyle}>
          {christmas.slice(0, 4).map((product) => (
            <div key={product.id} data-animate="fadeUp">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/collections?cat=christmas" className="btn btn-primary">See all {christmas.length} Christmas Specials</Link>
        </div>
      </section>

      {/* NEW BORN */}
      {newBorn.length > 0 && (
        <section className="container" style={{ padding: '3rem var(--px)', background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)' }}>
          <div className="section-header" data-animate="fadeUp">
            <span className="section-tag">For a Newborn</span>
            <h2 className="section-title">New <em>Born</em></h2>
            <p className="section-subtitle">
              Orchid or flower arrangements with a teddy bear{nbFrom != null ? `, ${formatUsd(nbFrom)}` : ''}. Add a balloon in your cart.
            </p>
          </div>
          <div style={gridStyle}>
            {newBorn.map((product) => (
              <div key={product.id} data-animate="fadeUp">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ProductsSkeleton() {
  return (
    <div className="container" style={{ ...gridStyle, padding: '4rem var(--px)' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card" style={{ height: '350px', background: 'rgba(45,10,30,0.05)', animation: 'pulseText 1.5s infinite' }}></div>
      ))}
    </div>
  );
}

// Verbatim Google review, attributed exactly as on /reviews.
const FEATURED_REVIEW = REVIEWS.find((r) => r.name === 'Christian Hobeika') ?? REVIEWS[0];

const STEPS = [
  ['1. Choose and order', 'Pick your gift, add a card or balloon, and send your order. No payment on the website.'],
  ['2. We confirm', `We call or WhatsApp you to confirm the total, delivery or pickup, and timing. ${DELIVERY_NOTE}`],
  ['3. Pay and receive', 'Pay with Whish or cash. We deliver, or you collect from our shop on Saydeh Street.'],
] as const;

const trustItem = { display: 'inline-flex', alignItems: 'center', minHeight: '44px' } as const;

export default function HomePage() {
  return (
    <>
      {/* HERO SECTION - Now loads instantly */}
      <section id="hero" className="hero-section" aria-label="Hero">
        <Image
          src="/images/shop_interior.jpg"
          alt="Rebelly's Flower Shop interior"
          className="hero-bg"
          fill
          priority
          style={{ objectFit: 'cover' }}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={getBlurDataUrl('#1a0910')}
        />
        <div className="hero-overlay"></div>
        <div className="hero-content" data-animate="fadeUp">
          <div className="hero-badge" style={{ marginBottom: '1.5rem' }}>Est. {SHOP.founded} · Zalka, Lebanon</div>
          <h1 className="section-title light">
            Where Every Bloom<br />
            <em>Tells a Story</em>
          </h1>
          <p className="section-subtitle" style={{ color: 'var(--cream-100)', margin: '0 auto 2rem' }}>
            Family-owned, crafted with love. Over 30 years of bringing joy
            through the finest fresh flowers in Lebanon.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/collections?cat=christmas" className="btn btn-primary">Shop Christmas Specials</Link>
            <a href={telHref} className="btn btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              Call to Order
            </a>
          </div>
        </div>
      </section>

      {/* TRUST STRIP: real facts only */}
      <section aria-label="Why order from us" style={{ background: 'var(--cream-100)', borderBottom: '1px solid rgba(233,30,140,.12)' }}>
        <ul className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 1.75rem', padding: '0.5rem var(--px)', margin: '0 auto', listStyle: 'none', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <li>
            <a href={GOOGLE.url} target="_blank" rel="noopener noreferrer" style={{ ...trustItem, color: 'var(--rose-700)', fontWeight: 600 }}>
              <span aria-hidden="true" style={{ color: '#fbbf24', marginRight: '4px' }}>★</span>{GOOGLE.rating} on Google ({GOOGLE.count} reviews)
            </a>
          </li>
          <li style={{ ...trustItem, minHeight: '30px' }}>Florist in Zalka since {SHOP.founded}</li>
          <li style={{ ...trustItem, minHeight: '30px' }}>{SHOP.address}</li>
          <li style={{ ...trustItem, minHeight: '30px' }}>Pay with Whish or cash</li>
        </ul>
      </section>

      {/* SHOP: what is for sale now, with prices */}
      <Suspense fallback={<ProductsSkeleton />}>
        <ShopSections />
      </Suspense>

      {/* FLORAL DIVIDER */}
      <div className="floral-divider" aria-hidden="true">
        <span>✿</span>
        <span>✿</span>
        <span>✿</span>
      </div>

      {/* HOW ORDERING WORKS */}
      <section className="container" style={{ padding: '3rem var(--px) 2rem' }}>
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">How It Works</span>
          <h2 className="section-title">Order in <em>three steps</em></h2>
        </div>
        <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
          {STEPS.map(([t, d]) => (
            <li key={t} className="card" style={{ padding: 'clamp(1.25rem, 5vw, 1.75rem)' }}>
              <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>{t}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ABOUT SECTION PREVIEW */}
      <section className="container" style={{ padding: '4rem var(--px)' }}>
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">Our Story</span>
          <h2 className="section-title">Rooted in <em>Passion</em></h2>
          <p className="section-subtitle">
            What started as a small neighborhood florist has blossomed into a beloved local landmark. We pour our heart into every arrangement, treating your special moments as our own.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/about" className="btn btn-outline">Read Our Full Story</Link>
          </div>
        </div>
      </section>

      {/* TODO(owner): delivery areas, fees and same-day cut-off. State them here and in checkout once known. */}
      {/* SERVICES PREVIEW */}
      <section className="container" style={{ padding: '3rem var(--px) 5rem' }}>
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">What We Do</span>
          <h2 className="section-title">Our <em>Services</em></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
          <div className="card" style={{ padding: 'clamp(1.25rem, 5vw, 2rem)' }}>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Weddings & Events</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Make your special day unforgettable with bespoke floral designs tailored to your vision.</p>
            <Link href="/services" style={{ fontWeight: 600, color: 'var(--rose-500)', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>Learn More →</Link>
          </div>
          <div className="card" style={{ padding: 'clamp(1.25rem, 5vw, 2rem)' }}>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Custom Arrangements</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Have something specific in mind? Let our expert florists bring your dream bouquet to life.</p>
            <Link href="/contact" style={{ fontWeight: 600, color: 'var(--rose-500)', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>Contact Us →</Link>
          </div>
          <div className="card" style={{ padding: 'clamp(1.25rem, 5vw, 2rem)' }}>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Delivery or Pickup</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Have it delivered, or collect it from our shop on Saydeh Street. We confirm the area, fee and time when we call you.</p>
            <Link href="/collections" style={{ fontWeight: 600, color: 'var(--rose-500)', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>Shop Now →</Link>
          </div>
        </div>
      </section>

      {/* REVIEWS PREVIEW: verbatim Google review, attributed as on /reviews */}
      <section style={{ background: 'var(--dark)', color: 'white', padding: '5rem var(--px)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="section-tag light">Google Reviews</span>
          <h2 className="section-title light" style={{ marginBottom: '2rem' }}>Loved by <em>Our Community</em></h2>
          <blockquote style={{ fontSize: '1.3rem', fontFamily: 'var(--ff-serif)', fontStyle: 'italic', maxWidth: '700px', margin: '0 auto 1.5rem' }}>
            {FEATURED_REVIEW.text}
          </blockquote>
          <p style={{ color: 'var(--rose-300)', fontWeight: 600 }}>
            — {FEATURED_REVIEW.name}, <span aria-label={`${FEATURED_REVIEW.rating} out of 5 stars`}>{FEATURED_REVIEW.stars}</span> on Google
          </p>
          <p style={{ marginTop: '1rem', color: 'var(--cream-100)' }}>
            <span aria-hidden="true" style={{ color: '#fbbf24' }}>★</span> {GOOGLE.rating} on Google Maps from {GOOGLE.count} reviews
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/reviews" className="btn btn-ghost">Read More Reviews</Link>
          </div>
        </div>
      </section>

      {/* ORDER CTA */}
      <section className="container" style={{ padding: '5rem var(--px)', textAlign: 'center' }}>
        <h2 className="section-title">Ready to bring <em>joy</em>?</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 2rem' }}>
          Whether it&apos;s a celebration or a simple gesture, we&apos;re here to help you say it with flowers.
        </p>
        <Link href="/collections" className="btn btn-primary" style={{ padding: '1rem clamp(1.5rem, 8vw, 3rem)', fontSize: '1.1rem' }}>Choose Your Gift</Link>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
          Or call us: <a href={telHref} style={{ color: 'var(--rose-500)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>{SHOP.phoneDisplay}</a>
        </p>
      </section>
    </>
  );
}
