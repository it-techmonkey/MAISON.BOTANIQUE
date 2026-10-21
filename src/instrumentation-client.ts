// Starts PostHog once the page has loaded and the browser is idle, so the
// first photo and the page's own scripts load first. Events from before then
// are queued (see posthog-client.ts); the first pageview is captured at init.

import { isPostHogEnabled } from '@/lib/analytics/config';
import { postHog } from '@/lib/analytics/posthog-client';

if (isPostHogEnabled && typeof window !== 'undefined') {
  const start = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => { void postHog.start(); }, { timeout: 2000 });
    else setTimeout(() => { void postHog.start(); }, 200);
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
