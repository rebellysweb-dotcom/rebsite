import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Our Story | Rebelly\'s Flower Shop Zalka',
  description: 'Meet Rebelly\'s, a family-owned flower shop in Zalka with over 30 years of floral experience, custom bouquets, wedding flowers, and local delivery.',
  alternates: {
    canonical: 'https://rebellys.com/about',
  },
  openGraph: {
    title: 'Our Story | Rebelly\'s Flower Shop Zalka',
    description: 'Meet Rebelly\'s, a family-owned flower shop in Zalka with over 30 years of floral experience, custom bouquets, wedding flowers, and local delivery.',
    images: [{ url: 'https://rebellys.com/images/heart_roses.png', width: 1200, height: 630, alt: "Rebelly's flower arrangements" }],
    type: 'website',
  },
};

// Revalidate every hour
export const revalidate = 3600;

const facts = [
  { value: '30+', label: 'Years in Zalka' },
  { value: '1990', label: 'The year it began' },
  { value: 'Saydeh St', label: 'Where to find us' },
  { value: 'Same-day', label: 'Local delivery' },
];

export default function AboutPage() {
  return (
    <div className={styles.wrap}>
      <section className={styles.section} aria-labelledby="about-title" data-animate="fade-up">
        <div className={styles.story}>
          <div className={styles.frame}>
            <Image
              src="/images/heart_roses.png"
              alt="Heart-shaped rose arrangement"
              fill
              priority
              className={styles.photo}
              sizes="(max-width: 899px) 100vw, 50vw"
            />
            <p className={styles.badge}>Est. 1990</p>
          </div>

          <div>
            <p className={styles.eyebrow}>Our Story</p>
            <h1 id="about-title" className={styles.pageTitle}>A Family Craft</h1>
            <p className={styles.lede}>
              On Saydeh Street in Zalka, in the same shopfront since 1990, Rebelly's has been arranging flowers for weddings, funerals, and everything in between. It started as a family passion — and that's exactly what it still is.
            </p>
            <p className={styles.body}>
              Every bouquet is assembled by hand, in-house. We source the freshest stock available each week, and our florists have thirty years of practice reading what each occasion actually needs.
            </p>
            <div className={styles.cta}>
              <Link href="/collections" className="btn btn-primary">Shop the collection</Link>
            </div>
          </div>
        </div>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-label="Key facts" data-animate="fade-up">
        <div className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <p className={styles.factValue}>{fact.value}</p>
              <p className={styles.factLabel}>{fact.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
