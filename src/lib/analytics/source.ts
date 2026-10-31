// Where a visitor came from (WhatsApp message, Meta ad, Instagram, Google…),
// kept in the browser and stamped on the Shopify cart as hidden attributes, so
// every order records its source. Shopify's own order source only sees the
// hosted checkout, never the storefront landing.
//
// Last non-direct touch within 30 days: a later WhatsApp link or ad click
// replaces an earlier one; typing the address or a saved link keeps it.

const STORAGE_KEY = 'mb-source-v1';
const MAX_AGE_MS = 30 * 86_400_000;
const OWN_HOSTS = /(^|\.)maisonbotaniqueflowers\.com$|\.myshopify\.com$/;

export interface VisitSource {
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  landing: string;
  at: string;
}

/** The source of this landing, or null for a direct or same-site visit. */
export function sourceFromLanding(url: string, referrer: string, now = new Date()): VisitSource | null {
  const page = new URL(url);
  const params = page.searchParams;
  const utm = (name: string) => params.get(`utm_${name}`)?.trim().slice(0, 100) || null;
  let referrerHost = '';
  try { referrerHost = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch { /* bad referrer */ }
  if (referrerHost === page.hostname.replace(/^www\./, '') || OWN_HOSTS.test(referrerHost)) referrerHost = '';
  // fbclid is on Meta ad clicks and on plain Facebook/Instagram link clicks alike.
  const source = utm('source') ?? (params.has('fbclid') ? 'meta' : null) ?? (referrerHost || null);
  if (!source) return null;
  return {
    source,
    medium: utm('medium') ?? (params.has('fbclid') && !utm('source') ? 'fbclid' : referrerHost && !utm('source') ? 'referral' : null),
    campaign: utm('campaign'),
    content: utm('content'),
    landing: page.pathname.slice(0, 200),
    at: now.toISOString(),
  };
}

/** Call once per page load: saves a new non-direct source. */
export function rememberVisitSource() {
  try {
    const next = sourceFromLanding(window.location.href, document.referrer);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* storage blocked */ }
}

export function savedVisitSource(now = Date.now()): VisitSource | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as VisitSource | null;
    return saved && now - Date.parse(saved.at) < MAX_AGE_MS ? saved : null;
  } catch { return null; }
}

/** Placeholder for an empty field, so a cart's older values are always overwritten. */
export const NO_VALUE = '-';
export const SOURCE_ATTRIBUTES = ['_source', '_source_medium', '_source_campaign', '_source_content', '_source_landing', '_source_at'] as const;

/** Hidden cart attributes (Shopify hides keys starting with `_` at checkout). `direct` when nothing is saved. */
export function sourceCartAttributes(saved = savedVisitSource()): Array<{ key: string; value: string }> {
  const values = saved
    ? [saved.source, saved.medium, saved.campaign, saved.content, saved.landing, saved.at]
    : ['direct'];
  return SOURCE_ATTRIBUTES.map((key, index) => ({ key, value: values[index] || NO_VALUE }));
}
