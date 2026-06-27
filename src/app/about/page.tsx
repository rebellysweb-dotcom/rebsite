import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Our Story | Rebelly\'s Flower Shop Zalka',
  description: 'Meet Rebelly\'s, a family-owned flower shop in Zalka with over 30 years of floral experience, custom bouquets, wedding flowers, and local delivery.',
  alternates: {
    canonical: 'https://rebellys.com/about',
  },
};

// Revalidate every hour
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div style={{ padding: '6rem var(--px) 8rem', background: 'var(--cream)', minHeight: '100vh' }}>
      <section className="container" aria-label="About Rebelly's">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          <div data-animate="fadeLeft" style={{ position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
              <Image 
                src="/images/heart_roses.png" 
                alt="Heart-shaped rose arrangement" 
                fill
                className="card"
                style={{ objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} 
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              right: '-20px',
              background: '#fff',
              padding: '1.5rem',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center',
              zIndex: 10
            }}>
              <span style={{ display: 'block', fontSize: '2rem', fontWeight: 700, color: 'var(--rose-500)', fontFamily: 'var(--ff-display)' }}>30+</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Years of<br/>Passion</span>
            </div>
          </div>
          
          <div data-animate="fadeRight">
            <span className="section-tag">Our Story</span>
            <h1 className="section-title">A Family Tradition<br/><em>Rooted in Every Petal</em></h1>
            
            <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                Nestled in the heart of Zalka on Saydeh Street, Rebelly's has been a beloved cornerstone of the Lebanese floral scene for over three decades. What started as a family dream blossomed into one of Lebanon's most trusted flower shops.
              </p>
              <p>
                Every arrangement we craft carries our family's touch — a careful balance of artistry, freshness, and genuine care. Whether it's a wedding, an anniversary, a heartfelt gift, or simply a moment worth celebrating, we're here to make it bloom.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ background: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                <span aria-hidden="true">🌸</span> Always Fresh
              </div>
              <div style={{ background: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                <span aria-hidden="true">🚚</span> Home Delivery
              </div>
              <div style={{ background: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                <span aria-hidden="true">🏪</span> In-Store Pickup
              </div>
              <div style={{ background: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                <span aria-hidden="true">✨</span> Custom Orders
              </div>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}
