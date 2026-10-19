// Maison Botanique: Shopify checkout → PostHog (custom pixel)
//
// Install: Shopify admin → Settings → Customer events → Add custom pixel →
// "PostHog checkout", paste this file, set Permission to "Required: Analytics"
// (it sends no personal data) and Data sale to "Data collected does not
// qualify as data sale", then Save and Connect. See docs/SHOPIFY_SETUP.md.
//
// Shopify's hosted checkout runs outside the storefront, so the PostHog
// browser SDK can't see it. This pixel reports each checkout step for the
// same PostHog visitor and session, read from the hidden cart attributes the
// storefront sets (`_posthog_distinct_id`, `_posthog_session_id`), so funnels
// run from product view through to payment.
//
// - Revenue is NOT recorded here: the `orders/paid` webhook is the source of
//   truth. `Checkout Completed` has no `revenue` property, so totals never double.
// - No names, emails, phone numbers, addresses or field values are sent.

const POSTHOG_KEY = 'phc_REPLACE_WITH_PROJECT_KEY';
// After launch, prefer the storefront relay (not blocked by ad blockers):
// 'https://maisonbotaniqueflowers.com/mb-relay'
const POSTHOG_HOST = 'https://us.i.posthog.com';

const STEPS = {
  checkout_started: ['Checkout Step Viewed', 1, 'started'],
  checkout_contact_info_submitted: ['Checkout Step Completed', 2, 'contact'],
  checkout_address_info_submitted: ['Checkout Step Completed', 3, 'address'],
  checkout_shipping_info_submitted: ['Checkout Step Completed', 4, 'delivery'],
  payment_info_submitted: ['Checkout Step Completed', 5, 'payment'],
  checkout_completed: ['Checkout Completed', 6, 'completed'],
};

const amount = (money) => {
  const value = Number(money && money.amount);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
};

function identity(checkout, event) {
  const attributes = {};
  for (const attribute of (checkout && checkout.attributes) || []) attributes[attribute.key] = attribute.value;
  return {
    distinctId: attributes._posthog_distinct_id || `shopify_client:${event.clientId}`,
    sessionId: attributes._posthog_session_id || null,
    fromStorefront: Boolean(attributes._posthog_distinct_id),
  };
}

function checkoutProperties(checkout) {
  if (!checkout) return {};
  const lines = checkout.lineItems || [];
  const order = checkout.order || null;
  const transactions = checkout.transactions || [];
  return {
    checkout_token: checkout.token || null,
    value: amount(checkout.totalPrice),
    subtotal: amount(checkout.subtotalPrice),
    tax: amount(checkout.totalTax),
    shipping: amount(checkout.shippingLine && checkout.shippingLine.price),
    discount: amount(checkout.discountsAmount),
    coupon: (checkout.discountApplications || []).filter((discount) => discount.type === 'DISCOUNT_CODE').map((discount) => discount.title).join(',') || null,
    currency: checkout.currencyCode || null,
    item_count: lines.reduce((total, line) => total + (line.quantity || 0), 0),
    products: lines.map((line) => ({
      shopify_product_id: line.variant && line.variant.product ? line.variant.product.id : null,
      variant_id: line.variant ? line.variant.id : null,
      sku: line.variant ? line.variant.sku : null,
      name: line.title,
      variant: line.variant ? line.variant.title : null,
      price: line.variant ? amount(line.variant.price) : null,
      quantity: line.quantity,
    })),
    checkout_country: checkout.localization && checkout.localization.country ? checkout.localization.country.isoCode : null,
    checkout_language: checkout.localization && checkout.localization.language ? checkout.localization.language.isoCode : null,
    payment_methods: transactions.map((transaction) => (transaction.paymentMethod && transaction.paymentMethod.type) || transaction.gateway).filter(Boolean),
    order_id: order && order.id ? String(order.id).split('/').pop() : null,
    first_order: order && order.customer && typeof order.customer.isFirstOrder === 'boolean' ? order.customer.isFirstOrder : null,
  };
}

// Alerts and extension errors carry no checkout; they reuse the last one seen
// on this checkout so they join the same visitor.
let lastCheckout = null;

function send(eventName, event, checkout, extra) {
  if (checkout) lastCheckout = checkout;
  const { distinctId, sessionId, fromStorefront } = identity(checkout || lastCheckout, event);
  const location = (event.context && event.context.document && event.context.document.location) || {};
  const body = {
    api_key: POSTHOG_KEY,
    event: eventName,
    distinct_id: distinctId,
    timestamp: event.timestamp,
    properties: {
      ...checkoutProperties(checkout),
      ...extra,
      ...(sessionId ? { $session_id: sessionId } : {}),
      $current_url: location.href || null,
      $pathname: location.pathname || null,
      $lib: 'shopify-checkout-pixel',
      shopify_event_id: event.id,
      attributed_to_visitor: fromStorefront,
      storefront: 'maison-botanique',
      source: 'shopify_checkout',
      $process_person_profile: false,
    },
  };
  fetch(`${POSTHOG_HOST}/i/v0/e/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

function onStep(name) {
  const [eventName, step, stepName] = STEPS[name];
  return (event) => {
    const checkout = event.data && event.data.checkout;
    const extra = { checkout_step: step, checkout_step_name: stepName };
    if (name === 'checkout_shipping_info_submitted' && checkout && checkout.delivery) {
      const selected = (checkout.delivery.selectedDeliveryOptions || [])[0];
      if (selected) extra.delivery_option = selected.title || selected.type || null;
    }
    send(eventName, event, checkout, extra);
  };
}

// Shopify requires each subscribed event name as a literal string.
analytics.subscribe('checkout_started', onStep('checkout_started'));
analytics.subscribe('checkout_contact_info_submitted', onStep('checkout_contact_info_submitted'));
analytics.subscribe('checkout_address_info_submitted', onStep('checkout_address_info_submitted'));
analytics.subscribe('checkout_shipping_info_submitted', onStep('checkout_shipping_info_submitted'));
analytics.subscribe('payment_info_submitted', onStep('payment_info_submitted'));
analytics.subscribe('checkout_completed', onStep('checkout_completed'));

// Errors shown to the buyer (declined card, invalid field). Only the type,
// the field and Shopify's message are sent, never what was typed.
analytics.subscribe('alert_displayed', (event) => {
  const alert = (event.data && event.data.alert) || {};
  send('Checkout Alert Displayed', event, null, {
    alert_type: alert.type || null,
    alert_target: alert.target || null,
    alert_message: alert.message ? String(alert.message).slice(0, 200) : null,
  });
});

analytics.subscribe('ui_extension_errored', (event) => {
  const error = (event.data && event.data.error) || {};
  send('Checkout Extension Error', event, null, {
    extension_name: error.extensionName || null,
    extension_target: error.extensionTarget || null,
    error_type: error.type || null,
  });
});
