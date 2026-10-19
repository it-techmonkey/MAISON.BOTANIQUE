import { assertWelcomeEligible } from '@/lib/shopify/welcome-offer';
import { cookies } from 'next/headers';
import { OFFER_COOKIE, openOfferSession } from '@/lib/offer-session';
import { readEnquiryBody } from '@/lib/enquiry-limit';
import { OFFER_CODE } from '@/lib/site';
import { fetchCart, updateCartBuyerIdentity, updateCartDiscountCodes } from '@/lib/shopify/cart';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'forbidden' }, { status: 403 });
  let body: { cartId?: unknown; code?: unknown; locale?: unknown; enabled?: unknown };
  try { body = JSON.parse(await readEnquiryBody(request, 2000)); } catch {
    return Response.json({ error: 'invalid' }, { status: 400 });
  }
  // Shopify cart IDs (including their secret key) are opaque GraphQL values.
  if (typeof body.cartId !== 'string' || body.cartId.length > 500 || !/^gid:\/\/shopify\/Cart\/[^\s#]+$/.test(body.cartId)) {
    return Response.json({ error: 'invalid' }, { status: 422 });
  }
  const cookie = (await cookies()).get(OFFER_COOKIE)?.value;
  const session = cookie ? openOfferSession(cookie) : null;
  const code = session?.code || (body.code === OFFER_CODE ? OFFER_CODE : '');
  if (!code) return Response.json({ applied: false });
  const locale = body.locale === 'ar' ? 'ar' : 'en';
  try {
    let cart = await fetchCart(body.cartId, locale);
    if (!cart) return Response.json({ error: 'expired' }, { status: 422 });
    if (body.enabled === false) {
      cart = await updateCartDiscountCodes(body.cartId, cart.discountCodes.filter((item) => item.code.toUpperCase() !== code.toUpperCase()).map((item) => item.code), locale);
      return Response.json({ applied: false, cart }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (session?.customerId) await assertWelcomeEligible(session.customerId);
    if (session) cart = await updateCartBuyerIdentity(body.cartId, {
      ...(session.email ? { email: session.email } : {}), ...(session.phone ? { phone: session.phone } : {}),
    }, locale);
    const codes = [...new Set([...cart.discountCodes.map((item) => item.code), code])];
    cart = await updateCartDiscountCodes(body.cartId, codes, locale);
    const applied = cart.discountCodes.some((item) => item.code.toUpperCase() === code.toUpperCase() && item.applicable);
    if (!applied) return Response.json({ error: 'offer_unavailable' }, { status: 422 });
    return Response.json({ applied, cart }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'offer_unavailable' }, { status: 502 });
  }
}
