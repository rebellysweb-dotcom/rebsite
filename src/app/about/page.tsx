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
  { value: '1990', label: 'Opened on Saydeh St' },
  { value: 'Mon–Sat', label: '9:30–19:30' },
  { value: 'Same-day', label: 'Delivery across the Metn' },
];

export default function AboutPage() {
  return (
    <div className={styles.wrap}>
      <section className={styles.section} aria-labelledby="about-title">
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
              On Saydeh Street in Zalka, in the same shopfront since 1990, Rebelly's has been arranging flowers for weddings, funerals, and everything in between. It started as a family business, and it still is.
            </p>
            <p className={styles.body}>
              Every bouquet is assembled by hand, in-house, by florists who have been reading occasions for thirty years.
            </p>
            <div className={styles.cta}>
              <Link href="/collections" className="btn btn-primary">See this week&apos;s bouquets</Link>
            </div>
          </div>
        </div>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-label="Key facts">
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
