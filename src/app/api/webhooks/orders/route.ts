import { PostHog } from 'posthog-node';
import { CART_ATTRIBUTE_DISTINCT_ID, CART_ATTRIBUTE_SESSION_ID, POSTHOG_HOSTS, POSTHOG_KEY } from '@/lib/analytics/config';
import { DELIVERY_DATE_KEY, DELIVERY_TIME_KEY } from '@/lib/delivery';
import { DELIVERY_DATE_ATTRIBUTE, GIFT_NOTE_ATTRIBUTE } from '@/lib/shopify/cart';
import { stableEventUuid, verifyShopifyWebhook } from '@/lib/shopify/webhook';
import { NO_VALUE, SOURCE_ATTRIBUTES } from '@/lib/analytics/source';

// Shopify webhook target for order and refund topics, which records the order
// lifecycle in PostHog from the server. Purchases happen on Shopify's hosted
// checkout, where the browser SDK can't see them, so this is the only accurate
// source of revenue: it is unaffected by ad blockers, closed tabs or a skipped
// thank-you page.
//
// | Topic            | Event           | Revenue                        |
// | orders/create    | Order Placed    | no (includes unpaid/COD)       |
// | orders/paid      | Order Completed | yes                            |
// | orders/fulfilled | Order Fulfilled | no                             |
// | orders/cancelled | Order Cancelled | no (the refund nets it out)    |
// | refunds/create   | Order Refunded  | negative                       |
//
// - The visitor's PostHog IDs come from the hidden cart attributes set by the
//   storefront, so the order joins the same visitor and session. The visit
//   source (WhatsApp, Meta, referrer) arrives the same way as `order_source*`.
// - Orders with a Shopify customer go to the person `shopify_customer:<id>`.
//   The storefront visitor and the order ID are merged into it, so a returning
//   customer's visits, orders and refunds form one profile across devices.
// - A stable event UUID per order/refund de-duplicates Shopify's retries.
// - Test orders get a "(Test)" suffix and never mix with real numbers.
// - No names, emails, phone numbers, addresses or gift notes are sent.

type Money = string | number | null | undefined;
interface OrderLine {
  product_id: number | null;
  variant_id: number | null;
  sku: string | null;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: Money;
  vendor?: string | null;
  properties?: Array<{ name: string; value: string }>;
}
interface OrderPayload {
  id: number;
  admin_graphql_api_id?: string;
  name?: string;
  currency?: string;
  total_price?: Money;
  subtotal_price?: Money;
  total_tax?: Money;
  total_discounts?: Money;
  total_shipping_price_set?: { shop_money?: { amount?: Money } };
  discount_codes?: Array<{ code: string }>;
  note_attributes?: Array<{ name: string; value: string }>;
  line_items?: OrderLine[];
  customer?: { id: number; tags?: string; orders_count?: number; total_spent?: Money } | null;
  customer_locale?: string | null;
  landing_site?: string | null;
  referring_site?: string | null;
  payment_gateway_names?: string[];
  shipping_lines?: Array<{ title?: string | null }>;
  financial_status?: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
  source_name?: string;
  test?: boolean;
}
interface RefundPayload {
  id: number;
  order_id: number;
  created_at?: string;
  transactions?: Array<{ kind: string; status: string; amount: Money; currency?: string }>;
  refund_line_items?: Array<{ quantity: number; subtotal?: Money; line_item?: { product_id: number | null; sku: string | null; title: string } }>;
}
interface CaptureEvent {
  distinctId: string;
  event: string;
  uuid: string;
  timestamp: Date;
  properties: Record<string, unknown>;
}

const DAY_MS = 86_400_000;
const toNumber = (value: Money) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
};
const orderKey = (orderId: number) => `shopify_order:${orderId}`;
const lineProperty = (line: OrderLine, name: string) => line.properties?.find((property) => property.name === name)?.value ?? '';

/** Where an order's events go: the customer's person, else the storefront visitor, else the order. */
function orderIdentity(order: OrderPayload) {
  const attributes = new Map((order.note_attributes ?? []).map((attribute) => [attribute.name, attribute.value]));
  const visitorId = attributes.get(CART_ATTRIBUTE_DISTINCT_ID) || null;
  const sessionId = attributes.get(CART_ATTRIBUTE_SESSION_ID) || null;
  // Test orders never create or merge people.
  const customer = !order.test && order.customer?.id ? `shopify_customer:${order.customer.id}` : null;
  return { visitorId, sessionId, customer, distinctId: customer ?? visitorId ?? orderKey(order.id) };
}

