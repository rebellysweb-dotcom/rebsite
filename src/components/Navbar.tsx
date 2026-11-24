'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import NavAuth from './NavAuth';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/collections', label: 'Shop' },
  { href: '/services',    label: 'Services' },
  { href: '/about',       label: 'About' },
  { href: '/reviews',     label: 'Reviews' },
  { href: '/contact',     label: 'Contact' },
];

const SCROLL_THRESHOLD = 60;

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  // Closed menu is inert: unreachable by Tab and screen readers.
  // (Set via the DOM because React 18 has no `inert` prop.)
  useEffect(() => {
    const el = menuRef.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) el.inert = !menuOpen;
  }, [menuOpen]);

  // Scroll state: one rAF-batched passive listener
  useEffect(() => {
    let raf = 0;
    const read = () => { raf = 0; setScrolled(window.scrollY > SCROLL_THRESHOLD); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock scroll, move focus in, close on Escape, return focus on close
  useEffect(() => {
    if (!menuOpen) return;
    const burger = burgerRef.current;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => firstLinkRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKey);
      burger?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  // Close the menu if the viewport grows past the mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const onChange = () => { if (mq.matches) setMenuOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isHome = pathname === '/';
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  return (
    <>
      <header
        className={[
          styles.navbar,
          scrolled || !isHome ? styles.glass : '',
          menuOpen ? styles.menuIsOpen : '',
        ].join(' ')}
      >
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} aria-label="Rebelly's, home">
            Rebelly&apos;s
          </Link>

          <nav className={styles.links} aria-label="Main">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={[styles.link, isActive(href) ? styles.active : ''].join(' ')}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <span className={styles.authSlot}>
              <NavAuth />
            </span>

            <button
              id="nav-cart-btn"
              type="button"
              className={styles.cartBtn}
              onClick={toggleCart}
              aria-label={`Open cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 7h12l-1 13H7L6 7z" />
                <path d="M9 7V6a3 3 0 016 0v1" />
              </svg>
              {totalItems > 0 && (
                <span className={styles.badge} aria-hidden="true">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            <Link href="/checkout" className={`${styles.cta} btn btn-primary`}>
              Order Now
            </Link>

            <button
              ref={burgerRef}
              id="nav-hamburger"
              type="button"
              className={styles.hamburger}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <span className={menuOpen ? styles.barTop : ''} />
              <span className={menuOpen ? styles.barBot : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu: a translucent sheet that blurs the page behind it */}
      <nav
        id="mobile-menu"
        className={[styles.mobileMenu, menuOpen ? styles.mobileOpen : ''].join(' ')}
        aria-label="Mobile"
        aria-hidden={!menuOpen}
        ref={menuRef}
      >
        <ul className={styles.mobileList}>
          {NAV_LINKS.map(({ href, label }, i) => (
            <li key={href} style={{ '--i': i } as CSSProperties}>
              <Link
                ref={i === 0 ? firstLinkRef : undefined}
                href={href}
                className={[styles.mobileLink, isActive(href) ? styles.mobileLinkActive : ''].join(' ')}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.mobileFoot} style={{ '--i': NAV_LINKS.length } as CSSProperties}>
          <Link href="/checkout" className={`${styles.mobileCta} btn btn-primary`}>
            Order Now
          </Link>
          <a href="tel:+96176585028" className={styles.mobileMeta}>+961 76 585 028</a>
          <NavAuth mobile />
        </div>
      </nav>
    </>
  );
}
