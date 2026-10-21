'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { attachCartToCustomer, clearAttachedCart, getAccountStatus, writeCartCookie } from '@/lib/account/client';
import {
  DELIVERY_DATE_KEY, DELIVERY_TIME_KEY, checkSchedule, deliveryNote, findSlot, scheduleAttributes, scheduleFromAttributes,
  type DeliverySchedule, type ScheduleProblem,
} from '@/lib/delivery';
import { isValidDate } from '@/lib/format';
import { isShopifyConfigured } from '@/lib/shopify/config';
import {
  ANONYMOUS_ATTRIBUTE, CUSTOM_ATTRIBUTE, GIFT_NOTE_ATTRIBUTE, SIGNED_ATTRIBUTE,
  addCartLines, createCart, fetchCart, getCheckoutUrl, removeCartLines, updateCartAttributes, updateCartLineAttributes,
  updateCartLines, updateCartNote,
  type CartAttribute, type CartLineInput, type ShopifyCart,
} from '@/lib/shopify/cart';
import { deliveryLineUpdates, ensureAddedLineAttributes, withDeliveryProperty } from '@/lib/cart/line-attributes';
import { createCartAnalyticsStore, getShopifyAnalytics, startCartAnalytics } from '@/lib/analytics/shopify';
import { analyticsCartAttributes, trackCartError, trackProductAdded, trackProductRemoved } from '@/lib/analytics/track';
import type { CatalogSource, Locale, Money, Product, ProductSize } from '@/lib/types';

const NOTE_LIMIT = 280;
const MAX_QUANTITY = 99;

export interface CartLineView {
  key: string;
  product: Product | null;
  size: ProductSize | null;
  name: string;
  nameAr: string;
  sizeName: string;
  sizeNameAr: string;
  category: string;
  categoryAr: string;
  image: string;
  note: string;
  /** Card signature, or anonymous. */
  signedAs: string;
  anonymous: boolean;
  /** Personalisation such as a letter or an age number. */
  custom: string;
  quantity: number;
  unitPrice: Money;
}

export interface AddItemOptions {
  sizeId?: string;
  note?: string;
  signedAs?: string;
  anonymous?: boolean;
  custom?: string;
  /** Sets the order's delivery date and time along with the add. */
  delivery?: DeliverySchedule;
  /** Where the add happened, for analytics: `product_page`, `card`, `hero`, `bag_extra`… */
  source?: string;
}

export interface ShopCart {
  mode: CatalogSource;
  lines: CartLineView[];
  cartCount: number;
  subtotal: Money;
  busy: boolean;
  error: boolean;
  clearError: () => void;
  addItem: (product: Product, options?: AddItemOptions) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  /** The order's delivery date and time slot (one per order). */
  delivery: DeliverySchedule | null;
  setDelivery: (schedule: DeliverySchedule) => Promise<void>;
  /** A Shopify checkout URL, or null when the preview catalog has no checkout. */
  checkoutUrl: (locale: Locale, withOffer?: boolean) => Promise<string | null>;
  applyWelcomeOffer?: (enabled?: boolean) => Promise<boolean>;
  /** The confirmed Shopify cart (null in the preview), for analytics payloads. */
  shopifyCart: ShopifyCart | null;
}

/** Reports a quantity change on an existing line as the exact amount added or removed. */
function trackQuantityChange(line: CartLineView | undefined, nextQuantity: number, cartId: string | null, hasDelivery: boolean) {
  if (!line) return;
  const delta = nextQuantity - line.quantity;
  if (delta < 0) trackProductRemoved(line, -delta, cartId);
  if (delta > 0 && line.product && line.size) {
    trackProductAdded(line.product, line.size, {
      quantity: delta, cartId, hasGiftNote: Boolean(line.note), hasDeliveryDate: hasDelivery, source: 'bag',
    });
  }
}

/** Checkout needs a delivery date and time that can still be booked. */
export class DeliveryRequiredError extends Error {
  constructor(readonly problem: ScheduleProblem) {
    super(`A delivery date and time are required (${problem})`);
    this.name = 'DeliveryRequiredError';
  }
}

