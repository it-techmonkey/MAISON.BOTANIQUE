'use client';

// The one place where storefront events are defined. Components call these
// functions; each sends to PostHog (ecommerce spec event names) and, where
// Shopify has an equivalent, to Shopify's analytics bus.
//
// Accuracy rules:
// - Cart events fire only after the cart mutation succeeds (see use-shop-cart).
// - View events fire once per viewed thing, not per render.
// - Pageviews are automatic (PostHog: history_change; Shopify: <ShopifyAnalytics>).
// - Purchases are recorded server-side from Shopify's paid-order webhook, not here.
// - No names, emails, phone numbers or gift notes are ever sent.

import type { Locale, Product, ProductSize } from '@/lib/types';
import type { ShopifyCart } from '@/lib/shopify/cart';
import type { CartLineView } from '@/lib/cart/use-shop-cart';
import type { EnquiryKind } from '@/lib/enquiry';
import { dubaiNow, windowLabel, type DeliverySchedule, type ScheduleProblem } from '@/lib/delivery';
import { CART_ATTRIBUTE_DISTINCT_ID, CART_ATTRIBUTE_SESSION_ID, isPostHogEnabled } from './config';
import { postHog } from './posthog-client';
import { publishCartViewed, publishProductViewed, publishSearchViewed } from './shopify';

type Properties = Record<string, unknown>;

/** Sends now, or once PostHog has loaded (posthog-client.ts), stamped with the time it happened. */
function capture(event: string, properties: Properties, options?: { beacon?: boolean }) {
  if (!isPostHogEnabled) return;
  const timestamp = new Date();
  postHog.run((posthog) => posthog.capture(event, properties, { timestamp, ...(options?.beacon ? { transport: 'sendBeacon' as const } : {}) }));
}

function productProperties(product: Product, size?: ProductSize | null, quantity = 1): Properties {
  const price = size?.price ?? product.price;
  return {
    product_id: product.id,
    shopify_product_id: product.shopifyId,
    variant_id: size?.variantId ?? null,
    variant: size?.name ?? null,
    name: product.name,
    category: product.category,
    product_type: product.productType,
    brand: product.vendor,
    price,
    currency: product.currencyCode,
    quantity,
    value: price * quantity,
    url: `/shop/${product.id}`,
    image_url: product.image,
  };
}

function lineProperties(line: CartLineView): Properties {
  return {
    product_id: line.product?.id ?? null,
    shopify_product_id: line.product?.shopifyId ?? null,
    variant_id: line.size?.variantId ?? null,
    variant: line.sizeName,
    name: line.name,
    category: line.category,
    price: line.unitPrice.amount,
    currency: line.unitPrice.currencyCode,
    quantity: line.quantity,
    has_gift_note: Boolean(line.note),
  };
}

// ---------------------------------------------------------------------------
// Browsing
// ---------------------------------------------------------------------------

export function trackProductViewed(product: Product, size: ProductSize) {
  capture('Product Viewed', productProperties(product, size));
  publishProductViewed(product, size);
}

export interface ProductListContext {
  /** Stable list identifier, e.g. `shop`, `home`, `collection:roses`, `occasion:birthday`. */
  listId: string;
  filters?: Properties;
}

export function trackProductListViewed(context: ProductListContext, products: Product[]) {
  capture('Product List Viewed', {
    list_id: context.listId,
    filters: context.filters ?? {},
    result_count: products.length,
    products: products.slice(0, 24).map((product, index) => ({ product_id: product.id, name: product.name, price: product.price, position: index + 1 })),
  });
}

export function trackProductClicked(product: Product, context: ProductListContext, position: number) {
  capture('Product Clicked', { ...productProperties(product), list_id: context.listId, position });
}

export function trackHeroNavigated(product: Product, direction: 'next' | 'previous', position: number, total: number) {
  capture('Hero Arrangement Changed', { ...productProperties(product), direction, position, total });
}

/** Discover or add-to-bag on the home hero. */
export function trackHeroClicked(product: Product, action: 'discover' | 'add_to_bag', position: number) {
  capture('Hero CTA Clicked', { ...productProperties(product), action, position });
}

export function trackProductSizeSelected(product: Product, size: ProductSize) {
  capture('Product Size Selected', productProperties(product, size));
}

/** The first time a gift note is filled in on a product page (its text is never sent). */
export function trackGiftOptionAdded(product: Product, option: 'gift_note', details: Properties = {}) {
  capture('Gift Option Added', { product_id: product.id, name: product.name, option, ...details });
}

function scheduleProperties(schedule: DeliverySchedule | null) {
  if (!schedule) return { has_delivery_schedule: false };
  const today = dubaiNow().date;
  return {
    has_delivery_schedule: true,
    delivery_slot: windowLabel(schedule.slotId, false) || null,
    delivery_days_ahead: Math.round((Date.parse(schedule.date) - Date.parse(today)) / 86_400_000),
    same_day_delivery: schedule.date === today,
  };
}

/** A delivery date and time chosen for the order (product page or bag). */
export function trackDeliveryScheduled(schedule: DeliverySchedule, source: string) {
  capture('Delivery Scheduled', { ...scheduleProperties(schedule), source });
}

export function trackProductsSearched(query: string, resultCount: number, listId: string) {
  capture('Products Searched', { query, result_count: resultCount, list_id: listId });
  publishSearchViewed(query, resultCount);
}

// ---------------------------------------------------------------------------
// Cart and checkout
// ---------------------------------------------------------------------------

