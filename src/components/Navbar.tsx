'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);

  const throttle = (fn: () => void, delay: number) => {
    let last = 0;
    return () => {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn();
      }
    };
  };

  const handleScroll = useCallback(
    throttle(() => {
      setScrolled(window.scrollY > 20);
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isHome = pathname === '/';

  return (
    <>
      <header
        className={[
          styles.navbar,
          scrolled ? styles.scrolled : '',
          !isHome ? styles.solid : '',
        ].join(' ')}
        aria-label="Site navigation"
      >
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="Rebelly's Home">
            <span className={styles.logoFlower} aria-hidden="true">✿</span>
            <span className={styles.logoText}>Rebelly&apos;s</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.links} aria-label="Main menu">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={[
                  styles.link,
                  pathname === href ? styles.active : '',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className={styles.actions}>
            {/* Auth (desktop) */}
            <span className={styles.authSlot}>
              <NavAuth />
            </span>

            {/* Cart toggle */}
            <button
              id="nav-cart-btn"
              className={styles.cartBtn}
              onClick={toggleCart}
              aria-label={`Open cart (${totalItems} items)`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.97-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && (
                <span className={styles.badge} aria-live="polite">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Order CTA — desktop */}
            <Link href="/checkout" className={`${styles.cta} btn btn-primary`}>
              <span>Order Now</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>

            {/* Mobile hamburger */}
            <button
              id="nav-hamburger"
              className={styles.hamburger}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span className={menuOpen ? styles.barTop   : ''} />
              <span className={menuOpen ? styles.barMid   : ''} />
              <span className={menuOpen ? styles.barBot   : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <nav
        className={[styles.mobileMenu, menuOpen ? styles.mobileOpen : ''].join(' ')}
        aria-label="Mobile menu"
        aria-hidden={!menuOpen}
        {...(!menuOpen ? { inert: true } : {})}
      >
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={[styles.mobileLink, pathname === href ? styles.mobileLinkActive : ''].join(' ')}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/checkout"
          className={`${styles.mobileCta} btn btn-primary`}
        >
          🌸 Order Now
        </Link>
        <NavAuth mobile />
      </nav>
    </>
  );
}
