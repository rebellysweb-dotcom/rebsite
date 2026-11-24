'use client';

/**
 * ScrollAnimations — one IntersectionObserver for the whole site.
 *
 *   data-animate="fade-up"    fade + translateY (24px desktop / 12px mobile)
 *   data-animate="fade-left"  fade + translateX
 *   data-animate="scale-in"   scale .92 → 1
 *   data-animate="stagger"    children with .stagger-item enter 80ms apart
 *
 * Legacy names (fadeUp, fadeLeft, fadeRight, fadeIn) still work.
 * Distances, easing (--ease-spring) and delays (--stagger-index) live in globals.css.
 * prefers-reduced-motion: everything is shown immediately, no observer.
 */

import { useEffect } from 'react';

const SELECTOR = '[data-animate]';

function prepStagger(el: Element) {
  if (el.getAttribute('data-animate') !== 'stagger') return;
  el.querySelectorAll<HTMLElement>('.stagger-item').forEach((child, i) => {
    if (!child.style.getPropertyValue('--stagger-index')) {
      child.style.setProperty('--stagger-index', String(i));
    }
  });
}

function reveal(el: Element) {
  el.classList.add('animated', 'visible'); // 'visible' kept for older styles
}

export default function ScrollAnimations() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = new WeakSet<Element>();

    const io = reduced || !('IntersectionObserver' in window)
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              reveal(entry.target);
              io?.unobserve(entry.target);
            }
          },
          { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        );

    const scan = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        prepStagger(el);
        if (io) io.observe(el);
        else reveal(el);
      });
    };

    scan(document);

    // Streamed / client-rendered content (Suspense, route changes) arrives later.
    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => { pending = 0; scan(document); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
      if (pending) cancelAnimationFrame(pending);
    };
  }, []);

  return null;
}