/** Facts shared by every order event (no personal details). */
function orderProperties(order: OrderPayload) {
  const { visitorId, sessionId, customer } = orderIdentity(order);
  const lines = order.line_items ?? [];
  const attributes = new Map((order.note_attributes ?? []).map((attribute) => [attribute.name, attribute.value]));
  const placedAt = Date.parse(order.processed_at ?? order.created_at ?? '');
  // The order-level schedule; older carts kept a preferred date on each line.
  const deliveryDate = attributes.get(DELIVERY_DATE_KEY)
    || lines.map((line) => lineProperty(line, DELIVERY_DATE_ATTRIBUTE)).filter(Boolean).sort()[0]
    || null;
  // Calendar days in Dubai (UTC+4) between ordering and delivery.
  const placedDay = Number.isFinite(placedAt) ? new Date(placedAt + 4 * 3_600_000).toISOString().slice(0, 10) : null;
  const leadDays = deliveryDate && placedDay ? Math.round((Date.parse(deliveryDate) - Date.parse(placedDay)) / DAY_MS) : null;
  return {
    order_id: String(order.id),
    order_gid: order.admin_graphql_api_id ?? null,
    order_name: order.name ?? null,
    value: toNumber(order.total_price),
    subtotal: toNumber(order.subtotal_price),
    tax: toNumber(order.total_tax),
    shipping: toNumber(order.total_shipping_price_set?.shop_money?.amount),
    discount: toNumber(order.total_discounts),
    coupon: (order.discount_codes ?? []).map((discount) => discount.code).join(',') || null,
    currency: order.currency ?? 'AED',
    item_count: lines.reduce((total, line) => total + line.quantity, 0),
    products: lines.map((line) => ({
      shopify_product_id: line.product_id ? `gid://shopify/Product/${line.product_id}` : null,
      variant_id: line.variant_id ? `gid://shopify/ProductVariant/${line.variant_id}` : null,
      sku: line.sku,
      name: line.title,
      variant: line.variant_title,
      brand: line.vendor ?? null,
      price: toNumber(line.price),
      quantity: line.quantity,
      has_gift_note: Boolean(lineProperty(line, GIFT_NOTE_ATTRIBUTE)),
      has_delivery_date: Boolean(lineProperty(line, DELIVERY_DATE_ATTRIBUTE)),
    })),
    has_gift_note: lines.some((line) => Boolean(lineProperty(line, GIFT_NOTE_ATTRIBUTE))),
    has_delivery_date: Boolean(deliveryDate),
    delivery_time: attributes.get(DELIVERY_TIME_KEY) ?? null,
    // Days between ordering and delivery (0 = same day), Dubai calendar days.
    delivery_lead_days: Number.isFinite(leadDays) ? leadDays : null,
    same_day_delivery: leadDays === 0,
    payment_gateways: order.payment_gateway_names ?? [],
    shipping_method: order.shipping_lines?.[0]?.title ?? null,
    financial_status: order.financial_status ?? null,
    order_locale: order.customer_locale ?? null,
    // Where the visitor came from, stamped on the cart by the storefront.
    ...Object.fromEntries(SOURCE_ATTRIBUTES.map((key) => {
      const value = attributes.get(key);
      return [`order${key}`, value && value !== NO_VALUE ? value : null];
    })),
    landing_site: order.landing_site ?? null,
    referring_site: order.referring_site ?? null,
    order_source: order.source_name ?? null,
    returning_customer: typeof order.customer?.orders_count === 'number' ? order.customer.orders_count > 1 : null,
    attributed_to_visitor: Boolean(visitorId),
    ...(sessionId ? { $session_id: sessionId } : {}),
    source: 'shopify_webhook',
    // Only customers get person profiles; guest orders stay anonymous.
    $process_person_profile: Boolean(customer),
  };
}

/** Merges the storefront visitor and the order ID into the customer's person. */
function identityEvents(order: OrderPayload): CaptureEvent[] {
  const { visitorId, customer } = orderIdentity(order);
  if (!customer || !order.customer) return [];
  const timestamp = new Date(order.processed_at ?? order.created_at ?? Date.now());
  const value = toNumber(order.total_price);
  return [
    {
      distinctId: customer,
      event: '$identify',
      uuid: stableEventUuid(`identify:${order.id}`),
      timestamp,
      properties: {
        // The same merge identify() performs in the browser.
        ...(visitorId ? { $anon_distinct_id: visitorId } : {}),
        $set: {
          shopify_customer_id: String(order.customer.id),
          last_order_at: timestamp.toISOString(),
          last_order_value: value,
          last_order_currency: order.currency ?? 'AED',
          ...(order.customer_locale ? { order_locale: order.customer_locale } : {}),
          ...(order.customer.tags !== undefined ? { shopify_customer_tags: order.customer.tags } : {}),
          ...(typeof order.customer.orders_count === 'number' ? { shopify_orders_count: order.customer.orders_count } : {}),
          ...(order.customer.total_spent !== undefined ? { shopify_total_spent: toNumber(order.customer.total_spent) } : {}),
        },
        $set_once: { first_order_at: timestamp.toISOString(), first_order_value: value, first_order_id: String(order.id) },
        source: 'shopify_webhook',
      },
    },
    {
      // Refund webhooks carry only the order ID; this joins them to the customer.
      distinctId: customer,
      event: '$create_alias',
      uuid: stableEventUuid(`alias:${order.id}`),
      timestamp,
      properties: { alias: orderKey(order.id), source: 'shopify_webhook' },
    },
  ];
}

