'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatUsd } from '@/lib/utils';
import { CATALOG_PRODUCTS } from '@/lib/catalog';
import AddOnPicker from './AddOnPicker';
import { GOOGLE, DELIVERY_NOTE } from '@/lib/storefront';
import { SHOP, whatsappHref } from '@/lib/shop';
import styles from './CartDrawer.module.css';

const xmasPrices = CATALOG_PRODUCTS.filter((p) => p.category === 'christmas').map((p) => p.price_usd);
const nbPrices = CATALOG_PRODUCTS.filter((p) => p.category === 'new-born').map((p) => p.price_usd);
const minXmas = Math.min(...xmasPrices);
const nbPrice = Math.min(...nbPrices);

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalUsd } =
    useCartStore();

  // Load the saved cart from localStorage once, after the first render (no hydration mismatch).
  useEffect(() => { useCartStore.persist.rehydrate(); }, []);

  const drawerRef  = useRef<HTMLDivElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { closeCart(); return; }
      if (e.key !== 'Tab') return;
      const el   = drawerRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();
      }
    },
    [isOpen, closeCart]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-focus close button when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="overlay"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        id="cart-drawer"
        className={`drawer ${isOpen ? 'open' : ''} ${styles.drawer}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="drawer-header">
          <span className="drawer-title">
            🌸 Your Cart
            {totalItems() > 0 && (
              <span className={styles.count}>{totalItems()}</span>
            )}
          </span>
          <button
            ref={closeRef}
            className="drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} aria-hidden="true">🌷</div>
              <p className={styles.emptyText}>Your cart is empty</p>
              <p className={styles.emptySub}>
                Christmas gifts from ${minXmas}, newborn gifts at ${nbPrice}. Arranged by hand in Zalka since {SHOP.founded}.
              </p>
              <Link
                href="/collections"
                className={`btn btn-primary ${styles.shopBtn}`}
                onClick={closeCart}
              >
                Shop Christmas Specials
              </Link>
              <Link
                href="/collections?cat=new-born"
                className={`btn btn-outline ${styles.shopBtn}`}
                style={{ marginTop: 0 }}
                onClick={closeCart}
              >
                New Born Gifts
              </Link>
              <p className={styles.emptySub} style={{ fontSize: '0.8rem' }}>
                Not sure what to choose? <a href={whatsappHref("Hello Rebelly's, I need help choosing flowers.")} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rose-500)', fontWeight: 600 }}>Ask us on WhatsApp</a>
              </p>
            </div>
          ) : (
            <ul className={styles.list} aria-label="Cart items">
              {items.map((item) => (
                <li key={item.lineId} className={styles.item}>
                  {/* Thumbnail */}
                  <div className={styles.thumb} aria-hidden="true">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <span>🌸</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.info}>
                    <p className={styles.name}>{item.name}</p>
                    {item.is_event_product && (
                      <span className="badge badge-rose" style={{ marginBottom: 4 }}>Event</span>
                    )}
                    <p className={styles.price}>
                      {item.price_usd === 0
                        ? 'Free'
                        : item.price_usd != null
                          ? formatUsd(item.price_usd * item.quantity)
                          : 'Price on request'}
                    </p>

                    {/* Quantity controls */}
                    <div className="qty-ctrl" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="qty-val" aria-live="polite" aria-atomic="true">
                        {item.quantity}
                      </span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    className={styles.remove}
                    onClick={() => removeItem(item.lineId)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add-ons: one tap, with prices */}
        {items.length > 0 && <AddOnPicker />}

        {/* Footer — only when items exist */}
        {items.length > 0 && (
          <div className="drawer-footer">
            <div className={styles.totals}>
              <span className={styles.totalLabel}>Subtotal</span>
              <span className={styles.totalValue}>
                {totalUsd() > 0 ? formatUsd(totalUsd()) : 'Free'}
              </span>
            </div>
            <p className={styles.note}>
              {DELIVERY_NOTE} We confirm everything by phone or WhatsApp before you pay (Whish or cash).
            </p>
            <Link
              href="/checkout"
              className={`btn btn-primary ${styles.checkoutBtn}`}
              onClick={closeCart}
            >
              Proceed to Checkout
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <button
              className={`btn btn-outline ${styles.continueBtn}`}
              onClick={closeCart}
            >
              Continue Shopping
            </button>
            <p className={styles.note} style={{ textAlign: 'center', margin: '10px 0 0' }}>
              Rebelly&apos;s, Zalka since {SHOP.founded} · <a href={GOOGLE.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rose-500)', fontWeight: 600 }}>{GOOGLE.rating}★ on Google ({GOOGLE.count})</a>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
