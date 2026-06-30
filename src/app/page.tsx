import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';
import { getBlurDataUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Fresh Flowers & Bouquets | Rebelly\'s Zalka',
  description: 'Welcome to Rebelly\'s Flower Shop in Zalka, Lebanon. Discover our fresh bouquets, wedding florals, and event arrangements.',
  alternates: {
    canonical: 'https://rebellys.com/',
  },
};

export const revalidate = 300;

async function FeaturedProducts() {
  const { MOCK_PRODUCTS } = await import('@/lib/mock-data');
  let products = MOCK_PRODUCTS.slice(0, 4);

  try {
    const supabase = await createClient();
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(4);
    if (dbProducts?.length) products = dbProducts;
  } catch {
    // Fall back to mock products
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
      {products?.map((product) => (
        <div key={product.id} data-animate="fadeUp">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card" style={{ height: '350px', background: 'rgba(45,10,30,0.05)', animation: 'pulseText 1.5s infinite' }}></div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* HERO SECTION - Now loads instantly */}
      <section id="hero" className="hero-section" aria-label="Hero">
        <Image
          src="/images/shop_interior.png"
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
          <div className="hero-badge" style={{ marginBottom: '1.5rem' }}>Est. 1990 · Zalka, Lebanon</div>
          <h1 className="section-title light">
            Where Every Bloom<br />
            <em>Tells a Story</em>
          </h1>
          <p className="section-subtitle" style={{ color: 'var(--cream-100)', margin: '0 auto 2rem' }}>
            Family-owned, crafted with love. Over 30 years of bringing joy
            through the finest fresh flowers in Lebanon.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/collections" className="btn btn-primary">Explore Collections</Link>
            <Link href="/checkout" className="btn btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* FLORAL DIVIDER */}
      <div className="floral-divider" aria-hidden="true">
        <span>✿</span>
        <span>✿</span>
        <span>✿</span>
      </div>

      {/* ABOUT SECTION PREVIEW */}
      <section className="container" style={{ padding: '5rem var(--px)' }}>
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

      {/* COLLECTIONS PREVIEW */}
      <section className="container" style={{ padding: '5rem var(--px)', background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)' }}>
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">Shop</span>
          <h2 className="section-title">Featured <em>Collections</em></h2>
          <p className="section-subtitle">
            Hand-picked and freshly arranged. Perfect for gifts, home decor, or just because.
          </p>
        </div>
        
        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/collections" className="btn btn-primary">View All Products</Link>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="container" style={{ padding: '5rem var(--px)' }}>
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">What We Do</span>
          <h2 className="section-title">Our <em>Services</em></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Weddings & Events</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Make your special day unforgettable with bespoke floral designs tailored to your vision.</p>
            <Link href="/services" style={{ fontWeight: 600, color: 'var(--rose-500)' }}>Learn More →</Link>
          </div>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Custom Arrangements</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Have something specific in mind? Let our expert florists bring your dream bouquet to life.</p>
            <Link href="/contact" style={{ fontWeight: 600, color: 'var(--rose-500)' }}>Contact Us →</Link>
          </div>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Local Delivery</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>We ensure your flowers arrive fresh and beautiful across Zalka and the surrounding Metn areas.</p>
            <Link href="/checkout" style={{ fontWeight: 600, color: 'var(--rose-500)' }}>Order Now →</Link>
          </div>
        </div>
      </section>

      {/* REVIEWS PREVIEW */}
      <section style={{ background: 'var(--dark)', color: 'white', padding: '6rem var(--px)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="section-tag light">Testimonials</span>
          <h2 className="section-title light" style={{ marginBottom: '3rem' }}>Loved by <em>Our Community</em></h2>
          <blockquote style={{ fontSize: '1.4rem', fontFamily: 'var(--ff-serif)', fontStyle: 'italic', maxWidth: '700px', margin: '0 auto 2rem' }}>
            "Rebelly's never disappoints! The flowers are always so fresh, and the arrangements are absolutely stunning. They truly made my wedding day magical."
          </blockquote>
          <p style={{ color: 'var(--rose-300)', fontWeight: 600 }}>— Sarah M.</p>
          <div style={{ marginTop: '3rem' }}>
            <Link href="/reviews" className="btn btn-ghost">Read More Reviews</Link>
          </div>
        </div>
      </section>

      {/* ORDER CTA */}
      <section className="container" style={{ padding: '6rem var(--px)', textAlign: 'center' }}>
        <h2 className="section-title">Ready to bring <em>joy</em>?</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 2rem' }}>
          Whether it's a celebration or a simple gesture, we're here to help you say it with flowers.
        </p>
        <Link href="/checkout" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Start Your Order</Link>
      </section>
    </>
  );
}
