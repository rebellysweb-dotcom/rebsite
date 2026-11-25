'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { getBlurDataUrl } from '@/lib/utils';
import styles from './ProductGallery.module.css';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  /** Passed through to the wrapping element so callers can compose styles */
  className?: string;
}

export default function ProductGallery({ images, alt, className }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [hovered, setHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const validImages = images.filter((_, i) => !imgErrors[i]);
  const total = validImages.length;
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(i => (i - 1 + total) % total);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(i => (i + 1) % total);
  };
  const goTo = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(i);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || total <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      setIndex(i => dx < 0 ? (i + 1) % total : (i - 1 + total) % total);
    }
    touchStartX.current = null;
  }, [total]);

  if (total === 0) {
    return (
      <div className={`${styles.wrap} ${className ?? ''}`}>
        <div className={styles.fallback} aria-hidden="true">🌸</div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.wrap} ${className ?? ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-hovered={hovered}
    >
      {/* Slides */}
      <div
        className={styles.track}
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {validImages.map((src, i) => (
          <div key={src} className={styles.slide}>
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt} — photo ${i + 1}`}
              className={styles.img}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              placeholder="blur"
              blurDataURL={getBlurDataUrl()}
              onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
            />
          </div>
        ))}
      </div>

      {/* Arrows — only shown when there are multiple images */}
      {total > 1 && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={prev}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={next}
            aria-label="Next image"
          >
            ›
          </button>

          {/* Dots */}
          <div className={styles.dots} role="tablist" aria-label="Gallery images">
            {validImages.map((img, i) => (
              <button
                key={img}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Image ${i + 1}`}
                className={`${styles.dot} ${i === safeIndex ? styles.dotActive : ''}`}
                onClick={e => goTo(i, e)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
