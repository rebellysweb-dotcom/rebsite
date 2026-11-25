'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { categoryOf, inBand, PRICE_BANDS, type PriceBand } from '@/lib/storefront';
import { formatUsd } from '@/lib/utils';
import styles from './CollectionsClient.module.css';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'christmas', label: 'Christmas Specials' },
  { value: 'new-born', label: 'New Born' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

interface Props {
  products: Product[];
  initialCategory?: string;
  initialBand?: string;
}

export default function CollectionsClient({ products, initialCategory, initialBand }: Props) {
  const [active, setActive] = useState<TabValue>(
    TABS.some((t) => t.value === initialCategory) ? (initialCategory as TabValue) : 'all'
  );
  const [band, setBand] = useState<PriceBand>(
    PRICE_BANDS.some((b) => b.value === initialBand) ? (initialBand as PriceBand) : 'any'
  );

  const inCategory = (p: Product) => active === 'all' || categoryOf(p) === active;
  const visible = products.filter((p) => inCategory(p) && inBand(p.price_usd, band));

  // Price range of what is currently in the category (real catalog data only).
  const inCat = products.filter(inCategory);
  const prices = inCat.map((p) => p.price_usd).filter((n): n is number => n != null);
  const range = prices.length
    ? Math.min(...prices) === Math.max(...prices)
      ? formatUsd(prices[0])
      : `${formatUsd(Math.min(...prices))} – ${formatUsd(Math.max(...prices))}`
    : null;

  return (
    <>
      <div className={styles.tabs} role="group" aria-label="Filter by collection">
        {TABS.map((tab) => {
          const selected = tab.value === active;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={selected}
              className={`${styles.tab} ${selected ? styles.tabActive : ''}`}
              onClick={() => setActive(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={`${styles.tabs} ${styles.bandTabs}`} role="group" aria-label="Filter by budget">
        {PRICE_BANDS.map((b) => {
          const selected = b.value === band;
          return (
            <button
              key={b.value}
              type="button"
              aria-pressed={selected}
              className={`${styles.tab} ${styles.tabSm} ${selected ? styles.tabActive : ''}`}
              onClick={() => setBand(b.value)}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      <p className={styles.count} aria-live="polite">
        {visible.length} {visible.length === 1 ? 'gift' : 'gifts'}
        {range && band === 'any' ? ` · ${range}` : ''}
      </p>

      {visible.length > 0 ? (
        <div className={styles.grid}>
          {visible.map((product) => (
            <div key={product.id} data-animate="fadeUp">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>Nothing in this budget for that collection.</p>
          <button
            type="button"
            className={`${styles.tab} ${styles.tabActive}`}
            style={{ marginTop: '1rem' }}
            onClick={() => { setBand('any'); setActive('all'); }}
          >
            Show all gifts
          </button>
        </div>
      )}
    </>
  );
}
