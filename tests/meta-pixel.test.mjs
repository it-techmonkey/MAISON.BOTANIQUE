import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789';
const scripts = [];
const storage = new Map();
globalThis.window = { location: { search: '?fbclid=AbC-123' } };
globalThis.document = {
  createElement: () => ({}),
  head: { appendChild: (script) => scripts.push(script) },
};
globalThis.sessionStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };

const { metaTrack, metaProduct, metaCheckout, setMetaConsent, rememberMetaClickId, withMetaClickId, metaContentId } = await import('../src/lib/analytics/meta-pixel.ts');

const product = { id: 'aimee', name: 'Aimée', currencyCode: 'AED', sizes: [] };
const grand = { name: 'Grand', price: 590, variantId: 'gid://shopify/ProductVariant/4455' };

test('Meta events wait for consent, then load the pixel once and send in order', () => {
  rememberMetaClickId();
  metaTrack('PageView');
  metaProduct('AddToCart', product, grand, 2);
  metaProduct('ViewContent', product, { price: 100, variantId: null }, 1);
  assert.equal(window.fbq, undefined);
  assert.equal(withMetaClickId('https://shop.maisonbotaniqueflowers.com/cart/c/1'), 'https://shop.maisonbotaniqueflowers.com/cart/c/1');

  setMetaConsent(true);
  metaCheckout([{ quantity: 2, size: grand }, { quantity: 1, size: null }], 1180, 'AED');

  assert.deepEqual(window.fbq.queue, [
    ['init', '123456789'],
    ['track', 'PageView'],
    ['track', 'AddToCart', { content_ids: ['4455'], content_type: 'product', content_name: 'Aimée', value: 1180, currency: 'AED' }],
    ['track', 'InitiateCheckout', { content_ids: ['4455'], content_type: 'product', num_items: 3, value: 1180, currency: 'AED' }],
  ]);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  assert.equal(withMetaClickId('https://shop.maisonbotaniqueflowers.com/cart/c/1?key=x'), 'https://shop.maisonbotaniqueflowers.com/cart/c/1?key=x&fbclid=AbC-123');
});

test('Meta events are dropped when marketing is not allowed', () => {
  const sent = window.fbq.queue.length;
  setMetaConsent(null);
  metaTrack('PageView');
  setMetaConsent(false);
  metaTrack('PageView');
  assert.equal(window.fbq.queue.length, sent);
  assert.equal(withMetaClickId('https://shop.maisonbotaniqueflowers.com/c'), 'https://shop.maisonbotaniqueflowers.com/c');
  assert.equal(metaContentId('gid://shopify/ProductVariant/42'), '42');
});
