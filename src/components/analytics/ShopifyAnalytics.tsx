'use client';

import { initializeShopifyScripts } from '@shopify/hydrogen';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { SHOPIFY_CONSENT, isShopifyAnalyticsEnabled } from '@/lib/analytics/shopify-config';
import { publishPageViewed } from '@/lib/analytics/shopify';

let initialized = false;

/** Starts Shopify's scripts after hydration and reports a page view per URL. */
function Tracker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    void initializeShopifyScripts({
      consent: SHOPIFY_CONSENT,
      navigate: (url) => router.push(url),
      // WebMCP agent tools are not used by this storefront.
      webMcp: false,
    });
  }, [router]);

  useEffect(() => { publishPageViewed(); }, [pageKey]);

  return null;
}

export default function ShopifyAnalytics() {
  if (!isShopifyAnalyticsEnabled) return null;
  return <Suspense fallback={null}><Tracker /></Suspense>;
}
