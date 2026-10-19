'use client';

// Browser side of customer accounts. Tokens never reach the browser: the
// session lives in an encrypted HttpOnly cookie handled by src/proxy.ts. The
// browser only learns whether someone is signed in.

const CART_COOKIE = 'cart';
const CART_GID_PREFIX = 'gid://shopify/Cart/';
const CART_COOKIE_MAX_AGE = 14 * 24 * 60 * 60;

export const ACCOUNT_STATUS_PATH = '/api/account/status';
export const ACCOUNT_CART_PATH = '/api/account/cart';

export interface AccountStatus {
  enabled: boolean;
  loggedIn: boolean;
}

let statusRequest: Promise<AccountStatus> | null = null;

/** Whether customer accounts are configured and the visitor is signed in. One request per page load. */
export function getAccountStatus(): Promise<AccountStatus> {
  statusRequest ??= fetch(ACCOUNT_STATUS_PATH, { cache: 'no-store', credentials: 'same-origin' })
    .then((response) => (response.ok ? response.json() : { enabled: false, loggedIn: false }))
    .catch(() => ({ enabled: false, loggedIn: false }));
  return statusRequest;
}

/**
 * Mirrors the cart ID into Hydrogen's `cart` cookie, so signing in and out on
 * the server attaches the customer to this cart (and detaches them again).
 */
export function writeCartCookie(cartId: string | null) {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  if (!cartId) {
    document.cookie = `${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return;
  }
  const token = cartId.startsWith(CART_GID_PREFIX) ? cartId.slice(CART_GID_PREFIX.length) : cartId;
  document.cookie = `${CART_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${CART_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

const ATTACHED_KEY = 'maison-botanique-cart-attached';

/**
 * Attaches the signed-in customer to the cart in the `cart` cookie, once per
 * cart per browser session (so signing in on another page also counts). Best effort.
 */
export async function attachCartToCustomer(cartId: string) {
  const status = await getAccountStatus();
  if (!status.loggedIn) return false;
  try { if (sessionStorage.getItem(ATTACHED_KEY) === cartId) return true; } catch { /* Storage blocked. */ }
  try {
    const response = await fetch(ACCOUNT_CART_PATH, { method: 'POST', credentials: 'same-origin' });
    const attached = response.ok && (await response.json()).attached === true;
    if (attached) {
      try { sessionStorage.setItem(ATTACHED_KEY, cartId); } catch { /* Storage blocked. */ }
    }
    return attached;
  } catch {
    return false;
  }
}

/** Forgets the attach marker; the cart itself is forgotten by the cart hook on sign-out. */
export function clearAttachedCart() {
  try { sessionStorage.removeItem(ATTACHED_KEY); } catch { /* Storage blocked. */ }
}
