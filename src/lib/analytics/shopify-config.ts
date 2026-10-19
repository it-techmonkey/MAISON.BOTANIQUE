import type { ConsentConfig, ShopifyScriptsShop } from '@shopify/hydrogen';
import { isShopifyConfigured, shopifyConfig } from '@/lib/shopify/config';

/**
 * No banner: Shopify's Customer Privacy API applies the default consent for
 * the visitor's region (set under Settings > Customer privacy), and Shopify
 * delivers analytics only where that allows it.
 */
export const SHOPIFY_CONSENT: ConsentConfig = { mode: 'no-banner' };

/** The shop identifiers for Shopify's scripts, or null when analytics is off. */
export function shopifyScriptsShop(): ShopifyScriptsShop | null {
  if (!isShopifyConfigured || !shopifyConfig.shopId) return null;
  return {
    shopId: shopifyConfig.shopId,
    // Headless channel analytics omit it, but the scripts require a value.
    storefrontId: shopifyConfig.storefrontId || '0',
    myshopifyDomain: shopifyConfig.domain,
  };
}

export const isShopifyAnalyticsEnabled = shopifyScriptsShop() !== null;