function orderEvent(order: OrderPayload, event: string, key: string, at: string | null | undefined, extra: Record<string, unknown> = {}): CaptureEvent {
  return {
    distinctId: orderIdentity(order).distinctId,
    event: order.test ? `${event} (Test)` : event,
    uuid: stableEventUuid(`${key}:${order.id}`),
    timestamp: new Date(at ?? order.updated_at ?? order.created_at ?? Date.now()),
    properties: { ...orderProperties(order), ...extra },
  };
}

function orderEvents(topic: string, order: OrderPayload): CaptureEvent[] | null {
  const placedAt = order.processed_at ?? order.created_at;
  switch (topic) {
    case 'orders/create':
      return [...identityEvents(order), orderEvent(order, 'Order Placed', 'order-created', placedAt)];
    case 'orders/paid':
      return [...identityEvents(order), orderEvent(order, 'Order Completed', 'order-paid', placedAt, { revenue: toNumber(order.total_price) })];
    case 'orders/fulfilled': {
      const hours = placedAt ? Math.round(((Date.now() - Date.parse(placedAt)) / 3_600_000) * 10) / 10 : null;
      return [orderEvent(order, 'Order Fulfilled', 'order-fulfilled', order.updated_at, { hours_to_fulfil: hours })];
    }
    case 'orders/cancelled':
      return [orderEvent(order, 'Order Cancelled', 'order-cancelled', order.cancelled_at, { cancel_reason: order.cancel_reason ?? null })];
    default:
      return null;
  }
}

function refundEvent(refund: RefundPayload): CaptureEvent {
  const amount = (refund.transactions ?? [])
    .filter((transaction) => transaction.kind === 'refund' && transaction.status === 'success')
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  return {
    // Aliased to the customer when the order was placed or paid.
    distinctId: orderKey(refund.order_id),
    event: 'Order Refunded',
    uuid: stableEventUuid(`refund:${refund.id}`),
    timestamp: new Date(refund.created_at ?? Date.now()),
    properties: {
      order_id: String(refund.order_id),
      refund_id: String(refund.id),
      refund_amount: Math.round(amount * 100) / 100,
      // Negative revenue so revenue totals net out refunds.
      revenue: -Math.round(amount * 100) / 100,
      currency: refund.transactions?.find((transaction) => transaction.currency)?.currency ?? 'AED',
      products: (refund.refund_line_items ?? []).map((line) => ({
        shopify_product_id: line.line_item?.product_id ? `gid://shopify/Product/${line.line_item.product_id}` : null,
        sku: line.line_item?.sku ?? null,
        name: line.line_item?.title ?? null,
        quantity: line.quantity,
      })),
      source: 'shopify_webhook',
      $process_person_profile: false,
    },
  };
}

export async function POST(request: Request) {
  const check = await verifyShopifyWebhook(request);
  if (!check.ok) return check.response;

  // Acknowledge, so Shopify doesn't retry an event that can't be recorded yet.
  if (!POSTHOG_KEY) return Response.json({ skipped: 'NEXT_PUBLIC_POSTHOG_KEY is not set' });

  let events: CaptureEvent[] | null;
  try {
    const payload = JSON.parse(check.body);
    events = check.topic === 'refunds/create'
      ? [refundEvent(payload as RefundPayload)]
      : orderEvents(check.topic, payload as OrderPayload);
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }
  if (!events) return Response.json({ skipped: `topic ${check.topic} is not tracked` });

  const posthog = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOSTS.ingest, flushAt: 1, flushInterval: 0 });
  try {
    // Identity first, so the order event lands on the merged person. The
    // server's location is not the customer's, so GeoIP is off.
    for (const event of events) await posthog.captureImmediate({ ...event, disableGeoip: true });
  } catch (error) {
    console.error('[orders-webhook] PostHog capture failed', error);
    // A non-2xx response makes Shopify retry; the stable UUIDs prevent doubles.
    return Response.json({ error: 'capture_failed' }, { status: 502 });
  } finally {
    await posthog.shutdown();
  }
  return Response.json({ captured: events.map((event) => event.event) });
}
