// Meta Pixel for the storefront. Purchase is not sent from here: Shopify's
// Facebook & Instagram channel reports it from checkout, and sending both
// would count every order twice.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';
const FBCLID_KEY = 'mb_fbclid';
const MAX_PENDING = 20;

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: (...args: unknown[]) => void;
};
type MetaWindow = Window & { fbq?: Fbq; _fbq?: Fbq };
type Params = Record<string, unknown>;

/** null until Shopify's Customer Privacy API has answered for this visitor. */
let allowed: boolean | null = null;
let initialized = false;
let pending: Array<[string, Params | undefined]> = [];

function send(event: string, params?: Params) {
  const browser = window as MetaWindow;
  if (!initialized) {
    if (!browser.fbq) {
      const fbq = ((...args: unknown[]) => fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)) as Fbq;
      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.push = fbq;
      browser.fbq = browser._fbq = fbq;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    browser.fbq!('init', PIXEL_ID);
    initialized = true;
  }
  if (params) browser.fbq!('track', event, params);
  else browser.fbq!('track', event);
}

/** Events wait for consent; they are sent if marketing is allowed and dropped if not. */
export function metaTrack(event: string, params?: Params) {
  if (!PIXEL_ID || typeof window === 'undefined') return;
  if (allowed) send(event, params);
  else if (allowed === null && pending.length < MAX_PENDING) pending.push([event, params]);
}

/** Called whenever Shopify's consent state changes. */
export function setMetaConsent(next: boolean | null) {
  allowed = next;
  if (next) pending.forEach(([event, params]) => send(event, params));
  if (next !== null) pending = [];
}

/**
 * Keeps the ad's click ID from the landing URL for this visit. The pixel only
 * reads it on the page where it starts, which may be later than landing if
 * consent arrives after a client-side navigation.
 */
export function rememberMetaClickId() {
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid) sessionStorage.setItem(FBCLID_KEY, fbclid);
  } catch { /* storage blocked */ }
}

/** Adds the ad click ID to the Shopify checkout URL so its Purchase links back to the ad. */
export function withMetaClickId(url: string) {
  if (!PIXEL_ID || !allowed) return url;
  let fbclid: string | null = null;
  try { fbclid = sessionStorage.getItem(FBCLID_KEY); } catch { /* storage blocked */ }
  if (!fbclid) return url;
  const next = new URL(url);
  next.searchParams.set('fbclid', fbclid);
  return next.toString();
}

/** Shopify variant GID → the numeric ID Shopify's Meta catalogue uses. */
export function metaContentId(variantId: string) {
  return variantId.split('/').pop() ?? variantId;
}

/** ViewContent or AddToCart for the chosen size. Sample products have no variant ID and are skipped. */
export function metaProduct(event: 'ViewContent' | 'AddToCart', product: { name: string; currencyCode: string }, size: { price: number; variantId: string | null }, quantity: number) {
  if (!size.variantId) return;
  metaTrack(event, {
    content_ids: [metaContentId(size.variantId)],
    content_type: 'product',
    content_name: product.name,
    value: size.price * quantity,
    currency: product.currencyCode,
  });
}

export function metaCheckout(lines: Array<{ quantity: number; size: { variantId: string | null } | null }>, subtotal: number, currency: string) {
  metaTrack('InitiateCheckout', {
    content_ids: lines.flatMap((line) => line.size?.variantId ? [metaContentId(line.size.variantId)] : []),
    content_type: 'product',
    num_items: lines.reduce((total, line) => total + line.quantity, 0),
    value: subtotal,
    currency,
  });
}
