// Customer account session for the proxy: Hydrogen's customer session stores
// its tokens through this session manager, which keeps them in an encrypted,
// HttpOnly cookie (AES-GCM, key from CUSTOMER_ACCOUNT_SESSION_SECRET). Tokens
// never reach the browser's JavaScript. Server only.

import { createCustomerSession } from '@shopify/hydrogen/customer-account';
import { shopifyConfig } from '@/lib/shopify/config';

const COOKIE = 'mb_account';
/** Browsers cap a cookie at about 4 KB; longer sessions are split across numbered cookies. */
const CHUNK_SIZE = 3600;
const MAX_CHUNKS = 4;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const clientId = (process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ?? '').trim();
const secret = (process.env.CUSTOMER_ACCOUNT_SESSION_SECRET ?? '').trim();

export const customerAccountConfigError = (() => {
  if (!clientId && !secret) return null;
  if (!clientId) return 'SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID is missing.';
  if (secret.length < 32) return 'CUSTOMER_ACCOUNT_SESSION_SECRET must be at least 32 characters.';
  if (!/^\d+$/.test(shopifyConfig.shopId)) return 'NEXT_PUBLIC_SHOPIFY_SHOP_ID must be the numeric shop ID.';
  return null;
})();

export const isCustomerAccountsConfigured = Boolean(clientId && secret) && !customerAccountConfigError;

export const customerSession = isCustomerAccountsConfigured
  ? createCustomerSession({ shopId: shopifyConfig.shopId, customerAccountApiClientId: clientId })
  : null;

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------

let keyPromise: Promise<CryptoKey> | null = null;
function key() {
  keyPromise ??= crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
    .then((digest) => crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']));
  return keyPromise;
}

const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

async function seal(data: Record<string, unknown>) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), new TextEncoder().encode(JSON.stringify(data))));
  const sealed = new Uint8Array(iv.length + cipher.length);
  sealed.set(iv);
  sealed.set(cipher, iv.length);
  return toBase64Url(sealed);
}

async function unseal(value: string): Promise<Record<string, unknown>> {
  try {
    const bytes = fromBase64Url(value);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await key(), bytes.slice(12));
    const data = JSON.parse(new TextDecoder().decode(plain));
    return data && typeof data === 'object' ? data : {};
  } catch {
    // Tampered, truncated or encrypted with an old secret: start a new session.
    return {};
  }
}

// ---------------------------------------------------------------------------
// Session manager
// ---------------------------------------------------------------------------

function readCookies(header: string | null) {
  const cookies = new Map<string, string>();
  for (const part of (header ?? '').split(/;\s*/)) {
    const index = part.indexOf('=');
    if (index > 0) cookies.set(part.slice(0, index), part.slice(index + 1));
  }
  return cookies;
}

/**
 * A request-scoped session manager for Hydrogen's customer session. Reads
 * are lazy; `commit()` returns the Set-Cookie headers when anything changed.
 */
export function createAccountSessionManager(request: Request, origin: string) {
  const cookies = readCookies(request.headers.get('cookie'));
  const existingChunks = [...Array(MAX_CHUNKS).keys()].filter((index) => cookies.has(`${COOKIE}.${index}`));
  let data: Promise<Record<string, unknown>> | null = null;
  let dirty = false;
  const load = () => {
    data ??= existingChunks.length
      ? unseal(existingChunks.map((index) => cookies.get(`${COOKIE}.${index}`) ?? '').join(''))
      : Promise.resolve({});
    return data;
  };
  const secure = origin.startsWith('https:') ? '; Secure' : '';
  const attributes = `Path=/; HttpOnly; SameSite=Lax${secure}`;

  return {
    getSessionOrigin: () => origin,
    getSessionItem: async (name: string) => (await load())[name],
    setSessionItem: async (name: string, value: unknown) => { (await load())[name] = value; dirty = true; },
    removeSessionItem: async (name: string) => { delete (await load())[name]; dirty = true; },
    commit: async (): Promise<HeadersInit | void> => {
      if (!dirty) return;
      const values = await load();
      const headers = new Headers();
      const empty = Object.keys(values).length === 0;
      const sealed = empty ? '' : await seal(values);
      const chunks = sealed.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [];
      if (chunks.length > MAX_CHUNKS) throw new Error('Customer account session is too large for cookies');
      chunks.forEach((chunk, index) => headers.append('Set-Cookie', `${COOKIE}.${index}=${chunk}; ${attributes}; Max-Age=${MAX_AGE_SECONDS}`));
      for (const index of existingChunks.filter((item) => item >= chunks.length)) {
        headers.append('Set-Cookie', `${COOKIE}.${index}=; ${attributes}; Max-Age=0`);
      }
      return headers;
    },
  };
}
