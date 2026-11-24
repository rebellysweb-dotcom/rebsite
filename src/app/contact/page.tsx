import { Metadata } from 'next';
import ContactForm from './ContactForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact Rebelly\'s Flower Shop | Saydeh Street, Zalka',
  description: 'Call, WhatsApp, or visit Rebelly\'s Flower Shop on Saydeh Street in Zalka, Lebanon. Open Monday to Saturday, 9:30 AM to 7:30 PM.',
  alternates: {
    canonical: 'https://rebellys.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <section className={`container ${styles.header}`} aria-label="Contact us">
        <span className={styles.eyebrow}>Find us</span>
        <h1 className={styles.title}>Come and say hello</h1>
      </section>

      <section className={`container ${styles.layout}`} aria-label="Contact details and form">
        <div className={styles.info}>
          <div className={styles.block}>
            <span className={styles.label}>Address</span>
            <p className={styles.value}>
              Saydeh Street, Zalka
              <br />
              <span className={styles.valueMuted}>Mount Lebanon, Lebanon</span>
            </p>
            <a
              href="https://maps.app.goo.gl/aq7CZ26re22c4KQx7"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Get directions ↗
            </a>
          </div>

          <div className={styles.block}>
            <span className={styles.label}>Phone</span>
            <p className={styles.value}>+961 76 585 028</p>
            <a href="tel:+96176585028" className={styles.link}>
              Call now ↗
            </a>
          </div>

          <div className={styles.block}>
            <span className={styles.label}>WhatsApp</span>
            <p className={styles.value}>+961 76 585 028</p>
            <a
              href="https://wa.me/96176585028"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Message us ↗
            </a>
          </div>

          <div className={styles.block}>
            <span className={styles.label}>Opening hours</span>
            <dl className={styles.hours}>
              <dt>Mon–Sat</dt>
              <dd>9:30–19:30</dd>
              <dt>Sunday</dt>
              <dd>Closed</dd>
            </dl>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Send a message</h2>
            <ContactForm />
          </div>

          <div className={styles.mapWrap}>
            <iframe
              title="Rebelly's Flower Shop location on Google Maps"
              src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=Rebelly's%20Flower%20Shop,%20Saydeh%20Street,%20Zalka,%20Lebanon+(Rebelly's%20Flower%20Shop)&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
              className={styles.map}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
