// Pure helpers for per-line cart properties. No network, no React.
// Shopify's hosted checkout shows line properties but not cart attributes or
// the cart note, so the delivery slot is also written on every line.

import { deliverySummary, type DeliverySchedule } from '@/lib/delivery';

/** Visible line property carrying the delivery slot, e.g. "Wed 21 Oct · 3pm – 6pm". */
export const DELIVERY_LINE_KEY = 'Delivery';

export type LineAttribute = { key: string; value: string };

interface LineLike { id: string; variantId: string; quantity: number; attributes: Record<string, string> }

/** The delivery text for a schedule, always English (the shop team reads it). */
export const deliveryLineValue = (schedule: DeliverySchedule | null) => deliverySummary(schedule, false);

/** Adds, replaces or (without a schedule) leaves the Delivery property in a list. */
export function withDeliveryProperty(attributes: LineAttribute[], schedule: DeliverySchedule | null): LineAttribute[] {
  const value = deliveryLineValue(schedule);
  if (!value) return attributes;
  return [...attributes.filter((attribute) => attribute.key !== DELIVERY_LINE_KEY), { key: DELIVERY_LINE_KEY, value }];
}

const toList = (attributes: Record<string, string>): LineAttribute[] =>
  Object.entries(attributes).map(([key, value]) => ({ key, value }));

/** Lines whose Delivery property is missing or stale, with their full new attribute set. */
export function deliveryLineUpdates(lines: LineLike[], schedule: DeliverySchedule | null) {
  const value = deliveryLineValue(schedule);
  if (!value) return [];
  return lines
    .filter((line) => line.attributes[DELIVERY_LINE_KEY] !== value)
    .map((line) => ({ id: line.id, attributes: withDeliveryProperty(toList(line.attributes), schedule) }));
}

/** Attributes that were sent but did not come back on the line. */
export function missingAttributes(sent: LineAttribute[], actual: Record<string, string> | undefined): LineAttribute[] {
  return sent.filter(({ key, value }) => (actual?.[key] ?? '') !== value);
}

/**
 * The line an add just created or grew: a new line id for that variant, else
 * the same-variant line whose quantity rose. Null when neither can be found.
 */
export function findAddedLine<T extends LineLike>(before: T[], after: T[], variantId: string): T | null {
  const previous = new Map(before.map((line) => [line.id, line]));
  const sameVariant = after.filter((line) => line.variantId === variantId);
  return sameVariant.find((line) => !previous.has(line.id))
    ?? sameVariant.find((line) => line.quantity > (previous.get(line.id)?.quantity ?? 0))
    ?? null;
}

interface CartLike { id: string; lines: LineLike[] }

/** Re-applies missing properties once, then reports a cart error if they still are not saved. */
export async function ensureAddedLineAttributes<T extends CartLike>(
  next: T, before: T | null, variantId: string, sent: LineAttribute[],
  repair: (cartId: string, line: { id: string; attributes: LineAttribute[] }) => Promise<T>,
  commit: (cart: T) => void,
): Promise<T> {
  if (!sent.length) return next;
  const added = findAddedLine(before?.lines ?? [], next.lines, variantId);
  if (added && !missingAttributes(sent, added.attributes).length) return next;
  console.warn('[cart] line properties missing after add; re-applying');
  if (!added) throw new Error('Added cart line not found');
  const merged = [...toList(added.attributes).filter(({ key }) => !sent.some((item) => item.key === key)), ...sent];
  const repaired = await repair(next.id, { id: added.id, attributes: merged });
  commit(repaired);
  const again = findAddedLine(before?.lines ?? [], repaired.lines, variantId) ?? repaired.lines.find((line) => line.id === added.id);
  if (!again || missingAttributes(sent, again.attributes).length) throw new Error('Cart line properties were not saved');
  return repaired;
}
