// Public Storefront API settings. The Storefront public access token is safe
// in the browser by Shopify design; Admin API credentials must never use a
// NEXT_PUBLIC_ variable. `process.env.NEXT_PUBLIC_*` must be read literally so
// Next.js can inline the values into the client bundle.

/** Storefront and Admin API version. Upgrade deliberately, about once a year. */
export const SHOPIFY_API_VERSION = '2026-10';
/** Manual collection the seed script fills with the sample catalog, in display order. */
export const CATALOG_COLLECTION_HANDLE = 'homepage';

const MYSHOPIFY_DOMAIN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

function normalizeDomain(value: string | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

const domain = normalizeDomain(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN);
const publicToken = (process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? '').trim();

export const shopifyConfig = {
  domain,
  publicToken,
  /** Buyer country for prices, availability and checkout. */
  country: 'AE' as const,
  shopId: (process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID ?? '').trim(),
  storefrontId: (process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID ?? '').trim(),
  endpoint: `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`,
};

/**
 * A half-filled configuration is an error rather than a silent fallback to the
 * sample catalog, which would otherwise show concept prices on a live site.
 */
export const shopifyConfigError = (() => {
  if (!domain && !publicToken) return null;
  if (!MYSHOPIFY_DOMAIN.test(domain)) return 'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN must be the store’s *.myshopify.com domain.';
  if (!publicToken) return 'NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is missing.';
  return null;
})();

export const isShopifyConfigured = Boolean(domain && publicToken) && !shopifyConfigError;

export const isShopifyAnalyticsEnabled = isShopifyConfigured && Boolean(shopifyConfig.shopId);
