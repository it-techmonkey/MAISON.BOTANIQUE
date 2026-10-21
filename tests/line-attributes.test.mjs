import test from 'node:test';
import assert from 'node:assert/strict';

const { DELIVERY_LINE_KEY, deliveryLineUpdates, deliveryLineValue, ensureAddedLineAttributes, findAddedLine, missingAttributes, withDeliveryProperty } =
  await import('../src/lib/cart/line-attributes.ts');

const schedule = { date: '2026-10-21', slotId: 'afternoon' };
const line = (id, variantId, quantity, attributes = {}) => ({ id, variantId, quantity, attributes });

test('delivery line value is the English summary', () => {
  assert.equal(deliveryLineValue(schedule), 'Wed 21 Oct · 3pm – 6pm');
  assert.equal(deliveryLineValue(null), '');
});

test('withDeliveryProperty adds, replaces, and leaves other properties alone', () => {
  const base = [{ key: 'Gift message', value: 'Hi' }, { key: DELIVERY_LINE_KEY, value: 'old' }];
  assert.deepEqual(withDeliveryProperty(base, schedule), [
    { key: 'Gift message', value: 'Hi' }, { key: DELIVERY_LINE_KEY, value: 'Wed 21 Oct · 3pm – 6pm' },
  ]);
  assert.deepEqual(withDeliveryProperty(base, null), base);
});

test('deliveryLineUpdates only touches stale lines and keeps their other properties', () => {
  const current = line('a', 'v1', 1, { 'Gift message': 'Hi', [DELIVERY_LINE_KEY]: 'Wed 21 Oct · 3pm – 6pm' });
  const stale = line('b', 'v2', 1, { 'Gift message': 'Yo', Anonymous: 'Yes' });
  const updates = deliveryLineUpdates([current, stale], schedule);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].id, 'b');
  assert.deepEqual(updates[0].attributes.map((item) => item.key), ['Gift message', 'Anonymous', DELIVERY_LINE_KEY]);
  assert.deepEqual(deliveryLineUpdates([stale], null), []);
});

test('missingAttributes reports absent or changed values', () => {
  const sent = [{ key: 'Gift message', value: 'Hi' }, { key: 'Card signed', value: 'Sam' }];
  assert.deepEqual(missingAttributes(sent, { 'Gift message': 'Hi', 'Card signed': 'Sam' }), []);
  assert.deepEqual(missingAttributes(sent, {}), sent);
  assert.deepEqual(missingAttributes(sent, undefined), sent);
  assert.deepEqual(missingAttributes(sent, { 'Gift message': 'Hi' }), [sent[1]]);
});

test('findAddedLine finds a new line, or the same-variant line that grew', () => {
  const before = [line('a', 'v1', 1)];
  assert.equal(findAddedLine(before, [...before, line('b', 'v1', 1)], 'v1').id, 'b');
  assert.equal(findAddedLine(before, [line('a', 'v1', 2)], 'v1').id, 'a');
  assert.equal(findAddedLine(before, before, 'v1'), null);
  assert.equal(findAddedLine([], [line('c', 'v9', 1)], 'v1'), null);
});

test('missing line properties are re-applied once without losing other properties', async () => {
  const sent = [{ key: 'Gift message', value: 'Hello' }, { key: DELIVERY_LINE_KEY, value: 'Wed 21 Oct · 3pm – 6pm' }];
  const original = { id: 'cart', lines: [line('new', 'variant', 1, { 'Card signed': 'Sam' })] };
  const calls = [];
  const repaired = await ensureAddedLineAttributes(original, null, 'variant', sent, async (cartId, update) => {
    calls.push({ cartId, update });
    return { id: cartId, lines: [line(update.id, 'variant', 1, Object.fromEntries(update.attributes.map(({ key, value }) => [key, value])))] };
  }, (cart) => calls.push({ committed: cart.id }));
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].update.attributes, [{ key: 'Card signed', value: 'Sam' }, ...sent]);
  assert.equal(repaired.lines[0].attributes['Gift message'], 'Hello');
});

test('a failed re-apply reports an error after one attempt', async () => {
  const original = { id: 'cart', lines: [line('new', 'variant', 1)] };
  let repairs = 0;
  await assert.rejects(ensureAddedLineAttributes(original, null, 'variant', [{ key: 'Gift message', value: 'Hello' }], async () => {
    repairs += 1;
    return original;
  }, () => {}), /Cart line properties were not saved/);
  assert.equal(repairs, 1);
});
