'use client';

// Shopify storefront analytics, through the analytics bus that Shopify's
// scripts create (rendered by <ShopifyScriptTags> in the root layout). The
// bus delivers events only while Shopify's Customer Privacy API allows
// analytics for the visitor's region, and attributes them to the Headless
// sales channel.

import { AnalyticsEvent, trackCartAnalytics, type StorefrontAnalytics } from '@shopify/hydrogen';
import type { ShopifyCart } from '@/lib/shopify/cart';
import type { Collection, Product, ProductSize } from '@/lib/types';

type ShopifyWindow = Window & { Shopify?: { analytics?: StorefrontAnalytics; locale?: string } };

export function getShopifyAnalytics(): StorefrontAnalytics | null {
  if (typeof window === 'undefined') return null;
  return (window as ShopifyWindow).Shopify?.analytics ?? null;
}

/** Shopify analytics reads the content language from this global. */
export function setShopifyLocale(locale: 'en' | 'ar') {
  const shopify = typeof window === 'undefined' ? undefined : (window as ShopifyWindow).Shopify;
  if (shopify) shopify.locale = locale;
}

export function publishPageViewed() {
  getShopifyAnalytics()?.publish(AnalyticsEvent.PAGE_VIEWED, {});
}

export function publishProductViewed(product: Product, size: ProductSize) {
  // Sample products have no Shopify IDs; only real products are reported.
  if (!product.shopifyId || !size.variantId) return;
  getShopifyAnalytics()?.publish(AnalyticsEvent.PRODUCT_VIEWED, {
    products: [{
      id: product.shopifyId,
      title: product.name,
      price: { amount: size.price.toFixed(2), currencyCode: product.currencyCode as 'AED' },
      vendor: product.vendor,
      variantId: size.variantId,
      variantTitle: size.name,
      quantity: 1,
      productType: product.productType,
    }],
  });
}

export function publishCollectionViewed(collection: Collection) {
  if (!collection.shopifyId) return;
  getShopifyAnalytics()?.publish(AnalyticsEvent.COLLECTION_VIEWED, {
    collection: { id: collection.shopifyId, handle: collection.id },
  });
}

export function publishSearchViewed(searchTerm: string, totalCount: number) {
  if (!searchTerm) return;
  getShopifyAnalytics()?.publish(AnalyticsEvent.SEARCH_VIEWED, { searchTerm, searchResults: { totalCount } });
}

/** The cart in the shape Shopify's analytics payloads use. */
function toAnalyticsCart(cart: ShopifyCart) {
  return {
    id: cart.id,
    updatedAt: cart.updatedAt,
    cost: { subtotalAmount: { currencyCode: cart.subtotal.currencyCode }, totalAmount: { currencyCode: cart.subtotal.currencyCode } },
    lines: {
      nodes: cart.lines.filter((line) => line.variantId && line.productId).map((line) => ({
        id: line.id,
        quantity: line.quantity,
        merchandise: {
          id: line.variantId,
          title: line.variantTitle,
          price: { amount: line.unitPrice.amount.toFixed(2), currencyCode: line.unitPrice.currencyCode },
          sku: line.sku,
          product: {
            id: line.productId,
            title: line.productTitle,
            vendor: line.vendor,
            productType: line.productType,
            handle: line.productHandle,
          },
        },
      })),
    },
  };
}

export function publishCartViewed(cart: ShopifyCart | null) {
  getShopifyAnalytics()?.publish(AnalyticsEvent.CART_VIEWED, { cart: cart ? toAnalyticsCart(cart) : null });
}

/** The cart in Storefront API shape, which `trackCartAnalytics` converts itself. */
function toCartData(cart: ShopifyCart) {
  return {
    id: cart.id,
    updatedAt: cart.updatedAt,
    cost: { subtotalAmount: { currencyCode: cart.subtotal.currencyCode }, totalAmount: { currencyCode: cart.subtotal.currencyCode } },
    lines: {
      nodes: cart.lines.filter((line) => line.variantId && line.productId).map((line) => ({
        id: line.id,
        quantity: line.quantity,
        cost: { amountPerQuantity: { amount: line.unitPrice.amount.toFixed(2), currencyCode: line.unitPrice.currencyCode } },
        merchandise: {
          id: line.variantId,
          title: line.variantTitle,
          sku: line.sku,
          product: { id: line.productId, title: line.productTitle, vendor: line.vendor, productType: line.productType, handle: line.productHandle },
        },
      })),
    },
  };
}

/**
 * The minimal cart store that `trackCartAnalytics` reads. Shopify publishes
 * cart_updated, product_added_to_cart and product_removed_from_cart itself by
 * diffing confirmed cart states, so events never fire for failed mutations.
 */
export function createCartAnalyticsStore() {
  type State = Parameters<Parameters<Parameters<typeof trackCartAnalytics>[0]['subscribe']>[0]>[0];
  const listeners = new Set<(state: State) => void>();
  const idle = { cost: false, lines: new Set<string>(), discountCodes: new Set<string>(), note: false, attributes: false };
  let state = { data: { id: '', lines: { nodes: [] } }, pending: idle, revalidating: false } as unknown as State;

  return {
    getState: () => state,
    subscribe(listener: (next: State) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    /** Pass the confirmed cart, or `busy: true` while a mutation is in flight. */
    update(cart: ShopifyCart | null, busy: boolean) {
      const data = cart ? toCartData(cart) : { id: '', lines: { nodes: [] } };
      state = { data, pending: idle, revalidating: busy } as unknown as State;
      listeners.forEach((listener) => listener(state));
    },
  };
}

/** Starts Shopify cart tracking once the bus exists. Returns a cleanup function. */
export function startCartAnalytics(store: ReturnType<typeof createCartAnalyticsStore>) {
  if (!getShopifyAnalytics()) return () => {};
  try {
    return trackCartAnalytics(store);
  } catch (error) {
    console.warn('[shopify-analytics] cart tracking unavailable', error);
    return () => {};
  }
}
