'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import Image from 'next/image';
import Icon from '@/components/icons/Icon';
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_ITEMS,
  type PortfolioCategory,
} from '@/lib/portfolio';
import styles from './PortfolioGallery.module.css';

type Filter = 'all' | PortfolioCategory;

export default function PortfolioGallery() {
  const [filter, setFilter] = useState<Filter>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);

  const items = useMemo(
    () => (filter === 'all' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter((i) => i.category === filter)),
    [filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: PORTFOLIO_ITEMS.length };
    for (const i of PORTFOLIO_ITEMS) c[i.category] = (c[i.category] ?? 0) + 1;
    return c;
  }, []);

  // The native <dialog> gives us the focus trap, Escape and inert background.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (openIndex !== null && !dlg.open) dlg.showModal();
    if (openIndex === null && dlg.open) dlg.close();
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [openIndex]);

  const step = useCallback(
    (dir: 1 | -1) => {
      setOpenIndex((i) => (i === null ? i : (i + dir + items.length) % items.length));
    },
    [items.length]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  };

  const onTouchStart = (e: TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
  };

  const current = openIndex !== null ? items[openIndex] : null;
  const label = filter === 'all' ? 'all work' : PORTFOLIO_CATEGORIES.find((c) => c.id === filter)?.label.toLowerCase();

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter the portfolio by category">
        {[{ id: 'all' as const, label: 'All' }, ...PORTFOLIO_CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.filter} ${filter === c.id ? styles.filterActive : ''}`}
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
            <span className={styles.count} aria-hidden="true">{counts[c.id]}</span>
          </button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Showing {items.length} photos of {label}.
      </p>

      <ul className={styles.grid}>
        {items.map((item, i) => (
          <li key={item.id} className={styles.cell}>
            <button
              type="button"
              className={styles.tile}
              onClick={() => setOpenIndex(i)}
              aria-haspopup="dialog"
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(min-width: 1000px) 380px, (min-width: 560px) 46vw, 92vw"
                className={`${styles.img} ${item.trim ? styles.trim : ''}`}
                priority={i < 3}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label="Portfolio photo viewer"
        onKeyDown={onKeyDown}
        onClose={() => setOpenIndex(null)}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t === e.currentTarget || t.dataset.dismiss) dialogRef.current?.close();
        }}
      >
        {current && (
          <div className={styles.stage} data-dismiss="true" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <button
              type="button"
              className={`${styles.ctrl} ${styles.close}`}
              onClick={() => dialogRef.current?.close()}
              aria-label="Close viewer"
              autoFocus
            >
              <Icon name="close" size={22} />
            </button>

            <button
              type="button"
              className={`${styles.ctrl} ${styles.prev}`}
              onClick={() => step(-1)}
              aria-label="Previous photo"
            >
              <Icon name="arrow-left" size={22} />
            </button>

            <div className={styles.photoWrap} data-dismiss="true">
              <Image
                key={current.id}
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
                sizes="92vw"
                className={`${styles.photo} ${current.trim ? styles.trim : ''}`}
                priority
              />
            </div>

            <button
              type="button"
              className={`${styles.ctrl} ${styles.next}`}
              onClick={() => step(1)}
              aria-label="Next photo"
            >
              <Icon name="arrow-right" size={22} />
            </button>

            <p className={styles.counter} aria-live="polite">
              {(openIndex ?? 0) + 1} / {items.length}
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
