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
    text: 'Great flower shop! I just told them the occasion and what I am looking for, and they prepared the perfect bouquet—full of fresh, beautiful flowers and nicely packaged. Fast, professional, and very friendly. Highly recommended!',
  },
  {
    name: 'Christian Hobeika',
    stars: 5,
    text: 'I ordered a bouquet from Rebellys, and it was fresh, and long-lasting! The owners were friendly and helpful, and delivery was fast. They even included a sweet handwritten note. Highly recommend for gorgeous flowers and plants!',
  },
  {
    name: 'Erash',
    stars: 5,
    text: 'Beautiful flower shop, charming and extremely helpful owners, incredible prices, variety in flowers, balloons etc. Do check if u pass by zalka!',
  },
  {
    name: 'qosai ghawanmeh',
    stars: 5,
    text: 'Thank you so much for your kindness and warm hospitality! The flowers were beautiful, and your friendly service made the whole experience even better.',
  },
  {
    name: 'sam haddad',
    stars: 5,
    text: 'Flowers are fresh and look great. Amazing service, very helpful and kind.',
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
