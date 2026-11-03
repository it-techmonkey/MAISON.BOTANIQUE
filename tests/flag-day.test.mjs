import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../src/data/seasonal-products.json', import.meta.url), 'utf8'));
const byId = new Map(data.products.map((product) => [product.id, product]));

test('both Alam flag boxes have records, Small AED 329 and Medium AED 429, delivered from 3 November (Flag Day)', () => {
  assert.equal(data.flagDay.length, 2);
  for (const id of data.flagDay) {
    const sizes = byId.get(id).sizes;
    assert.deepEqual(sizes.map((size) => [size.name, size.price]), [['Small', 329], ['Medium', 429]], id);
    assert.deepEqual(data.deliveryRanges[id], { from: '2026-11-03', to: '2026-12-02' }, id);
    for (const size of sizes) assert.equal(size.compareAtPrice, Math.round(size.price / 0.9), `${id} ${size.name}`);
  }
});

test('English and Arabic lines match, SKUs are unique, and the colour-spraying is disclosed', () => {
  const skus = new Set();
  for (const id of data.flagDay) {
    const product = byId.get(id);
    assert.equal(product.composition.length, product.compositionAr.length, id);
    assert.match(product.composition.join(' '), /colour-sprayed/, id);
    for (const size of product.sizes) { assert.ok(!skus.has(size.sku), size.sku); skus.add(size.sku); }
  }
});
