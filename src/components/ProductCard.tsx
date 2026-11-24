'use client';

import { useState, memo, useEffect, useRef } from 'react';
import type { Product, EventProduct } from '@/types';
import { formatUsd } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import ProductGallery from './ProductGallery';
import styles from './ProductCard.module.css';

type CardProduct = (Product | EventProduct) & { is_event_product?: boolean; event_id?: string };

interface ProductCardProps {
  product: CardProduct;
  lbpRate?: number;
  eventId?: string;
}

const lbpFormatter = new Intl.NumberFormat('en-LB');

/**
 * Product card. 3:4 photograph first, words second.
 * Desktop (fine pointer): "Add to order" rises over the photo on hover or keyboard focus.
 * Touch: the button is always visible, and the card answers a press instead of a hover.
 * Image loading (lazy + blur placeholder) is handled by ProductGallery / next/image.
 */
const ProductCard = memo(function ProductCard({ product, lbpRate, eventId }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const isEvent = 'event_id' in product || !!eventId;

  function handleAdd() {
    addItem({
      id:               product.id,
      name:             product.name,
      price_usd:        product.price_usd ?? null,
      image_url:        product.image_url ?? null,
      is_event_product: isEvent,
      event_id:         eventId ?? ('event_id' in product ? product.event_id : undefined),
      slug:             'slug' in product ? product.slug : product.id,
    });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
    openCart();
  }

  const lbpLine =
    lbpRate && product.price_usd
      ? `≈ ${lbpFormatter.format(Math.round(product.price_usd * lbpRate))} LL`
      : null;

  const galleryImages: string[] =
    'image_urls' in product && Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url ? [product.image_url] : [];

  return (
    <article className={styles.card} aria-label={product.name} data-animate="scale-in">
      <div className={styles.imgWrap}>
        <ProductGallery images={galleryImages} alt={product.name} className={styles.gallery} />

        {(product.tag || isEvent) && (
          <div className={styles.tags}>
            {product.tag && <span className={styles.tag}>{product.tag}</span>}
            {isEvent && <span className={`${styles.tag} ${styles.tagGold}`}>Event special</span>}
          </div>
        )}

        <button
          id={`add-to-cart-${product.id}`}
          type="button"
          className={`${styles.addBtn} ${added ? styles.added : ''}`}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to order`}
        >
          {added ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Added
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add to order
            </>
          )}
        </button>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>

        {'description' in product && product.description && (
          <p className={styles.desc}>{product.description}</p>
        )}

        <p className={styles.priceRow}>
          <span className={styles.price}>
            {product.price_usd != null ? formatUsd(product.price_usd) : 'Price on request'}
          </span>
          {lbpLine && <span className={styles.lbp}>{lbpLine}</span>}
        </p>
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {added ? `${product.name} added to your order` : ''}
      </span>
    </article>
  );
});

export default ProductCard;
