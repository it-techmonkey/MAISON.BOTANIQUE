'use client';

import { initializeShopifyScripts } from '@shopify/hydrogen';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { SHOPIFY_CONSENT, isShopifyAnalyticsEnabled } from '@/lib/analytics/shopify-config';
import { publishPageViewed } from '@/lib/analytics/shopify';
import { metaPageView } from '@/lib/analytics/meta-pixel';

let initialized = false;

/** Starts Shopify's scripts after hydration and reports a page view per URL. */
function Tracker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageKey = `${pathname}?${searchParams.toString()}`;
  const [metaAllowed, setMetaAllowed] = useState(false);

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

  useEffect(() => {
    const update = () => {
      const privacy = window.Shopify?.customerPrivacy;
      setMetaAllowed(Boolean(privacy?.consentStatus === 'loaded' && privacy.marketingAllowed() && privacy.saleOfDataAllowed()));
    };
    document.addEventListener('visitorConsentCollected', update);
    document.addEventListener('consentTrackingApiLoaded', update);
    update();
    return () => {
      document.removeEventListener('visitorConsentCollected', update);
      document.removeEventListener('consentTrackingApiLoaded', update);
    };
  }, []);

  useEffect(() => {
    if (metaAllowed && ['maisonbotaniqueflowers.com', 'www.maisonbotaniqueflowers.com'].includes(window.location.hostname)) metaPageView();
  }, [pageKey, metaAllowed]);

  return null;
}

export default function ShopifyAnalytics() {
  if (!isShopifyAnalyticsEnabled) return null;
  return <Suspense fallback={null}><Tracker /></Suspense>;
}