export function trackProductAdded(product: Product, size: ProductSize, options: { quantity: number; cartId: string | null; hasGiftNote: boolean; hasDeliveryDate: boolean; source: string }) {
  capture('Product Added', {
    ...productProperties(product, size, options.quantity),
    cart_id: options.cartId,
    has_gift_note: options.hasGiftNote,
    has_delivery_date: options.hasDeliveryDate,
    source: options.source,
  });
}

export function trackProductRemoved(line: CartLineView, quantityRemoved: number, cartId: string | null) {
  capture('Product Removed', { ...lineProperties(line), quantity: quantityRemoved, value: line.unitPrice.amount * quantityRemoved, cart_id: cartId });
}

function cartProperties(lines: CartLineView[], subtotal: number, currency: string, cartId: string | null): Properties {
  return {
    cart_id: cartId,
    value: subtotal,
    currency,
    item_count: lines.reduce((total, line) => total + line.quantity, 0),
    products: lines.map(lineProperties),
  };
}

export function trackCartViewed(lines: CartLineView[], subtotal: number, currency: string, cart: ShopifyCart | null) {
  capture('Cart Viewed', cartProperties(lines, subtotal, currency, cart?.id ?? null));
  publishCartViewed(cart);
}

/** Sent with sendBeacon, because the browser leaves for Shopify checkout right after. */
export function trackCheckoutStarted(lines: CartLineView[], subtotal: number, currency: string, cartId: string | null, locale: Locale, schedule: DeliverySchedule | null) {
  capture('Checkout Started', { ...cartProperties(lines, subtotal, currency, cartId), ...scheduleProperties(schedule), checkout_locale: locale }, { beacon: true });
}

/** Checkout could not start: no valid delivery date and time, or Shopify did not return a checkout URL. */
export function trackCheckoutFailed(reason: ScheduleProblem | 'checkout_url_error', cartId: string | null, value: number) {
  capture('Checkout Failed', { reason, cart_id: cartId, value });
}

/** A Storefront API cart mutation failed (the visitor sees an error in the bag). */
export function trackCartError(operation: string) {
  capture('Cart Error', { operation });
}

/** The hidden cart attributes that tie a Shopify order back to this PostHog visitor and session. */
export async function analyticsCartAttributes(): Promise<Array<{ key: string; value: string }>> {
  if (!isPostHogEnabled) return [];
  // A visitor can add to the bag before PostHog has loaded; wait briefly for it.
  const posthog = await postHog.ready(1500);
  if (!posthog) return [];
  const distinctId = posthog.get_distinct_id();
  const sessionId = posthog.get_session_id();
  return [
    ...(distinctId ? [{ key: CART_ATTRIBUTE_DISTINCT_ID, value: distinctId }] : []),
    ...(sessionId ? [{ key: CART_ATTRIBUTE_SESSION_ID, value: sessionId }] : []),
  ];
}

// ---------------------------------------------------------------------------
// Leads and preferences
// ---------------------------------------------------------------------------

export function trackFormSubmitted(kind: EnquiryKind, topic: string | null, delivery: 'shopify' | 'email_fallback') {
  const event = kind === 'newsletter' ? 'Newsletter Subscribed' : kind === 'offer' ? 'Offer Code Requested' : 'Enquiry Submitted';
  capture(event, { form: kind, topic, delivery });
}

/** First interaction with a form (focus on any field). */
export function trackFormStarted(kind: EnquiryKind) {
  capture('Form Started', { form: kind });
}

/** Validation or delivery problems. Only the field name is sent, never what was typed. */
export function trackFormError(kind: EnquiryKind, reason: 'invalid' | 'failed', field: string | null) {
  capture('Form Error', { form: kind, reason, field });
}

export function trackContactClicked(channel: string, location: string) {
  capture('Contact Clicked', { channel, location }, { beacon: true });
}

export function trackNavigationClicked(label: string, href: string, location: string) {
  capture('Navigation Clicked', { label, href, location });
}

export function trackSectionViewed(section: string, path: string) {
  capture('Section Viewed', { section, path });
}

export function trackPageNotFound(path: string, referrer: string) {
  capture('Page Not Found', { path, referrer: referrer || null });
}

export function trackLocale(locale: Locale, changed: boolean) {
  if (!isPostHogEnabled) return;
  postHog.run((posthog) => posthog.register({ locale }));
  if (changed) capture('Language Changed', { locale });
}

export function registerCatalogSource(source: 'sample' | 'shopify') {
  postHog.run((posthog) => posthog.register({ catalog_source: source }));
}

// ---------------------------------------------------------------------------
// Customer accounts
// ---------------------------------------------------------------------------

/**
 * Links this visitor to the customer's person, the same `shopify_customer:<id>`
 * the order webhook uses. Only the Shopify customer ID is sent.
 */
export function identifyCustomer(customerGid: string) {
  const id = customerGid.split('/').pop();
  if (!isPostHogEnabled || !id) return;
  const distinctId = `shopify_customer:${id}`;
  postHog.run((posthog) => {
    if (posthog.get_distinct_id() === distinctId) return;
    posthog.identify(distinctId, { shopify_customer_id: id, has_customer_account: true });
    capture('Signed In', {});
  });
}

/** Called on sign-out, so the next person on this device starts anonymous. */
export function resetIdentity() {
  if (!isPostHogEnabled) return;
  capture('Signed Out', {}, { beacon: true });
  postHog.run((posthog) => posthog.reset());
}
