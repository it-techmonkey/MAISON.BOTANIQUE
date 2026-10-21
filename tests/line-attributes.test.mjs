import test from 'node:test';
import assert from 'node:assert/strict';

const { DELIVERY_LINE_KEY, deliveryLineUpdates, deliveryLineValue, findAddedLine, missingAttributes, withDeliveryProperty } =
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
