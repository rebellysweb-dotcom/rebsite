import { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Customer Reviews | Rebelly\'s Flower Shop',
  description: 'Read customer feedback for Rebelly\'s Flower Shop in Zalka, Lebanon, known for fresh bouquets, personal service, delivery, and custom arrangements.',
  alternates: {
    canonical: 'https://rebellys.com/reviews',
  },
};

type Review = {
  name: string;
  stars: 1 | 2 | 3 | 4 | 5;
  text: string;
};

const REVIEWS: Review[] = [
  {
    name: 'Tatiana Semaan',
    stars: 5,
    text: '"Wonderful flower shop! They prepared a perfect bouquet full of flowers for my special occasion. The arrangement was breathtaking and exactly what I envisioned. Highly recommend!"',
  },
  {
    name: 'Patrick Baroud',
    stars: 3,
    text: '"The delivery via Toters arrived on time which I appreciated. The shop has beautiful arrangements to choose from. Would recommend calling directly for best results."',
  },
  {
    name: 'Elie Chahine',
    stars: 4,
    text: '"The bouquets at Rebelly\'s are always gorgeous and unique. The family who runs it clearly has a passion for flowers. Been coming here for years for all my special occasions."',
  },
  {
    name: 'Maya Khoury',
    stars: 5,
    text: '"Got a stunning bridal bouquet from Rebelly\'s. They really listened to what I wanted and delivered something even more beautiful than I imagined. 30 years of expertise shows!"',
  },
  {
    name: 'Rima Nassar',
    stars: 5,
    text: '"My go-to flower shop in Zalka. Always fresh, always beautiful. The owners are so kind and helpful. They remembered my favorite flowers from my last visit — that personal touch is rare!"',
  },
];

export default function ReviewsPage() {
  // Aggregate computed from the reviews rendered on this page, so the markup matches what is visible.
  const avgRating = REVIEWS.reduce((sum, r) => sum + r.stars, 0) / REVIEWS.length;

  return (
    <div className={styles.page}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://rebellys.com/#business',
        name: "Rebelly's Flower Shop",
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: avgRating.toFixed(1),
          reviewCount: String(REVIEWS.length),
          bestRating: '5',
          worstRating: '1',
        },
        review: REVIEWS.map((r) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.name },
          reviewRating: { '@type': 'Rating', ratingValue: String(r.stars), bestRating: '5', worstRating: '1' },
          reviewBody: r.text.replace(/^"|"$/g, ''),
        })),
      }} />
      <section className={`container ${styles.header}`} aria-label="Customer reviews summary">
        <h1 className={styles.title}>Voices from Zalka</h1>
        <p className={styles.aggregate}>
          <span className={styles.score}>{avgRating.toFixed(1)}</span>
          <span
            className={styles.stars}
            data-stars={Math.round(avgRating)}
            role="img"
            aria-label={`Rated ${avgRating.toFixed(1)} out of 5 stars`}
          />
          <span>{`From ${REVIEWS.length} Google reviews`}</span>
        </p>
      </section>

      <section className={`container ${styles.grid}`} aria-label="Customer reviews">
        {REVIEWS.map((review) => (
          <article key={review.name} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.reviewer}>
                <h3 className={styles.name}>{review.name}</h3>
                <span
                  className={styles.stars}
                  data-stars={review.stars}
                  role="img"
                  aria-label={`${review.stars} out of 5 stars`}
                />
              </div>
            </div>
            <p className={styles.text}>{review.text}</p>
            <div className={styles.cardFoot}>
              <span className={styles.googleBadge} title="Google review" aria-label="Google review">
                G
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
