'use client';

import { useEffect } from 'react';
import { trackPageNotFound } from '@/lib/analytics/track';

/** Reports the missing URL (and where the visitor came from) from a 404 page. */
export default function PageNotFound() {
  useEffect(() => { trackPageNotFound(window.location.pathname, document.referrer); }, []);
  return null;
}
