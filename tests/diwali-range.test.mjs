import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../src/data/seasonal-products.json', import.meta.url), 'utf8'));
const byId = new Map(data.products.map((product) => [product.id, product]));
const added = data.diwali.filter((id) => id !== 'marigold-toran');

test('every Diwali handle has a record and a delivery window of 5 to 15 November', () => {
  assert.equal(added.length, 11);
  for (const id of added) {
    assert.ok(byId.has(id), id);
    assert.deepEqual(data.deliveryRanges[id], { from: '2026-11-05', to: '2026-11-15' }, id);
  }
});

test('struck prices are price / 0.9 rounded, so the calculated tag reads 10% off', () => {
  for (const id of added) for (const size of byId.get(id).sizes) assert.equal(size.compareAtPrice, Math.round(size.price / 0.9), `${id} ${size.name}`);
});

test('English and Arabic lines match in count, and no Hindi script or product counts appear', () => {
  for (const id of added) {
    const product = byId.get(id);
    assert.equal(product.composition.length, product.compositionAr.length, id);
    assert.equal(product.sizes.length, new Set(product.sizes.map((size) => size.sku)).size, id);
    assert.doesNotMatch(JSON.stringify(product), /[ऀ-ॿ]/, id);
  }
});

test('every size says how big it is, in English and Arabic (customers ask "how many feet?")', () => {
  for (const id of added) for (const size of byId.get(id).sizes) {
    assert.match(size.detail, /\b(ft|in|cm|stems)\b/, `${id} ${size.name}`);
    assert.ok(size.detailAr.trim().length > 3, `${id} ${size.name} Arabic`);
  }
  assert.equal(byId.get('thoranam-door-arch').sizes.length, 1, 'Door Arch has no Grand');
  for (const id of ['flower-rangoli-tray', 'marigold-petal-rangoli-tray']) assert.equal(byId.get(id).sizes.length, 1, `${id} is one 35 cm plate`);
});

test('the Marigold Toran climbs in whole feet from 2 to 8 and never gets cheaper as it gets longer', () => {
  const sizes = byId.get('marigold-toran').sizes;
  assert.deepEqual(sizes.map((size) => size.name), ['2 ft', '3 ft', '4 ft', '5 ft', '6 ft', '7 ft', '8 ft']);
  assert.deepEqual([99, 175, 250], [sizes[0].price, sizes[2].price, sizes[4].price], 'the three original prices are unchanged');
  sizes.slice(1).forEach((size, index) => assert.ok(size.price > sizes[index].price, size.name));
  assert.equal(new Set(sizes.map((size) => size.sku)).size, sizes.length, 'SKUs are unique');
});