const clampQuantity = (value: unknown) => Math.max(0, Math.min(MAX_QUANTITY, Number.parseInt(String(value), 10) || 0));

function chooseSize(product: Product, sizeId?: string) {
  return product.sizes.find((size) => size.id === sizeId)
    ?? product.sizes.find((size) => size.available)
    ?? product.sizes[0];
}

// ---------------------------------------------------------------------------
// Delivery schedule chosen before a cart exists, kept in this browser.
// ---------------------------------------------------------------------------

const DELIVERY_KEY = 'maison-botanique-delivery';

function readStoredDelivery(): DeliverySchedule | null {
  try {
    const value = JSON.parse(localStorage.getItem(DELIVERY_KEY) || 'null');
    return value && isValidDate(value.date) && findSlot(value.slotId) ? { date: value.date, slotId: value.slotId } : null;
  } catch { return null; }
}
function writeStoredDelivery(schedule: DeliverySchedule | null) {
  try {
    if (schedule) localStorage.setItem(DELIVERY_KEY, JSON.stringify(schedule));
    else localStorage.removeItem(DELIVERY_KEY);
  } catch { /* Private browsing may block storage. */ }
}

/** The cart's full attribute set with some keys replaced (Shopify replaces the whole set). */
function mergeAttributes(current: Record<string, string>, updates: CartAttribute[], remove: string[] = []): CartAttribute[] {
  const next = new Map(Object.entries(current));
  for (const key of remove) next.delete(key);
  for (const { key, value } of updates) next.set(key, value);
  return [...next].map(([key, value]) => ({ key, value }));
}

// ---------------------------------------------------------------------------
// Shopify cart: the cart ID is the only cart data stored in the browser.
// ---------------------------------------------------------------------------

const CART_ID_KEY = 'maison-botanique-shopify-cart-id';

function readCartId() {
  try { return localStorage.getItem(CART_ID_KEY); } catch { return null; }
}
/**
 * Forgets this browser's bag and delivery choice. Called on sign-out, so the
 * next person on a shared device does not continue the customer's cart.
 */
export function forgetCart() {
  writeCartId(null);
  writeStoredDelivery(null);
  clearAttachedCart();
}

function writeCartId(id: string | null) {
  try {
    if (id) localStorage.setItem(CART_ID_KEY, id);
    else localStorage.removeItem(CART_ID_KEY);
  } catch { /* Private browsing may block storage. */ }
  writeCartCookie(id);
}

