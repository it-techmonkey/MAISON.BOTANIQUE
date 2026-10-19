'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackContactClicked, trackNavigationClicked, trackSectionViewed } from '@/lib/analytics/track';

/** Share of the element, or of the viewport for tall sections, that counts as "seen". */
const SEEN_SHARE = 0.4;

function contactChannel(href: string) {
  if (href.startsWith('mailto:')) return 'email';
  if (href.startsWith('tel:')) return 'phone';
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return 'whatsapp';
  if (/^https?:\/\/(www\.)?instagram\.com\//.test(href)) return 'instagram';
  return null;
}

/**
 * Site-wide listeners that need no per-component wiring:
 * - Contact Clicked: email, phone, WhatsApp and Instagram links, wherever they are.
 * - Navigation Clicked: links in the header, footer and bag (`data-track-location`).
 * - Section Viewed: each `data-track-section` element, once per page view.
 */
export default function AnalyticsListeners() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute('href') ?? '';
      const location = link.closest<HTMLElement>('[data-track-location]')?.dataset.trackLocation ?? 'page';
      const channel = contactChannel(href);
      if (channel) { trackContactClicked(channel, location); return; }
      if (location !== 'page' && href.startsWith('/')) {
        const label = (link.getAttribute('aria-label') || link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        trackNavigationClicked(label, href, location);
      }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const seen = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        const section = target.dataset.trackSection;
        if (!section || seen.has(section)) continue;
        const coversViewport = entry.intersectionRect.height >= window.innerHeight * SEEN_SHARE;
        if (entry.intersectionRatio < SEEN_SHARE && !coversViewport) continue;
        seen.add(section);
        observer.unobserve(target);
        trackSectionViewed(section, pathname);
      }
    }, { threshold: [0, 0.1, 0.2, SEEN_SHARE, 0.6, 0.8, 1] });
    document.querySelectorAll('[data-track-section]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
