import { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Flower Delivery, Weddings & Events | Rebelly\'s Zalka',
  description: 'Rebelly\'s offers flower delivery, in-store pickup, custom orders, wedding flowers, and event floral installations across Zalka, Antelias, Dbayeh, and Metn.',
  alternates: {
    canonical: 'https://rebellys.com/services',
  },
  openGraph: {
    title: 'Flower Delivery, Weddings & Events | Rebelly\'s Zalka',
    description: 'Rebelly\'s offers flower delivery, in-store pickup, custom orders, wedding flowers, and event floral installations across Zalka, Antelias, Dbayeh, and Metn.',
    images: [{ url: 'https://rebellys.com/images/shop_interior.png', width: 1200, height: 630, alt: "Rebelly's flower shop" }],
    type: 'website',
  },
};

// Revalidate every hour
export const revalidate = 3600;

const services = [
  { name: 'Delivery', description: 'Same day, across the Metn', href: '/contact' },
  { name: 'In-Store Pickup', description: 'Order ahead. Collect same day', href: '/collections' },
  { name: 'Weddings & Events', description: 'Custom installations from start to finish', href: '/contact' },
  { name: 'Custom Orders', description: 'Send a photo or a budget on WhatsApp', href: '/contact' },
];

const hours = [
  { label: 'Mon–Sat', value: '9:30–19:30' },
  { label: 'Sunday', value: 'Closed' },
  { label: 'Location', value: 'Saydeh St, Zalka, Lebanon' },
];

export default function ServicesPage() {
  return (
    <div className={styles.wrap}>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', url: 'https://rebellys.com' },
        { name: 'Services', url: 'https://rebellys.com/services' },
      ])} />

      <section className={styles.section} aria-labelledby="services-title">
        <header className={styles.header}>
          <h1 id="services-title" className={styles.pageTitle}>How We Work</h1>
        </header>

        <ul className={styles.list}>
          {services.map((service) => (
            <li key={service.name}>
              <Link href={service.href} className={styles.serviceRow}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceDesc}>{service.description}</span>
                <span className={styles.serviceArrow} aria-hidden="true">→</span>
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
          <Link href="/contact" className="btn btn-primary">Call or WhatsApp us</Link>
        </div>
      </section>
    </div>
  );
}