function useShopifyCart(products: Product[], locale: Locale): ShopCart {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [storedDelivery, setStoredDelivery] = useState<DeliverySchedule | null>(null);
  // False until the saved cart (if any) has been restored.
  const [restored, setRestored] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const cartRef = useRef<ShopifyCart | null>(null);
  const linesRef = useRef<CartLineView[]>([]);
  const deliveryRef = useRef<DeliverySchedule | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const analyticsStore = useMemo(() => createCartAnalyticsStore(), []);

  const commit = useCallback((next: ShopifyCart | null) => {
    const previousId = cartRef.current?.id ?? null;
    cartRef.current = next;
    setCart(next);
    writeCartId(next?.id ?? null);
    // A new cart for a signed-in customer is attached to their account.
    if (next && next.id !== previousId) void attachCartToCustomer(next.id);
  }, []);

  // Mutations run one at a time so rapid quantity taps apply in order.
  const enqueue = useCallback(<T,>(operation: string, task: () => Promise<T>) => {
    const run = queue.current.then(async () => {
      setBusy(true);
      setError(false);
      try { return await task(); } catch (cause) {
        console.error('[cart]', cause);
        trackCartError(operation);
        setError(true);
        return undefined;
      } finally { setBusy(false); }
    });
    queue.current = run;
    return run;
  }, []);

  useEffect(() => {
    setStoredDelivery(readStoredDelivery());
    const savedId = readCartId();
    if (!savedId) { setRestored(true); return; }
    void enqueue('restore', async () => {
      // A completed or expired cart comes back as null; start fresh next time.
      const restoredCart = await fetchCart(savedId, localeRef.current);
      cartRef.current = restoredCart;
      setCart(restoredCart);
      writeCartId(restoredCart?.id ?? null);
      // After signing in, the existing bag joins the customer's account.
      if (restoredCart) void attachCartToCustomer(restoredCart.id);
    }).finally(() => setRestored(true));
  }, [enqueue]);

  // Shopify cart analytics diff confirmed cart states. Tracking starts only
  // after the saved cart is restored, so an existing bag is not reported as
  // new add-to-carts, and waits for Shopify's scripts to create the bus.
  useEffect(() => {
    if (!restored) return undefined;
    analyticsStore.update(cartRef.current, false);
    let stop: (() => void) | null = null;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (getShopifyAnalytics()) {
        window.clearInterval(timer);
        stop = startCartAnalytics(analyticsStore);
      } else if (attempts > 80) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => { window.clearInterval(timer); stop?.(); };
  }, [restored, analyticsStore]);

  useEffect(() => {
    if (restored) analyticsStore.update(cart, busy);
  }, [cart, busy, restored, analyticsStore]);

  // The schedule on the cart wins; before a cart exists, the one chosen in this browser.
  const delivery = useMemo(
    () => (cart ? scheduleFromAttributes(cart.attributes) : null) ?? storedDelivery,
    [cart, storedDelivery],
  );
  deliveryRef.current = delivery;

  const productByHandle = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const lines = useMemo<CartLineView[]>(() => (cart?.lines ?? []).map((line) => {
    const product = productByHandle.get(line.productHandle) ?? null;
    const size = product?.sizes.find((item) => item.variantId === line.variantId) ?? null;
    return {
      key: line.id,
      product,
      size,
      name: product?.name ?? line.productTitle,
      nameAr: product?.nameAr ?? line.productTitle,
      sizeName: size?.name ?? line.variantTitle,
      sizeNameAr: size?.nameAr ?? line.variantTitle,
      category: product?.category ?? '',
      categoryAr: product?.categoryAr ?? '',
      image: product?.imageSmall ?? line.image ?? '/assets/placeholder.svg',
      note: line.attributes[GIFT_NOTE_ATTRIBUTE] ?? '',
      signedAs: line.attributes[SIGNED_ATTRIBUTE] ?? '',
      anonymous: Boolean(line.attributes[ANONYMOUS_ATTRIBUTE]),
      custom: line.attributes[CUSTOM_ATTRIBUTE] ?? '',
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    };
  }), [cart, productByHandle]);
  linesRef.current = lines;

  /** Writes the visible Delivery property on every line that lacks the current slot. */
  const syncLineDelivery = useCallback(async (target: ShopifyCart, schedule: DeliverySchedule, cartLocale: Locale) => {
    const updates = deliveryLineUpdates(target.lines, schedule);
    if (!updates.length) return target;
    const next = await updateCartLineAttributes(target.id, updates, cartLocale);
    commit(next);
    return next;
  }, [commit]);

  /** Saves the schedule in the browser and, when a cart exists, on the cart. */
  const applyDelivery = useCallback(async (schedule: DeliverySchedule) => {
    setStoredDelivery(schedule);
    writeStoredDelivery(schedule);
    const current = cartRef.current;
    if (!current) return;
    let latest = current;
    const existing = scheduleFromAttributes(current.attributes);
    if (!(existing?.date === schedule.date && existing.slotId === schedule.slotId)) {
      latest = await updateCartAttributes(
        current.id,
        mergeAttributes(current.attributes, scheduleAttributes(schedule), [DELIVERY_DATE_KEY, DELIVERY_TIME_KEY]),
        localeRef.current,
      );
      commit(latest);
    }
    // The readable copy becomes the order note in Shopify.
    const note = deliveryNote(schedule);
    if (note && latest.note !== note) {
      latest = await updateCartNote(latest.id, note, localeRef.current);
      commit(latest);
    }
    // Checkout shows line properties, not attributes or the note.
    await syncLineDelivery(latest, schedule, localeRef.current);
  }, [commit, syncLineDelivery]);

  const setDelivery = useCallback(async (schedule: DeliverySchedule) => {
    await enqueue('schedule_delivery', () => applyDelivery(schedule));
  }, [applyDelivery, enqueue]);

  /**
   * Shopify sometimes returns the new line without its properties (seen once
   * in live testing, cause unknown). Compare, re-apply once, and fail loudly
   * rather than leave a bag that shows a note Shopify does not hold.
   */
  const verifyAddedLine = useCallback(async (
    next: ShopifyCart, before: ShopifyCart | null, variantId: string, sent: Array<{ key: string; value: string }>,
  ) => ensureAddedLineAttributes(
    next, before, variantId, sent,
    (cartId, line) => updateCartLineAttributes(cartId, [line], localeRef.current), commit,
  ), [commit]);

  const addItem = useCallback(async (product: Product, options: AddItemOptions = {}) => {
    const size = chooseSize(product, options.sizeId);
    if (!size?.variantId || !size.available) return;
    const variantId = size.variantId;
    const attributes: CartLineInput['attributes'] = [];
    const note = options.note?.trim().slice(0, NOTE_LIMIT);
    if (note) attributes.push({ key: GIFT_NOTE_ATTRIBUTE, value: note });
    const custom = options.custom?.trim().slice(0, 24);
    if (custom) attributes.push({ key: CUSTOM_ATTRIBUTE, value: custom });
    if (options.anonymous) attributes.push({ key: ANONYMOUS_ATTRIBUTE, value: 'Yes' });
    else if (options.signedAs?.trim()) attributes.push({ key: SIGNED_ATTRIBUTE, value: options.signedAs.trim().slice(0, 60) });

    await enqueue('add', async () => {
      const current = cartRef.current;
      const schedule = options.delivery ?? deliveryRef.current;
      const sentAttributes = withDeliveryProperty(attributes, schedule);
      const lineInput = [{ merchandiseId: variantId, quantity: 1, attributes: sentAttributes }];
      const newCartAttributes = () => [...analyticsCartAttributes(), ...(schedule ? scheduleAttributes(schedule) : [])];
      let next: ShopifyCart;
      try {
        next = current
          ? await addCartLines(current.id, lineInput, localeRef.current)
          : await createCart(lineInput, localeRef.current, newCartAttributes(), schedule ? deliveryNote(schedule) : '');
      } catch (cause) {
        // The saved cart may have been checked out in another tab.
        if (!current) throw cause;
        next = await createCart(lineInput, localeRef.current, newCartAttributes(), schedule ? deliveryNote(schedule) : '');
      }
      commit(next);
      next = await verifyAddedLine(next, current, variantId, sentAttributes);
      if (options.delivery) await applyDelivery(options.delivery);
      trackProductAdded(product, size, {
        quantity: 1, cartId: next.id, hasGiftNote: Boolean(note), hasDeliveryDate: Boolean(schedule), source: options.source ?? 'unknown',
      });
    });
  }, [applyDelivery, commit, enqueue, verifyAddedLine]);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    const nextQuantity = clampQuantity(quantity);
    void enqueue(nextQuantity ? 'update_quantity' : 'remove', async () => {
      const current = cartRef.current;
      if (!current) return;
      const before = linesRef.current.find((line) => line.key === key);
      const next = nextQuantity
        ? await updateCartLines(current.id, [{ id: key, quantity: nextQuantity }], localeRef.current)
        : await removeCartLines(current.id, [key], localeRef.current);
      commit(next);
      trackQuantityChange(before, nextQuantity, next.id, Boolean(deliveryRef.current));
    });
  }, [commit, enqueue]);

  const removeItem = useCallback((key: string) => updateQuantity(key, 0), [updateQuantity]);

  const applyWelcomeOffer = useCallback(async (enabled = true) => {
    const applied = await enqueue('welcome_offer', async () => {
      const current = cartRef.current;
      if (!current) return false;
      let code = '';
      try { code = JSON.parse(localStorage.getItem('mb-launch-offer-v1') || '{}').code || ''; } catch { /* No saved offer. */ }
      if (!code) return false;
      const response = await fetch('/api/offer-cart', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: current.id, code, enabled, locale: localeRef.current }),
      });
      if (!response.ok) throw new Error('Welcome offer could not be applied');
      const result = await response.json();
      if (result.cart) commit(result.cart);
      return Boolean(result.applied);
    });
    if (applied === undefined) throw new Error('Welcome offer could not be applied');
    return applied;
  }, [commit, enqueue]);

  const checkoutUrl = useCallback(async (checkoutLocale: Locale, withOffer = true) => {
    await applyWelcomeOffer(withOffer);
    const current = cartRef.current;
    if (!current) return null;
    // No checkout URL is handed out without a delivery date and time that can
    // still be booked, whichever screen asks for it.
    const schedule = deliveryRef.current;
    const problem = checkSchedule(schedule);
    if (problem || !schedule) throw new DeliveryRequiredError(problem ?? 'missing_date');
    // Stamp the delivery schedule and the current PostHog visitor and session
    // on the cart. Analytics never blocks checkout; the schedule does.
    let latest = current;
    const updates = [...scheduleAttributes(schedule), ...analyticsCartAttributes()];
    const needsUpdate = updates.some(({ key, value }) => current.attributes[key] !== value);
    if (needsUpdate) {
      try {
        latest = await updateCartAttributes(current.id, mergeAttributes(current.attributes, updates), checkoutLocale);
        commit(latest);
      } catch (cause) {
        const onCart = scheduleFromAttributes(current.attributes);
        if (onCart?.date !== schedule.date || onCart.slotId !== schedule.slotId) throw cause;
        console.warn('[cart] analytics attributes', cause);
      }
    }
    // The order note carries the same schedule in words. The attributes are the
    // record, so a failed note never blocks checkout.
    const note = deliveryNote(schedule);
    if (latest.note !== note) {
      try {
        commit(await updateCartNote(latest.id, note, checkoutLocale));
      } catch (cause) {
        console.warn('[cart] delivery note', cause);
      }
    }
    // The visible per-line copy is what checkout shows. Never blocks checkout.
    try {
      latest = await syncLineDelivery(latest, schedule, checkoutLocale);
    } catch (cause) {
      console.warn('[cart] line delivery', cause);
    }
    const url = new URL(await getCheckoutUrl(current.id, checkoutLocale));
    // Signed-in customers go straight to checkout with their details.
    if ((await getAccountStatus()).loggedIn) url.searchParams.set('logged_in', 'true');
    return url.toString();
  }, [commit, applyWelcomeOffer, syncLineDelivery]);

  return {
    applyWelcomeOffer,
    mode: 'shopify',
    lines,
    cartCount: cart?.totalQuantity ?? 0,
    subtotal: cart?.subtotal ?? { amount: 0, currencyCode: products[0]?.currencyCode ?? 'AED' },
    busy,
    error,
    clearError: () => setError(false),
    addItem,
    updateQuantity,
    removeItem,
    delivery,
    setDelivery,
    checkoutUrl,
    shopifyCart: cart,
  };
}

