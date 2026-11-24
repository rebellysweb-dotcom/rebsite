'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { formatUsd } from '@/lib/utils';
import Icon from './icons/Icon';
import styles from './CartDrawer.module.css';

const ADD_ONS = [
  { id: 'addon-card', name: 'Greeting Card', price_usd: 0, slug: 'addon-card' },
  { id: 'addon-balloon-sm', name: 'Balloon S', price_usd: 3, slug: 'addon-balloon-sm' },
  { id: 'addon-balloon-lg', name: 'Balloon L', price_usd: 5, slug: 'addon-balloon-lg' },
  { id: 'addon-balloon-helium', name: 'Helium 18"', price_usd: 12, slug: 'addon-balloon-helium' },
  { id: 'addon-teddy', name: 'Teddy Bear', price_usd: 15, imageUrl: '/images/products/ralph-teddy-bear-1.jpg', slug: 'addon-teddy' },
] as const;

export default function CartDrawer() {
  const { items, isOpen, closeCart, addItem, removeItem, updateQuantity, totalItems, totalUsd } =
    useCartStore();

  // Load the saved cart from localStorage once, after the first render.
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
            Your Cart
            {totalItems() > 0 && (
              <span className={styles.count}>{totalItems()}</span>
            )}
          </span>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={closeCart}
            aria-label="Close cart"
          >
            <Icon name="close" size={18} />
            Close
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true"><Icon name="bag" size={22} /></span>
              <p className={styles.emptyText}>Your cart is empty</p>
              <p className={styles.emptySub}>Browse our collections and add something beautiful.</p>
              <Link
                href="/collections"
                className={`btn btn-primary ${styles.shopBtn}`}
                onClick={closeCart}
              >
                Browse Flowers
                <Icon name="arrow-right" size={18} motion="nudge" />
              </Link>
            </div>
          ) : (
            <ul className={styles.list} aria-label="Cart items">
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  {/* Thumbnail */}
                  <div className={styles.thumb} aria-hidden="true">
                    {item.image_url && (
                      <Image src={item.image_url} alt="" fill sizes="64px" className={styles.thumbImg} />
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.info}>
                    <p className={styles.name}>{item.name}</p>
                    {item.is_event_product && (
                      <span className={styles.eventTag}>Event</span>
                    )}
                    <p className={styles.price}>
                      {item.price_usd != null
                        ? formatUsd(item.price_usd * item.quantity)
                        : 'Price on request'}
                    </p>

                    {/* Quantity controls */}
                    <div className="qty-ctrl" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Icon name="minus" size={18} />
                      </button>
                      <span className="qty-val" aria-live="polite" aria-atomic="true">
                        {item.quantity}
                      </span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Icon name="plus" size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Icon name="trash" size={18} />
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.addOnsSection}>
            <p className={styles.addOnsLabel}>Add a finishing touch</p>
            <div className={styles.addOnsRow}>
              {ADD_ONS.map((ao) => {
                const active = items.some(i => i.lineId === ao.id);
                return (
                  <button
                    key={ao.id}
                    type="button"
                    className={`${styles.addonTile} ${active ? styles.addonTileActive : ''}`}
                    onClick={() => active
                      ? removeItem(ao.id)
                      : addItem({ id: ao.id, name: ao.name, price_usd: ao.price_usd, image_url: 'imageUrl' in ao ? ao.imageUrl : null, is_event_product: false, slug: ao.slug })
                    }
                    aria-pressed={active}
                    aria-label={`${active ? 'Remove' : 'Add'} ${ao.name}`}
                  >
                    {'imageUrl' in ao ? (
                      <span className={styles.addonThumb} aria-hidden="true">
                        <Image src={ao.imageUrl} alt="" fill sizes="40px" className={styles.thumbImg} />
                      </span>
                    ) : (
                      <span className={styles.addonIcon} aria-hidden="true">
                        <Icon name={ao.id === 'addon-card' ? 'card' : 'balloon'} size={22} />
                        {active && <span className={styles.addonCheck}><Icon name="check" size={12} /></span>}
                      </span>
                    )}
                    <span className={styles.addonName}>{ao.name}</span>
                    <span className={styles.addonPrice}>{ao.price_usd === 0 ? 'Free' : `+$${ao.price_usd}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer — only when items exist */}
        {items.length > 0 && (
          <div className="drawer-footer">
            <div className={styles.totals}>
              <span className={styles.totalLabel}>Estimated Total</span>
              <span className={styles.totalValue}>
                {totalUsd() > 0 ? formatUsd(totalUsd()) : 'Confirm at checkout'}
              </span>
            </div>
            <p className={styles.note}>
              Final price, delivery fee and availability are confirmed by our team on WhatsApp.
            </p>
            <Link
              href="/checkout"
              className={`btn btn-primary ${styles.checkoutBtn}`}
              onClick={closeCart}
            >
              Proceed to Checkout
              <Icon name="arrow-right" size={18} motion="nudge" />
            </Link>
            <button
              type="button"
              className={`btn btn-outline ${styles.continueBtn}`}
              onClick={closeCart}
            >
              <Icon name="arrow-left" size={18} motion="nudge-back" />
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
