import { parseEnquiry } from '@/lib/enquiry';
import { isShopifyFormsConfigured } from '@/lib/shopify/admin';
import { submitToShopify } from '@/lib/shopify/forms';

// Receives the newsletter, contact and enquiry forms and stores them in
// Shopify (see src/lib/shopify/forms.ts). Without SHOPIFY_FORMS_ADMIN_TOKEN the
// route answers 503 and the form offers a prefilled email instead, so nothing
// is silently lost.

const MAX_BODY_BYTES = 16_000;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return Response.json({ error: 'too_large' }, { status: 413 });

  let body: unknown;
  try { body = JSON.parse(raw); } catch {
    return Response.json({ error: 'invalid', field: 'body' }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field.
  if (body && typeof body === 'object' && (body as Record<string, unknown>).website) {
    return Response.json({ ok: true });
  }

  const parsed = parseEnquiry(body);
  if (!parsed.ok) return Response.json({ error: 'invalid', field: parsed.field }, { status: 422 });

  if (!isShopifyFormsConfigured) return Response.json({ error: 'not_configured' }, { status: 503 });

  try {
    await submitToShopify(parsed.value);
  } catch (error) {
    console.error('[enquiry]', error);
    return Response.json({ error: 'delivery_failed' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
