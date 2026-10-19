'use client';

import { useEffect } from 'react';

/** Fades `.reveal` blocks in as they enter the viewport, unless reduced motion is preferred. */
export default function Reveal() {
  useEffect(() => {
    const items = [...document.querySelectorAll('.reveal')];
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    items.forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      document.body.classList.remove('motion-ready');
    };
  }, []);
  return null;
}
