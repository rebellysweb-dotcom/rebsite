import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Flower Delivery, Weddings & Events | Rebelly\'s Zalka',
  description: 'Rebelly\'s provides flower delivery, in-store pickup, custom orders, wedding flowers, and event floral installations around Zalka, Jal El Dib, Antelias, Dbayeh, Dora, and Metn.',
  alternates: {
    canonical: 'https://rebellys.com/services',
  },
};

// Revalidate every hour
export const revalidate = 3600;

export default function ServicesPage() {
  return (
    <div style={{ padding: '6rem var(--px) 8rem', background: 'var(--cream)', minHeight: '100vh' }}>
      <section className="container" aria-label="Our Services">
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">How We Serve You</span>
          <h1 className="section-title">Flowers, <em>Your Way</em></h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          
          <div className="card" data-animate="fadeUp" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">🚚</div>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Home Delivery</h3>
            <p style={{ color: 'var(--text-muted)' }}>We deliver your floral gifts to your doorstep across Zalka and surrounding areas. Surprise your loved ones.</p>
          </div>
          
          <div className="card" data-animate="fadeUp" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">🏪</div>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>In-Store Pickup</h3>
            <p style={{ color: 'var(--text-muted)' }}>Order ahead and swing by to pick up your fresh arrangement. Mon–Sat, 9:30 AM – 7:30 PM.</p>
          </div>
          
          <div className="card" data-animate="fadeUp" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">💍</div>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Events & Weddings</h3>
            <p style={{ color: 'var(--text-muted)' }}>Let us bring your vision to life. We offer custom floral installations for weddings, engagements, and celebrations.</p>
          </div>
          
          <div className="card" data-animate="fadeUp" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">🎨</div>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Custom Orders</h3>
            <p style={{ color: 'var(--text-muted)' }}>Have a vision? Tell us your occasion, colors, and budget, and we'll create something uniquely yours.</p>
          </div>
          
        </div>

        <div style={{ marginTop: '4rem', textAlign: 'center' }} data-animate="fadeUp">
          <Link href="/contact" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
            Get in Touch
          </Link>
        </div>
      </section>

      {/* Operating Hours Strip */}
      <section style={{ marginTop: '6rem', padding: '3rem var(--px)', background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🕐</div>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>Open Monday – Saturday</strong>
            <span style={{ color: 'var(--text-muted)' }}>9:30 AM – 7:30 PM</span>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⛔</div>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>Sunday</strong>
            <span style={{ color: 'var(--text-muted)' }}>Closed</span>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>Location</strong>
            <span style={{ color: 'var(--text-muted)' }}>Saydeh St, Zalka, Lebanon</span>
          </div>
        </div>
      </section>
    </div>
  );
}
