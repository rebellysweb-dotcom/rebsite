'use client';

import { useState, memo } from 'react';
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

const ProductCard = memo(function ProductCard({ product, lbpRate, eventId }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

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
    setTimeout(() => setAdded(false), 1800);
    openCart();
  }

  const lbpLine =
    lbpRate && product.price_usd
      ? `≈ ${lbpFormatter.format(Math.round(product.price_usd * lbpRate))} LL`
      : null;

  // Merge image_urls array with the primary image_url for the gallery.
  // image_urls takes precedence when populated; falls back to [image_url].
  const galleryImages: string[] = (() => {
    const urls = ('image_urls' in product && Array.isArray(product.image_urls) && product.image_urls.length > 0)
      ? product.image_urls
      : product.image_url ? [product.image_url] : [];
    return urls;
  })();

  return (
    <article className={styles.card} aria-label={product.name}>
      {/* Image gallery */}
      <div className={styles.imgWrap}>
        <ProductGallery images={galleryImages} alt={product.name} className={styles.gallery} />

        {/* Hover overlay */}
        <div className={styles.overlay} aria-hidden="true">
          <span className={styles.overlayText}>View Details</span>
        </div>

        {/* Tags */}
        <div className={styles.tags}>
          {product.tag && (
            <span className={`badge badge-rose ${styles.tagBadge}`}>{product.tag}</span>
          )}
          {isEvent && (
            <span className={`badge badge-gold ${styles.tagBadge}`}>Event Special</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>

        {'description' in product && product.description && (
          <p className={styles.desc}>{product.description}</p>
        )}

        {/* Price */}
        <div className={styles.priceRow}>
          <span className={styles.price}>
            {product.price_usd != null ? formatUsd(product.price_usd) : 'Price on request'}
          </span>
          {lbpLine && <span className={styles.lbp}>{lbpLine}</span>}
        </div>

        {/* Add to Cart */}
        <button
          id={`add-to-cart-${product.id}`}
          className={`btn ${added ? styles.addedBtn : styles.addBtn}`}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
        >
          {added ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Added!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.97-1.61L23 6H6"/>
              </svg>
              Add to Cart
            </>
          )}
        </button>
        <span aria-live="polite" aria-atomic="true" style={{position:"absolute",width:"1px",height:"1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap"}}>
          {added ? "Added to cart" : ""}
        </span>
      </div>
    </article>
  );
});

export default ProductCard;
