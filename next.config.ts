import { readFileSync } from 'node:fs';
import type { NextConfig } from 'next';
import { POSTHOG_HOSTS, POSTHOG_RELAY_PATH } from './src/lib/analytics/config';

// Product names and URLs changed on 2026-10-20: each old /shop/<handle> goes to the new one.
const renamedProducts: Array<{ oldHandle: string; handle: string }> = JSON.parse(
  readFileSync(new URL('./catalog/shopify-export/product-renames.json', import.meta.url), 'utf8'),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Shopify product photography; local concept images need no entry. No
    // `search` key, so Shopify's `?v=` cache-busting query is allowed.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/**' }],
    qualities: [75],
  },
  // PostHog's API paths end in a slash. src/proxy.ts still strips trailing
  // slashes from every other URL, so site URLs behave as before.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // No framing by other sites, except PostHog's heatmap and toolbar views.
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://us.posthog.com https://eu.posthog.com" },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.shopify.com")' },
      ],
    }];
  },
  async redirects() {
    return [
      { source: '/jvc', destination: '/?offer=open', permanent: true },
      ...renamedProducts.map(({ oldHandle, handle }) => ({ source: `/products/${oldHandle}`, destination: `/shop/${handle}`, permanent: true })),
      { source: '/products/:handle', destination: '/shop/:handle', permanent: true },
      { source: '/products', destination: '/shop', permanent: true },
      { source: '/collections/all', destination: '/shop', permanent: true },
      { source: '/policies/refund-policy', destination: '/refund-policy', permanent: true },
      { source: '/policies/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/policies/terms-of-service', destination: '/terms', permanent: true },
      ...renamedProducts.map(({ oldHandle, handle }) => ({ source: `/shop/${oldHandle}`, destination: `/shop/${handle}`, permanent: true })),
      // Occasions are filters on the collection now, not pages.
      { source: '/occasions/just-because', destination: '/shop#occasion/gifts-for-her', permanent: true },
      { source: '/occasions/:occasion', destination: '/shop#occasion/:occasion', permanent: true },
      { source: '/occasions', destination: '/#occasions', permanent: true },
    ];
  },
  async rewrites() {
    // Same-origin relay to PostHog, so ad blockers don't drop analytics.
    return [
      { source: `${POSTHOG_RELAY_PATH}/static/:path*`, destination: `${POSTHOG_HOSTS.assets}/static/:path*` },
      { source: `${POSTHOG_RELAY_PATH}/array/:path*`, destination: `${POSTHOG_HOSTS.assets}/array/:path*` },
      { source: `${POSTHOG_RELAY_PATH}/:path*`, destination: `${POSTHOG_HOSTS.ingest}/:path*` },
    ];
  },
};

export default nextConfig;
