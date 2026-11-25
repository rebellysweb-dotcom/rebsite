'use client';

import { useCartStore } from '@/store/cart';
import { relevantAddOns } from '@/lib/storefront';
import styles from './AddOnPicker.module.css';

/** One-tap add-ons with prices, ordered by what is in the cart. Used in the cart drawer and checkout. */
export default function AddOnPicker({ label = 'Add a finishing touch' }: { label?: string }) {
  const { items, addItem, removeItem } = useCartStore();
  const { list, hint } = relevantAddOns(items.map((i) => i.id));

  return (
    <div className={styles.addOns}>
      <p className={styles.addOnsLabel}>{label}</p>
      <p className={styles.hint}>{hint}</p>
      <div className={styles.addOnsRow}>
        {list.map((ao) => {
          const active = items.some((i) => i.lineId === ao.id);
          return (
            <button
              key={ao.id}
              type="button"
              className={`${styles.addOn} ${active ? styles.addOnActive : ''}`}
              onClick={() =>
                active
                  ? removeItem(ao.id)
                  : addItem({
                      id: ao.id,
                      name: ao.name,
                      price_usd: ao.price_usd,
                      image_url: 'imageUrl' in ao ? ao.imageUrl : null,
                      is_event_product: false,
                      slug: ao.slug,
                    })
              }
              aria-pressed={active}
              aria-label={`${active ? 'Remove' : 'Add'} ${ao.name}, ${ao.price_usd === 0 ? 'free' : `$${ao.price_usd}`}`}
            >
              <span className={styles.addOnName}>{active ? '✓ ' : ''}{ao.name}</span>
              <span className={styles.addOnPrice}>{ao.price_usd === 0 ? 'Free' : `+$${ao.price_usd}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
