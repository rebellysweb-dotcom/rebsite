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
  const visible = active === 'all' ? products : products.filter((p) => p.category === active);

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
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No products in this collection yet.</p>
        </div>
      )}
    </>
  );
}
