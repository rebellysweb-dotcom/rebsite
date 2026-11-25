'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import styles from './CollectionsClient.module.css';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'christmas', label: 'Christmas Specials' },
  { value: 'new-born', label: 'New Born' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export default function CollectionsClient({ products }: { products: Product[] }) {
  const [active, setActive] = useState<TabValue>('all');
  // D1 rows have no category column, so fall back to the tag ("Christmas Special" / "New Born").
  const categoryOf = (p: Product) =>
    p.category ?? (p.tag === 'New Born' ? 'new-born' : p.tag?.startsWith('Christmas') ? 'christmas' : 'other');
  const visible = active === 'all' ? products : products.filter((p) => categoryOf(p) === active);

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Filter collections">
        {TABS.map((tab) => {
          const selected = tab.value === active;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`${styles.tab} ${selected ? styles.tabActive : ''}`}
              onClick={() => setActive(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

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
          <p>No products in this collection yet.</p>
        </div>
      )}
    </>
  );
}
