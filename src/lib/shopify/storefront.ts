import { SHOPIFY_API_VERSION, shopifyConfig } from './config';

/**
 * Browser requests go through the same-origin Storefront API proxy in
 * src/proxy.ts, so Shopify can set its analytics and checkout-continuity
 * cookies on this domain. Server requests call Shopify directly.
 */
const BROWSER_ENDPOINT = `/api/${SHOPIFY_API_VERSION}/graphql.json`;

export class StorefrontError extends Error {
  readonly kind: 'network' | 'graphql' | 'user';

  constructor(message: string, kind: 'network' | 'graphql' | 'user') {
    super(message);
    this.name = 'StorefrontError';
    this.kind = kind;
  }
}

interface StorefrontFetchOptions {
  /** Next.js data cache settings for server requests. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
  timeoutMs?: number;
}

/**
 * POST a GraphQL document to the Storefront API. Runs in the browser (cart,
 * through the same-origin proxy) and on the server (catalog). On the server, a private Storefront token is used
 * when SHOPIFY_STOREFRONT_PRIVATE_TOKEN is set, so catalog requests are not
 * rate-limited as if they all came from one shopper.
 */
export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { next, cache, timeoutMs = 12_000 }: StorefrontFetchOptions = {},
): Promise<T> {
  const privateToken = typeof window === 'undefined' ? process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim() : undefined;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (privateToken) headers['Shopify-Storefront-Private-Token'] = privateToken;
  else headers['X-Shopify-Storefront-Access-Token'] = shopifyConfig.publicToken;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(typeof window === 'undefined' ? shopifyConfig.endpoint : BROWSER_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      cache,
      ...(next ? { next } : {}),
    } as RequestInit);
  } catch (error) {
    throw new StorefrontError(error instanceof Error ? error.message : 'Network error', 'network');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new StorefrontError(`Storefront API responded ${response.status}`, 'network');
  }
  const payload = await response.json() as { data?: T; errors?: Array<{ message: string }> };
  if (payload.errors?.length) {
    throw new StorefrontError(payload.errors.map((error) => error.message).join('; '), 'graphql');
  }
  if (!payload.data) throw new StorefrontError('Storefront API returned no data', 'graphql');
  return payload.data;
}
