import { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import Icon from '@/components/icons/Icon';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { SHOP, telHref, whatsappHref } from '@/lib/shop';
import PortfolioGallery from './PortfolioGallery';
import styles from './page.module.css';

const DESCRIPTION =
  "Weddings, events, bridal bouquets, hotels, homes, vases and hand bouquets by Rebelly's, a Zalka florist since 1993. Work in Lebanon, the UAE, Saudi Arabia, Qatar and France.";

export const metadata: Metadata = {
  title: 'Portfolio: Weddings, Events and Bouquets',
  description: DESCRIPTION,
  alternates: { canonical: 'https://rebellys.com/portfolio' },
  openGraph: {
    title: "Portfolio | Rebelly's, A Flower Story",
    description: DESCRIPTION,
    url: 'https://rebellys.com/portfolio',
    images: [{ url: 'https://rebellys.com/images/portfolio/wedding-03-1.jpg', width: 728, height: 551, alt: 'Wedding hall with orchid and moss arrangements by Rebelly\'s' }],
    type: 'website',
  },
};

export default function PortfolioPage() {
  return (
    <div className={styles.page}>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: 'https://rebellys.com' },
          { name: 'Portfolio', url: 'https://rebellys.com/portfolio' },
        ])}
      />

      <header className={styles.header}>
        <p className={styles.eyebrow}>{SHOP.tagline}</p>
        <h1 className={styles.title}>Portfolio</h1>
        <p className={styles.lede}>
          Tables, halls, lobbies, living rooms and bouquets we have arranged. With event planners we have
          decorated weddings and events in Lebanon, the UAE, Saudi Arabia, Qatar and France.
        </p>
      </header>

      <section className={styles.gallery} aria-label="Photo gallery">
        <PortfolioGallery />
      </section>

      <section className={styles.close} aria-labelledby="portfolio-close">
        <h2 id="portfolio-close" className={styles.closeTitle}>Planning a wedding or an event?</h2>
        <p className={styles.closeText}>Tell us the date, the place and the colours you like. We will take it from there.</p>
        <div className={styles.closeActions}>
          <a href={whatsappHref("Hello Rebelly's, I would like to talk about flowers for an event.")} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <Icon name="whatsapp" size={18} />
            Message us on WhatsApp
          </a>
          <a href={telHref} className="btn btn-outline">
            <Icon name="phone" size={18} />
            {SHOP.phoneDisplay}
          </a>
          <Link href="/contact" className={styles.textLink}>
            Other ways to reach us
            <Icon name="arrow-right" size={18} motion="nudge" />
          </Link>
        </div>
      </section>
    </div>
  );
}
