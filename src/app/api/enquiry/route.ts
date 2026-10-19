import { checkEnquiryLimit, readEnquiryBody } from '@/lib/enquiry-limit';
import { parseEnquiry } from '@/lib/enquiry';
import { isShopifyFormsConfigured } from '@/lib/shopify/admin';
import { cookies } from 'next/headers';
import { OFFER_COOKIE, sealOffer } from '@/lib/offer-session';
import { getWelcomeCode, WelcomeNotEligible } from '@/lib/shopify/welcome-offer';
import { upsertCustomer, submitToShopify } from '@/lib/shopify/forms';

// Receives the newsletter, contact and enquiry forms and stores them in
// Shopify (see src/lib/shopify/forms.ts). Without SHOPIFY_FORMS_ADMIN_TOKEN the
// route answers 503 and the form offers a prefilled email instead, so nothing
// is silently lost.


export async function POST(request: Request) {
  const retry = checkEnquiryLimit(request);
  if (retry) return Response.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(retry) } });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'forbidden' }, { status: 403 });
  let raw: string;
  try { raw = await readEnquiryBody(request); } catch {
    return Response.json({ error: 'too_large' }, { status: 413 });
  }

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
    if (parsed.value.kind === 'offer') {
      const customerId = await upsertCustomer(parsed.value);
      const code = await getWelcomeCode(customerId);
      const session = sealOffer({ customerId, code, email: parsed.value.email, phone: parsed.value.phone });
      if (session) (await cookies()).set(OFFER_COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 86400 });
      return Response.json({ ok: true, code, saved: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    await submitToShopify(parsed.value);
  } catch (error) {
    if (error instanceof WelcomeNotEligible) return Response.json({ error: 'offer_unavailable' }, { status: 422 });
    console.error('[enquiry] Submission failed');
    return Response.json({ error: 'delivery_failed' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
