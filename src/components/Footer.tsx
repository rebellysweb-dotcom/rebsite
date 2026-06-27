import Link from 'next/link';
import styles from './Footer.module.css';

const SHOP_LINKS = [
  { href: '/collections', label: 'All Flowers' },
  { href: '/services',    label: 'Our Services' },
  { href: '/events',      label: 'Events' },
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
              <span className={styles.logoFlower} aria-hidden="true">✿</span>
              <span className={styles.logoText}>Rebelly&apos;s</span>
            </Link>
            <p className={styles.tagline}>
              Handcrafted floral arrangements for every moment that deserves beauty.
              Delivered fresh across Lebanon.
            </p>

            {/* Social / Contact quick links */}
            <div className={styles.socials}>
              <a
                href="https://wa.me/96176585028"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="WhatsApp us"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/rebellys.lb"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="Follow us on Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
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
                <span className={styles.infoIcon} aria-hidden="true">📍</span>
                Saydeh Street, Zalka, Lebanon
              </p>
              <p>
                <span className={styles.infoIcon} aria-hidden="true">📞</span>
                <a href="tel:+96176585028" className={styles.footerLink}>+961 76 585 028</a>
              </p>
              <p>
                <span className={styles.infoIcon} aria-hidden="true">📧</span>
                <a href="mailto:info@rebellys.com" className={styles.footerLink}>info@rebellys.com</a>
              </p>
              <p className={styles.hours}>
                <span className={styles.infoIcon} aria-hidden="true">🕐</span>
                Mon – Sat &nbsp;·&nbsp; 9:30 AM – 7:30 PM
              </p>
            </address>

            <a
              href="https://maps.app.goo.gl/rebellys"
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-sm ${styles.mapsBtn}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
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
              <span aria-hidden="true">✿</span> Crafted with love in Lebanon
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
