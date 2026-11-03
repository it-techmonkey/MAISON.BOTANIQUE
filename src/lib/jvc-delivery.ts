// Free delivery to Jumeirah Village Circle (JVC), owner decision of 23 October 2026.
//
// There is no automatic address check on the Shopify Basic plan, so the rule is
// declared and then verified: the customer ticks "Delivering to JVC" in the bag,
// a free-delivery discount code (limited in Shopify to the AED 30 Dubai rate)
// is added to the cart, and the cart carries a "Delivery area" attribute that
// shows on the order. The team checks the full address before dispatch; if it
// is not in JVC the customer pays the AED 30.
//
// The tick-box stays hidden until NEXT_PUBLIC_JVC_FREE_DELIVERY=1 is set on the
// host, after the discount exists in Shopify and JVC_DELIVERY_CODE is set.

export const JVC_FREE_DELIVERY = process.env.NEXT_PUBLIC_JVC_FREE_DELIVERY === '1';

/** The cart attribute the shop team sees on the order. */
export const JVC_AREA_KEY = 'Delivery area';
export const JVC_AREA_VALUE = 'JVC - free delivery claimed, check the full address before dispatch';
