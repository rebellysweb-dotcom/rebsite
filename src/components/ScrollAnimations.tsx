'use client';

import { useEffect } from 'react';

export default function ScrollAnimations() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Initial observe
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => io.observe(el));

    const mainEl = document.querySelector('main');
    if (!mainEl) return () => io.disconnect();

    const mutationObserver = new MutationObserver(() => {
      mainEl.querySelectorAll('[data-animate]:not(.visible)').forEach((el) => io.observe(el));
    });

    mutationObserver.observe(mainEl, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
