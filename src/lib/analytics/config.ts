// PostHog settings shared by the browser (instrumentation-client.ts), the
// reverse proxy (next.config.ts) and the Shopify order webhook.

/** Project API key (public by design). PostHog stays off until it is set. */
export const POSTHOG_KEY = (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '').trim();

/** The PostHog Cloud region of the project: `us` (default) or `eu`. */
export const POSTHOG_REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION?.trim().toLowerCase() === 'eu' ? 'eu' : 'us';

/**
 * Same-origin path that next.config.ts rewrites to PostHog. Ad blockers drop
 * requests to *.posthog.com and to well-known paths such as /ingest, which
 * would silently lose a large share of events.
 */
export const POSTHOG_RELAY_PATH = '/mb-relay';

export const POSTHOG_HOSTS = {
  ingest: `https://${POSTHOG_REGION}.i.posthog.com`,
  assets: `https://${POSTHOG_REGION}-assets.i.posthog.com`,
  ui: `https://${POSTHOG_REGION}.posthog.com`,
};

export const isPostHogEnabled = POSTHOG_KEY.length > 0;

/**
 * Hidden cart attributes (Shopify hides keys that start with `_` at checkout).
 * They carry the visitor's PostHog IDs to the paid-order webhook, so revenue
 * is attributed to the same person and session that browsed the site.
 */
export const CART_ATTRIBUTE_DISTINCT_ID = '_posthog_distinct_id';
export const CART_ATTRIBUTE_SESSION_ID = '_posthog_session_id';
