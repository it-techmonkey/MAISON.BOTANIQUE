// Server-only Admin API client for the website forms. It uses a dedicated
// forms token whose app has only customer and metaobject scopes, so the host
// never holds credentials that can change products or prices. Never import
// this file from a client component.

import { SHOPIFY_API_VERSION, isShopifyConfigured, shopifyConfig } from './config';

const formsToken = (process.env.SHOPIFY_FORMS_ADMIN_TOKEN ?? '').trim();

/** True when the forms can write to Shopify. */
export const isShopifyFormsConfigured = isShopifyConfigured && Boolean(formsToken);

export class AdminApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export async function adminFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!isShopifyFormsConfigured) throw new AdminApiError('SHOPIFY_FORMS_ADMIN_TOKEN is not configured.');
  const response = await fetch(`https://${shopifyConfig.domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': formsToken },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new AdminApiError(`Admin API responded ${response.status}`);
  const payload = await response.json() as { data?: T; errors?: Array<{ message: string }> };
  if (payload.errors?.length) throw new AdminApiError(payload.errors.map((error) => error.message).join('; '));
  if (!payload.data) throw new AdminApiError('Admin API returned no data');
  return payload.data;
}

/** Throws when a mutation reports user errors. */
export function assertNoUserErrors(errors: Array<{ field?: string[] | null; message: string }> | undefined, action: string) {
  if (errors?.length) {
    throw new AdminApiError(`${action}: ${errors.map((error) => `${error.field?.join('.') ?? ''} ${error.message}`.trim()).join('; ')}`);
  }
}
