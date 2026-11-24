import Link from 'next/link';
import { SHOP, telHref, whatsappHref } from '@/lib/shop';
import Icon from './icons/Icon';
import styles from './Footer.module.css';

const SHOP_LINKS = [
  { href: '/collections', label: 'All Flowers' },
  { href: '/portfolio',   label: 'Portfolio' },
  { href: '/services',    label: 'Our Services' },
  { href: '/about',       label: 'Our Story' },
  { href: '/reviews',     label: 'Reviews' },
];

const HELP_LINKS = [
  { href: '/contact',  label: 'Contact Us' },
  { href: '/checkout', label: 'Place an Order' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} aria-label="Site footer">
      <div className="container">
        <div className={styles.grid}>

          {/* Brand Column */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label="Rebelly's home">
              <span className={styles.logoText}>Rebelly&apos;s</span>
            </Link>
            <p className={styles.strapline}>{SHOP.tagline}</p>
            <p className={styles.tagline}>
              Flowers arranged by hand on Saydeh Street, Zalka, since {SHOP.founded}.
              Weddings, events, hotels and homes, and same-day delivery across the Metn.
            </p>

            {/* Social / Contact quick links */}
            <div className={styles.socials}>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="WhatsApp us"
              >
                <Icon name="whatsapp" size={18} />
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/rebellys.lb"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="Follow us on Instagram"
              >
                <Icon name="bouquet" size={18} />
                Instagram
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Shop</h3>
            <ul className={styles.linkList}>
              {SHOP_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={styles.footerLink}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Help</h3>
            <ul className={styles.linkList}>
              {HELP_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={styles.footerLink}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Visit Us</h3>
            <address className={styles.address}>
              <p>
                <span className={styles.infoLabel}><Icon name="pin" size={18} /><span className="sr-only">Shop</span></span>
                <span>{SHOP.address}</span>
              </p>
              <p>
                <span className={styles.infoLabel}><Icon name="phone" size={18} /><span className="sr-only">Phone</span></span>
                <a href={telHref} className={styles.footerLink}>{SHOP.phoneDisplay}</a>
              </p>
              <p>
                <span className={styles.infoLabel}><Icon name="mail" size={18} /><span className="sr-only">Email</span></span>
                <a href={`mailto:${SHOP.email}`} className={styles.footerLink}>{SHOP.email}</a>
              </p>
              <p>
                <span className={styles.infoLabel}><Icon name="clock" size={18} /><span className="sr-only">Hours</span></span>
                <span>Mon to Sat, 9:30 AM to 7:30 PM</span>
              </p>
            </address>

            <a
              href="https://maps.app.goo.gl/aq7CZ26re22c4KQx7"
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-sm ${styles.mapsBtn}`}
            >
              <Icon name="pin" size={18} />
              Open in Maps
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p className={styles.copy}>
              © {year} Rebelly&apos;s Flower Shop. All rights reserved.
            </p>
            <p className={styles.made}>
              Arranged by hand in Zalka, since {SHOP.founded}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
