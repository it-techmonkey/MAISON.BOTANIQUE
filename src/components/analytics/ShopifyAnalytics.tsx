'use client';

import { initializeShopifyScripts } from '@shopify/hydrogen';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { SHOPIFY_CONSENT, isShopifyAnalyticsEnabled } from '@/lib/analytics/shopify-config';
import { publishPageViewed } from '@/lib/analytics/shopify';
import { metaTrack, rememberMetaClickId, setMetaConsent } from '@/lib/analytics/meta-pixel';

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

/** Meta Pixel page views, sent only once Shopify's privacy settings allow marketing. */
function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    rememberMetaClickId();
    const update = () => {
      const privacy = window.Shopify?.customerPrivacy;
      setMetaConsent(privacy?.consentStatus === 'loaded' ? Boolean(privacy.marketingAllowed() && privacy.saleOfDataAllowed()) : null);
    };
    document.addEventListener('visitorConsentCollected', update);
    document.addEventListener('consentTrackingApiLoaded', update);
    update();
    return () => {
      document.removeEventListener('visitorConsentCollected', update);
      document.removeEventListener('consentTrackingApiLoaded', update);
    };
  }, []);

  useEffect(() => { metaTrack('PageView'); }, [pageKey]);

  return null;
}

export default function ShopifyAnalytics() {
  return <Suspense fallback={null}><MetaPixel />{isShopifyAnalyticsEnabled && <Tracker />}</Suspense>;
}
