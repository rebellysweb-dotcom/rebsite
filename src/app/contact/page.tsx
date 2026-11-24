import { Metadata } from 'next';
import type { ReactNode } from 'react';
import ContactForm from './ContactForm';
import { SHOP, telHref, whatsappHref } from '@/lib/shop';
import Icon, { type IconName } from '@/components/icons/Icon';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact Rebelly\'s | Saydeh Street, Zalka',
  description: 'Call, WhatsApp, email or visit Rebelly\'s on Saydeh Street in Zalka, Lebanon. Open Monday to Saturday, 9:30 AM to 7:30 PM. Also reachable in the UAE and Morocco.',
  alternates: {
    canonical: 'https://rebellys.com/contact',
  },
};

function Block({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className={styles.block}>
      <span className={styles.badge} aria-hidden="true"><Icon name={icon} size={22} /></span>
      <div className={styles.blockBody}>
        <span className={styles.label}>{label}</span>
        {children}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <section className={`container ${styles.header}`} aria-label="Contact us">
        <span className={styles.eyebrow}>{SHOP.tagline}</span>
        <h1 className={styles.title}>Come and say hello</h1>
      </section>

      <section className={`container ${styles.layout}`} aria-label="Contact details and form">
        <div className={styles.info}>
          <Block icon="pin" label="Address">
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
              Get directions
              <Icon name="arrow-right" size={18} motion="nudge" />
            </a>
          </Block>

          <Block icon="phone" label="Phone">
            <p className={styles.value}>{SHOP.phoneDisplay}</p>
            <a href={telHref} className={styles.link}>
              Call now
              <Icon name="arrow-right" size={18} motion="nudge" />
            </a>
          </Block>

          <Block icon="mail" label="Email">
            <p className={styles.value}>{SHOP.email}</p>
            <a href={`mailto:${SHOP.email}`} className={styles.link}>
              Write to us
              <Icon name="arrow-right" size={18} motion="nudge" />
            </a>
          </Block>

          <Block icon="whatsapp" label="WhatsApp">
            <p className={styles.value}>{SHOP.whatsappDisplay}</p>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Message us
              <Icon name="arrow-right" size={18} motion="nudge" />
            </a>
          </Block>

          <Block icon="clock" label="Opening hours">
            <dl className={styles.hours}>
              <dt>Mon–Sat</dt>
              <dd>9:30–19:30</dd>
              <dt>Sunday</dt>
              <dd>Closed</dd>
            </dl>
          </Block>

          <div className={styles.also}>
            <h2 className={styles.alsoTitle}>Also reachable in</h2>
            <ul className={styles.alsoList}>
              {SHOP.international.map((c) => (
                <li key={c.country}>
                  <a href={`tel:${c.phone}`} className={styles.alsoLink}>
                    <Icon name="pin" size={18} />
                    <span className={styles.alsoCountry}>{c.country}</span>
                    <span className={styles.alsoNumber}>
                      <Icon name="phone" size={18} />
                      {c.display}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
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
