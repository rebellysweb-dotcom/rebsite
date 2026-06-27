import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Reviews | Rebelly\'s Flower Shop',
  description: 'Read customer feedback for Rebelly\'s Flower Shop in Zalka, Lebanon, known for fresh bouquets, personal service, delivery, and custom arrangements.',
  alternates: {
    canonical: 'https://rebellys.com/reviews',
  },
};

const REVIEWS = [
  {
    initial: 'T',
    color: 'linear-gradient(135deg, #e91e8c, #ff6b9d)',
    name: 'Tatiana Semaan',
    stars: '★★★★★',
    text: '"Wonderful flower shop! They prepared a perfect bouquet full of flowers for my special occasion. The arrangement was breathtaking and exactly what I envisioned. Highly recommend!"',
  },
  {
    initial: 'P',
    color: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    name: 'Patrick Baroud',
    stars: '★★★☆☆',
    text: '"The delivery via Toters arrived on time which I appreciated. The shop has beautiful arrangements to choose from. Would recommend calling directly for best results."',
  },
  {
    initial: 'E',
    color: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    name: 'Elie Chahine',
    stars: '★★★★☆',
    text: '"The bouquets at Rebelly\'s are always gorgeous and unique. The family who runs it clearly has a passion for flowers. Been coming here for years for all my special occasions."',
  },
  {
    initial: 'M',
    color: 'linear-gradient(135deg, #dc2626, #f87171)',
    name: 'Maya Khoury',
    stars: '★★★★★',
    text: '"Got a stunning bridal bouquet from Rebelly\'s. They really listened to what I wanted and delivered something even more beautiful than I imagined. 30 years of expertise shows!"',
  },
  {
    initial: 'R',
    color: 'linear-gradient(135deg, #059669, #34d399)',
    name: 'Rima Nassar',
    stars: '★★★★★',
    text: '"My go-to flower shop in Zalka. Always fresh, always beautiful. The owners are so kind and helpful. They remembered my favorite flowers from my last visit — that personal touch is rare!"',
  },
];

export default function ReviewsPage() {
  return (
    <div style={{ padding: '6rem var(--px) 8rem', background: 'var(--cream)', minHeight: '100vh' }}>
      <section className="container" aria-label="Customer Reviews">
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">What People Say</span>
          <h1 className="section-title">Blooming with<br/><em>Happy Customers</em></h1>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem', background: '#fff', padding: '1rem 2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: '#fbbf24', fontSize: '1.5rem', letterSpacing: '2px', marginBottom: '4px' }}>
              ★★★★<span style={{ position: 'relative' }}>★<span style={{ position: 'absolute', left: 0, top: 0, width: '90%', overflow: 'hidden', color: '#fbbf24' }}></span><span style={{ color: '#e5e7eb' }}>★</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>4.9</strong>
              <span>Based on 20 Google Reviews</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {REVIEWS.map((review, i) => (
            <div key={i} className="card" data-animate="fadeUp" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