// ---------------------------------------------------------------------------
// Preview cart: sample catalog only, saved in this browser for 30 days.
// ---------------------------------------------------------------------------

const PREVIEW_STORAGE_KEY = 'maison-botanique-concept-cart-v1';
const PREVIEW_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface PreviewLine {
  key: string;
  productId: string;
  sizeId: string;
  note: string;
  signedAs: string;
  anonymous: boolean;
  custom: string;
  quantity: number;
}

function safePreviewLine(raw: unknown, products: Product[]): PreviewLine | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const product = products.find((item) => item.id === value.productId);
  if (!product) return null;
  const size = product.sizes.find((item) => item.id === value.sizeId);
  if (!size) return null;
  const note = typeof value.note === 'string' ? value.note.slice(0, NOTE_LIMIT) : '';
  const anonymous = value.anonymous === true;
  const signedAs = !anonymous && typeof value.signedAs === 'string' ? value.signedAs.slice(0, 60) : '';
  const custom = typeof value.custom === 'string' ? value.custom.slice(0, 24) : '';
  const quantity = Math.max(1, clampQuantity(value.quantity));
  return {
    key: JSON.stringify([product.id, size.id, note, signedAs, anonymous, custom]),
    productId: product.id, sizeId: size.id, note, signedAs, anonymous, custom, quantity,
  };
}

