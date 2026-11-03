import assert from 'node:assert/strict';
import test from 'node:test';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
globalThis.window = { location: { href: '' } };
globalThis.document = { referrer: '' };

const { sourceFromLanding, rememberVisitSource, savedVisitSource, sourceCartAttributes } = await import('../src/lib/analytics/source.ts');

const site = 'https://www.maisonbotaniqueflowers.com';
const now = new Date('2026-10-29T10:00:00Z');
const visit = (href, referrer = '') => { window.location.href = href; document.referrer = referrer; rememberVisitSource(); };

test('the landing source comes from UTM tags, then a Meta click, then an outside referrer', () => {
  assert.deepEqual(
    sourceFromLanding(`${site}/shop/aimee-red-rose-bouquet?utm_source=whatsapp&utm_medium=outreach&utm_campaign=oct27_evening&utm_content=ob_en_red`, '', now),
    { source: 'whatsapp', medium: 'outreach', campaign: 'oct27_evening', content: 'ob_en_red', landing: '/shop/aimee-red-rose-bouquet', at: now.toISOString() },
  );
  assert.equal(sourceFromLanding(`${site}/?fbclid=x`, '', now).source, 'meta');
  assert.equal(sourceFromLanding(`${site}/?fbclid=x`, '', now).medium, 'fbclid');
  assert.deepEqual(
    [sourceFromLanding(`${site}/`, 'https://www.google.com/', now).source, sourceFromLanding(`${site}/`, 'https://www.google.com/', now).medium],
    ['google.com', 'referral'],
  );
  assert.equal(sourceFromLanding(`${site}/shop`, `${site}/`, now), null);
  assert.equal(sourceFromLanding(`${site}/`, 'https://shop.maisonbotaniqueflowers.com/checkouts/x', now), null);
  assert.equal(sourceFromLanding(`${site}/`, '', now), null);
  // Previews and local servers count their own pages as same-site too.
  assert.equal(sourceFromLanding('http://localhost:3344/', 'http://localhost:3344/shop', now), null);
});

test('a direct return keeps the last source, a new tagged visit replaces it, and the cart always gets every key', () => {
  assert.deepEqual(sourceCartAttributes(null).map(({ value }) => value), ['direct', '-', '-', '-', '-', '-']);

  visit(`${site}/shop/aimee-red-rose-bouquet?utm_source=whatsapp&utm_medium=outreach&utm_campaign=oct27_evening`);
  visit(`${site}/`);
  assert.equal(savedVisitSource().source, 'whatsapp');

  visit(`${site}/?fbclid=abc`);
  const attributes = Object.fromEntries(sourceCartAttributes().map(({ key, value }) => [key, value]));
  assert.equal(attributes._source, 'meta');
  // The earlier WhatsApp campaign must not survive on the cart.
  assert.equal(attributes._source_campaign, '-');
  assert.equal(attributes._source_landing, '/');

  assert.equal(savedVisitSource(Date.now() + 31 * 86_400_000), null);
});
