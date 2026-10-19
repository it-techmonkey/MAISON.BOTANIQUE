import crypto from 'node:crypto';

// Shared by the Shopify webhook routes. Webhooks created under Settings >
// Notifications > Webhooks are all signed with the same secret.

export type WebhookCheck = { ok: true; body: string; topic: string } | { ok: false; response: Response };

/** Reads the raw body and verifies Shopify's HMAC signature before anything is parsed. */
export async function verifyShopifyWebhook(request: Request): Promise<WebhookCheck> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, response: Response.json({ error: 'SHOPIFY_WEBHOOK_SECRET is not configured' }, { status: 503 }) };
  }
  const body = await request.text();
  const header = request.headers.get('x-shopify-hmac-sha256');
  const digest = crypto.createHmac('sha256', secret).update(body, 'utf8').digest();
  const received = Buffer.from(header ?? '', 'base64');
  if (!header || received.length !== digest.length || !crypto.timingSafeEqual(received, digest)) {
    return { ok: false, response: Response.json({ error: 'Invalid signature' }, { status: 401 }) };
  }
  return { ok: true, body, topic: request.headers.get('x-shopify-topic') ?? '' };
}

/**
 * A stable UUID for a webhook-derived event, so Shopify's retries (and
 * duplicate deliveries) are de-duplicated by PostHog instead of double counting.
 */
export function stableEventUuid(key: string) {
  const hex = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}