function usePreviewCart(products: Product[]): ShopCart {
  const [saved, setSaved] = useState<PreviewLine[]>([]);
  const [delivery, setDeliveryState] = useState<DeliverySchedule | null>(null);
  // State rather than a ref, so the first save waits for the restored lines.
  const [loaded, setLoaded] = useState(false);

  // Read storage after hydration so server and client render the same markup.
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PREVIEW_STORAGE_KEY) || 'null');
      const age = Date.now() - Number(parsed?.savedAt);
      if (parsed && Array.isArray(parsed.lines) && Number.isFinite(age) && age >= 0 && age <= PREVIEW_TTL_MS) {
        setSaved(parsed.lines.slice(0, 40).map((line: unknown) => safePreviewLine(line, products)).filter(Boolean));
      } else {
        localStorage.removeItem(PREVIEW_STORAGE_KEY);
      }
    } catch { /* Storage unavailable or corrupt. */ }
    setDeliveryState(readStoredDelivery());
    setLoaded(true);
  }, [products]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), lines: saved })); } catch { /* Private browsing may block storage. */ }
  }, [saved, loaded]);

  const lines = useMemo(() => saved.flatMap<CartLineView>((line) => {
    const product = products.find((item) => item.id === line.productId);
    const size = product?.sizes.find((item) => item.id === line.sizeId);
    if (!product || !size) return [];
    return [{
      key: line.key, product, size,
      name: product.name, nameAr: product.nameAr,
      sizeName: size.name, sizeNameAr: size.nameAr,
      category: product.category, categoryAr: product.categoryAr,
      image: product.imageSmall, note: line.note, signedAs: line.signedAs, anonymous: line.anonymous, custom: line.custom, quantity: line.quantity,
      unitPrice: { amount: size.price, currencyCode: product.currencyCode },
    }];
  }), [saved, products]);

  const setDelivery = useCallback(async (schedule: DeliverySchedule) => {
    setDeliveryState(schedule);
    writeStoredDelivery(schedule);
  }, []);

  const deliveryRef = useRef<DeliverySchedule | null>(null);
  deliveryRef.current = delivery;

  const addItem = useCallback(async (product: Product, options: AddItemOptions = {}) => {
    const line = safePreviewLine({
      productId: product.id,
      sizeId: chooseSize(product, options.sizeId)?.id,
      note: options.note?.trim() ?? '',
      signedAs: options.signedAs?.trim() ?? '',
      anonymous: options.anonymous === true,
      custom: options.custom?.trim() ?? '',
      quantity: 1,
    }, products);
    if (!line) return;
    if (options.delivery) void setDelivery(options.delivery);
    setSaved((current) => current.some((item) => item.key === line.key)
      ? current.map((item) => item.key === line.key ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) } : item)
      : [...current, line]);
    const size = product.sizes.find((item) => item.id === line.sizeId);
    if (size) {
      trackProductAdded(product, size, {
        quantity: 1, cartId: null, hasGiftNote: Boolean(line.note),
        hasDeliveryDate: Boolean(options.delivery ?? deliveryRef.current), source: options.source ?? 'unknown',
      });
    }
  }, [products, setDelivery]);

  const linesRef = useRef<CartLineView[]>([]);
  linesRef.current = lines;
  const updateQuantity = useCallback((key: string, quantity: number) => {
    const nextQuantity = clampQuantity(quantity);
    trackQuantityChange(linesRef.current.find((line) => line.key === key), nextQuantity, null, Boolean(deliveryRef.current));
    setSaved((current) => current.flatMap((line) => line.key !== key
      ? [line] : nextQuantity ? [{ ...line, quantity: nextQuantity }] : []));
  }, []);

  return {
    mode: 'sample',
    lines,
    cartCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal: {
      amount: lines.reduce((total, line) => total + line.unitPrice.amount * line.quantity, 0),
      currencyCode: 'AED',
    },
    busy: false,
    error: false,
    clearError: () => {},
    addItem,
    updateQuantity,
    removeItem: (key) => updateQuantity(key, 0),
    delivery,
    setDelivery,
    checkoutUrl: async () => null,
    shopifyCart: null,
  };
}

/** The live Shopify cart when the store is configured, otherwise the browser-only preview cart. */
export const useShopCart: (products: Product[], locale: Locale) => ShopCart =
  isShopifyConfigured ? useShopifyCart : usePreviewCart;
