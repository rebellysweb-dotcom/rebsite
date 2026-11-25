import { Metadata } from 'next';
import { REVIEWS } from '@/lib/reviews';
import { GOOGLE } from '@/lib/storefront';

export const metadata: Metadata = {
  title: 'Customer Reviews | Rebelly\'s Flower Shop',
  description: 'Read customer feedback for Rebelly\'s Flower Shop in Zalka, Lebanon, known for fresh bouquets, personal service, delivery, and custom arrangements.',
  alternates: {
    canonical: 'https://rebellys.com/reviews',
  },
};

export default function ReviewsPage() {
  return (
    <div style={{ padding: '6rem var(--px) 8rem', background: 'var(--cream)', minHeight: '100svh' }}>
      <section className="container" aria-label="Customer Reviews">
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">What People Say</span>
          <h1 className="section-title">Blooming with<br/><em>Happy Customers</em></h1>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem', background: '#fff', padding: '1rem clamp(1rem, 5vw, 2rem)', maxWidth: '100%', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '4px 8px', color: 'var(--text-muted)' }}>
              <span style={{ color: '#fbbf24', fontSize: '1.3rem' }} aria-hidden="true">★</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{GOOGLE.rating}</strong>
              <span>on Google Maps · {GOOGLE.count} reviews</span>
            </div>
            <a href={GOOGLE.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rose-500)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              See all reviews on Google Maps →
            </a>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>Below: five of our Google reviews, word for word.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
          {REVIEWS.map((review, i) => (
            <div key={review.name} className="card" data-animate="fadeUp" style={{ padding: 'clamp(1.25rem, 5vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: review.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {review.initial}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{review.name}</h3>
                    <div style={{ color: '#fbbf24', fontSize: '1rem' }}>{review.stars}</div>
                  </div>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }} title="Google Review">
                  G
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
