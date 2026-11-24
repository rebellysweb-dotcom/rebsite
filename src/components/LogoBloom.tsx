'use client';
import { useEffect, useState } from 'react';
import styles from './LogoBloom.module.css';

export default function LogoBloom({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    // petal bloom: 800ms, then hold: 400ms, then fade out: 500ms
    const t1 = setTimeout(() => setPhase('hold'), 800);
    const t2 = setTimeout(() => setPhase('out'), 1200);
    const t3 = setTimeout(() => onDone(), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className={`${styles.splash} ${phase === 'out' ? styles.splashOut : ''}`} aria-hidden="true">
      <div className={styles.mark}>
        {/* 4 petals bloom in sequence. Each petal is rotated by a parent <g>
            so the CSS transform animation on the ellipse does not override the rotation. */}
        <svg viewBox="0 0 40 40" className={styles.svg} xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(0 20 20)">
            <ellipse className={`${styles.petal} ${styles.p0}`} cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c"/>
          </g>
          <g transform="rotate(90 20 20)">
            <ellipse className={`${styles.petal} ${styles.p1}`} cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c"/>
          </g>
          <g transform="rotate(180 20 20)">
            <ellipse className={`${styles.petal} ${styles.p2}`} cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c"/>
          </g>
          <g transform="rotate(270 20 20)">
            <ellipse className={`${styles.petal} ${styles.p3}`} cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c"/>
          </g>
          <circle className={styles.center} cx="20" cy="20" r="6" fill="#c9a84c"/>
          <circle cx="20" cy="20" r="2.5" fill="#e8d095" className={styles.center}/>
        </svg>
        <span className={styles.wordmark}>Rebelly&apos;s</span>
      </div>
    </div>
  );
}
