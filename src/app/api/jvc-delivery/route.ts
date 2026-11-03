import { readEnquiryBody } from '@/lib/enquiry-limit';
import { JVC_AREA_KEY, JVC_AREA_VALUE } from '@/lib/jvc-delivery';
import { fetchCart, updateCartAttributes, updateCartDiscountCodes } from '@/lib/shopify/cart';

/**
 * Adds or removes the JVC free-delivery code on a cart and records the claim on
 * the cart, so it shows on the order for the team to verify. The code lives in
 * the server-only JVC_DELIVERY_CODE variable; without it the route refuses.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'forbidden' }, { status: 403 });
  const code = (process.env.JVC_DELIVERY_CODE || '').trim();
  if (!code) return Response.json({ error: 'unavailable' }, { status: 503 });
  let body: { cartId?: unknown; enabled?: unknown; locale?: unknown };
  try { body = JSON.parse(await readEnquiryBody(request, 2000)); } catch {
    return Response.json({ error: 'invalid' }, { status: 400 });
  }
  if (typeof body.cartId !== 'string' || body.cartId.length > 500 || !/^gid:\/\/shopify\/Cart\/[^\s#]+$/.test(body.cartId)) {
    return Response.json({ error: 'invalid' }, { status: 422 });
  }
  const locale = body.locale === 'ar' ? 'ar' : 'en';
  const enabled = body.enabled !== false;
  try {
    let cart = await fetchCart(body.cartId, locale);
    if (!cart) return Response.json({ error: 'expired' }, { status: 422 });
    const others = cart.discountCodes.filter((item) => item.code.toUpperCase() !== code.toUpperCase()).map((item) => item.code);
    const attributes = Object.entries(cart.attributes).filter(([key]) => key !== JVC_AREA_KEY).map(([key, value]) => ({ key, value }));
    if (enabled) attributes.push({ key: JVC_AREA_KEY, value: JVC_AREA_VALUE });
    cart = await updateCartAttributes(body.cartId, attributes, locale);
    cart = await updateCartDiscountCodes(body.cartId, enabled ? [...others, code] : others, locale);
    // Shopify settles a free-delivery code at checkout, once the address is known, so the cart's
    // "applicable" flag is not trusted here. The test checkout in docs/SHOPIFY_SETUP.md section 18
    // proves the code works before the tick-box is switched on.
    return Response.json({ applied: enabled, cart }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'jvc_unavailable' }, { status: 502 });
  }
}
