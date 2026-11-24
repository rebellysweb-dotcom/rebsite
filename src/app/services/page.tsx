import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import Icon, { type IconName } from '@/components/icons/Icon';
import { SHOP } from '@/lib/shop';
import { photo } from '@/lib/portfolio';
import styles from './page.module.css';

const DESCRIPTION =
  "Rebelly's makes floral decoration for weddings and events, bridal bouquets, hotel and residential flowers, vase arrangements and hand bouquets. Shop in Zalka, delivery across the Metn.";

export const metadata: Metadata = {
  title: "Weddings, Events and Flowers | Rebelly's Zalka",
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://rebellys.com/services',
  },
  openGraph: {
    title: "Weddings, Events and Flowers | Rebelly's Zalka",
    description: DESCRIPTION,
    images: [{ url: 'https://rebellys.com/images/portfolio/wedding-10-1.jpg', width: 795, height: 554, alt: 'Ballroom with hanging crystal strands above a large dome of pink roses' }],
    type: 'website',
  },
};

// Revalidate every hour
export const revalidate = 3600;

const make: { name: string; description: string; photoId: string; href: string; cta: string }[] = [
  {
    name: 'Weddings & events',
    description: 'Floral decoration for the ceremony, the tables and the whole room. We work with couples and with event planners, in Lebanon and abroad.',
    photoId: 'wedding-04-1',
    href: '/portfolio',
    cta: 'See weddings',
  },
  {
    name: 'Bridal bouquets',
    description: 'Hand-tied, or built with pearls and brooches. Designed around the dress and the day.',
    photoId: 'bridal-13-1',
    href: '/portfolio',
    cta: 'See bridal work',
  },
  {
    name: 'Hotels',
    description: 'Lobby pieces, tall vases and table flowers for hotels and halls.',
    photoId: 'hotels-27-1',
    href: '/portfolio',
    cta: 'See hotel work',
  },
  {
    name: 'Residential',
    description: 'Entrance arrangements, dining tables and vases for private homes.',
    photoId: 'residential-37-1',
    href: '/portfolio',
    cta: 'See homes',
  },
  {
    name: 'Vases',
    description: 'Arrangements in crystal, glass, stone or metal, sized to the room they will stand in.',
    photoId: 'vases-17-0',
    href: '/portfolio',
    cta: 'See vases',
  },
  {
    name: 'Hand bouquets',
    description: 'Roses and mixed flowers wrapped by hand. Collect at the shop or have it delivered.',
    photoId: 'bouquet-40-3',
    href: '/collections',
    cta: 'Shop bouquets',
  },
];

const ordering: { name: string; description: string; href: string; icon: IconName }[] = [
  { name: 'Delivery', description: 'Same day, across the Metn', href: '/contact', icon: 'truck' },
  { name: 'In-Store Pickup', description: 'Order ahead. Collect same day', href: '/collections', icon: 'bag' },
  { name: 'Custom Orders', description: 'Send a photo or a budget on WhatsApp', href: '/contact', icon: 'whatsapp' },
];

const hours = [
  { label: 'Mon–Sat', value: '9:30–19:30' },
  { label: 'Sunday', value: 'Closed' },
  { label: 'Location', value: 'Saydeh St, Zalka, Lebanon' },
];

const lead = photo('wedding-10-1');

export default function ServicesPage() {
  return (
    <div className={styles.wrap}>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', url: 'https://rebellys.com' },
        { name: 'Services', url: 'https://rebellys.com/services' },
      ])} />

      <section className={styles.section} aria-labelledby="services-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{SHOP.tagline}</p>
            <h1 id="services-title" className={styles.pageTitle}>What We Do</h1>
            <p className={styles.intro}>
              Floral decoration for weddings and events, and flowers for hotels, homes and everyday. Since {SHOP.founded}, from our shop in Zalka.
            </p>
          </div>
          <div className={styles.lead}>
            <Image
              src={lead.src}
              alt={lead.alt}
              width={lead.width}
              height={lead.height}
              priority
              className={styles.leadImg}
              sizes="(max-width: 899px) 100vw, 46vw"
            />
          </div>
        </header>

        <ul className={styles.make}>
          {make.map((item) => {
            const p = photo(item.photoId);
            return (
              <li key={item.name}>
                <Link href={item.href} className={styles.makeRow}>
                  <span className={styles.thumb} aria-hidden="true">
                    <Image src={p.src} alt="" width={p.width} height={p.height} className={styles.thumbImg} sizes="120px" />
                  </span>
                  <span className={styles.makeName}>{item.name}</span>
                  <span className={styles.makeDesc}>{item.description}</span>
                  <span className={styles.makeCta}>
                    {item.cta}
                    <Icon name="arrow-right" size={18} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-labelledby="ordering-title">
        <h2 id="ordering-title" className={styles.h2}>Ordering and delivery</h2>
        <ul className={styles.list}>
          {ordering.map((service) => (
            <li key={service.name}>
              <Link href={service.href} className={styles.serviceRow}>
                <span className={styles.serviceIcon} aria-hidden="true"><Icon name={service.icon} size={22} /></span>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceDesc}>{service.description}</span>
                <span className={styles.serviceArrow} aria-hidden="true"><Icon name="arrow-right" size={22} /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-labelledby="hours-title">
        <h2 id="hours-title" className={styles.h2}>Hours and location</h2>
        <table className={styles.hours}>
          <tbody>
            {hours.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.cta}>
          <Link href="/contact" className="btn btn-primary">
            <Icon name="phone" size={18} />
            Call or WhatsApp us
          </Link>
        </div>
      </section>
    </div>
  );
}
