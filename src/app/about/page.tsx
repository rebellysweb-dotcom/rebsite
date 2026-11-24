import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/icons/Icon';
import { SHOP } from '@/lib/shop';
import { photo } from '@/lib/portfolio';
import styles from './page.module.css';

const DESCRIPTION =
  "Rebelly's has arranged flowers since 1993 from its shop in Zalka, Lebanon: weddings and events, bridal bouquets, hotels, homes, vases and hand bouquets, in Lebanon, the UAE, Saudi Arabia, Qatar and France.";

export const metadata: Metadata = {
  title: "Our Story | Rebelly's, A Flower Story",
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://rebellys.com/about',
  },
  openGraph: {
    title: "Our Story | Rebelly's, A Flower Story",
    description: DESCRIPTION,
    images: [{ url: 'https://rebellys.com/images/portfolio/wedding-03-1.jpg', width: 728, height: 551, alt: "Wedding hall with orchid and moss arrangements by Rebelly's" }],
    type: 'website',
  },
};

// Revalidate every hour
export const revalidate = 3600;

const facts = [
  { value: String(SHOP.founded), label: 'Founded in Lebanon' },
  { value: '5', label: 'Countries with weddings and events' },
  { value: 'Mon–Sat', label: 'Shop open 9:30–19:30' },
  { value: 'Same-day', label: 'Delivery across the Metn' },
];

const work = [
  { name: 'Weddings and events', text: 'Floral decoration for the ceremony, the tables and the room.' },
  { name: 'Bridal bouquets', text: 'Made for the dress, the day and the person carrying it.' },
  { name: 'Hotels and residences', text: 'Entrance pieces, vase arrangements and table flowers.' },
  { name: 'Hand bouquets', text: 'Wrapped and tied in the shop, to take with you or to send.' },
];

const hero = photo('wedding-03-1');
const strip = [photo('wedding-10-1'), photo('hotels-28-3'), photo('wedding-11-1')];

export default function AboutPage() {
  return (
    <div className={styles.wrap}>
      {/* TODO(owner): founder story. We do not have the founder's name or history yet, so none is written here.
          Add a short "Who started it" paragraph below the lede once the owner supplies it. */}
      <section className={styles.section} aria-labelledby="about-title">
        <div className={styles.story}>
          <div>
            <p className={styles.eyebrow}>{SHOP.tagline}</p>
            <h1 id="about-title" className={styles.pageTitle}>Our Story</h1>
            <p className={styles.lede}>
              Rebelly&apos;s has been arranging flowers since {SHOP.founded}. Our shop is on Saydeh Street in Zalka, and that is where every bouquet and every wedding starts.
            </p>
            <p className={styles.body}>
              We make floral decoration for weddings and events, bridal bouquets, vase arrangements for hotels and homes, and hand bouquets for everyday. Some days that means a single bunch wrapped at the counter. Other days it is a ballroom.
            </p>
            <div className={styles.cta}>
              <Link href="/portfolio" className="btn btn-primary">See our portfolio
                <Icon name="arrow-right" size={18} motion="nudge" />
              </Link>
              <Link href="/collections" className="btn btn-outline">Shop bouquets</Link>
            </div>
          </div>

          <div className={styles.frame}>
            <Image
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              priority
              className={styles.photo}
              sizes="(max-width: 899px) 100vw, 46vw"
            />
            <p className={styles.badge}>Since {SHOP.founded}</p>
          </div>
        </div>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-labelledby="reach-title">
        <div className={styles.reach}>
          <h2 id="reach-title" className={styles.h2}>Beyond Lebanon</h2>
          <div className={styles.reachText}>
            <p>
              Working with event planners, we have carried out weddings and events in Lebanon, the United Arab Emirates, Saudi Arabia, Qatar and France.
            </p>
            <p>
              At home we serve Zalka, Antelias, Dbayeh and the wider Metn, with same-day delivery.
            </p>
          </div>
        </div>

        <ul className={styles.strip}>
          {strip.map((p) => (
            <li key={p.id} className={styles.stripItem}>
              <Image
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                className={styles.stripImg}
                sizes="(max-width: 700px) 92vw, 30vw"
              />
            </li>
          ))}
        </ul>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-labelledby="work-title">
        <h2 id="work-title" className={styles.h2}>What we make</h2>
        <ul className={styles.work}>
          {work.map((w) => (
            <li key={w.name} className={styles.workItem}>
              <h3 className={styles.workName}>{w.name}</h3>
              <p className={styles.workText}>{w.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-labelledby="craft-title">
        <div className={styles.craft}>
          <h2 id="craft-title" className={styles.h2}>How we work</h2>
          <p className={styles.craftText}>
            We keep developing our imagination and our creativity. Our clients come with ambitious wishes, and we put our sensitivity and our artistic spirit to work for them.
          </p>
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
