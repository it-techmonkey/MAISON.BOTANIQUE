// Every product in the bundled catalogue (src/data/collection.json), and the
// delivery-fee wording shown across the site.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const { products } = JSON.parse(readFileSync(new URL('src/data/collection.json', root), 'utf8'));
const { discountPercent } = await import('../src/lib/discount.ts');

const ARABIC = /[؀-ۿ]/;
const TIERS = /\b(Signature|Grand|Luxe)\b/;

// Non-flower gifts that still carry Signature/Grand/Luxe sizes ("double/triple
// the quantity"). The owner rule is that only flowers scale; these are
// PENDING AN OWNER DECISION (fix the sizes, or tag the flowers they contain).
// Do not add to this list without the owner's approval; remove entries once fixed.
const PENDING_TIER_EXCEPTIONS = new Set([
  'patisserie-chocolate-bouquet-cake-and-teddy',
  'cocoa-chocolate-bouquet-with-small-teddy',
  'truffle-chocolate-bouquet-and-teddy',
  'gilded-box-of-6-ferrero-rocher',
  'hazel-ferrero-rocher-bouquet',
  'gala-box-of-24-ferrero-rocher',
  'bluebird-blue-flowers-teddy-and-ferrero-rocher', // has flowers, but none are tagged
  'honeybear-teddy-with-16-ferrero-rocher',
  'celebration-pink-teddy-cake-and-balloons',
  'frosting-pink-teddy-cake-and-chocolate',
  'larkspur-blue-delphinium-and-pistachio-chocolates', // delphinium is not a tagged flower family
  'tropique-tropical-fruit-basket',
]);

const problems = (check) => products.flatMap((product) => {
  const found = check(product);
  return found ? [`${product.name} (${product.id}): ${found}`] : [];
});
const none = (list, message) => assert.deepEqual(list, [], `${message}\n  ${list.join('\n  ')}`);

test('catalogue is present and handles are unique', () => {
  assert.ok(products.length > 0);
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  assert.equal(new Set(products.flatMap((p) => p.sizes.map((s) => s.sku))).size, products.flatMap((p) => p.sizes).length);
});

test('every product and size has a positive price; the card price is the lowest size', () => {
  none(problems((p) => (p.sizes.length ? '' : 'no sizes')), 'products without sizes');
  none(problems((p) => p.sizes.filter((s) => !(Number.isFinite(s.price) && s.price > 0)).map((s) => s.name).join(', ')), 'sizes without a valid price');
  none(problems((p) => (p.price === Math.min(...p.sizes.map((s) => s.price)) ? '' : `card price ${p.price}`)), 'card price is not the lowest size');
});

test('every struck price is above the selling price and shows an off tag', () => {
  none(problems((p) => p.sizes
    .filter((s) => s.compareAtPrice != null && !(s.compareAtPrice > s.price))
    .map((s) => `${s.name} ${s.price} vs struck ${s.compareAtPrice}`).join(', ')), 'struck price not above price');
  none(problems((p) => (p.compareAtPrice != null && !(p.compareAtPrice > p.price) ? `card ${p.price} vs ${p.compareAtPrice}` : '')), 'card struck price not above price');
  // SaleTag hides savings under 5%, which would leave a struck price with no tag.
  none(problems((p) => p.sizes
    .filter((s) => s.compareAtPrice != null && discountPercent(s.price, s.compareAtPrice) < 5)
    .map((s) => s.name).join(', ')), 'struck price too close to price for a tag');
});

test('every product has an image and a small image that exist in public/', () => {
  none(problems((p) => [p.image, p.imageSmall]
    .filter((path) => !path || !existsSync(new URL(`public${path}`, root))).join(', ')), 'missing image files');
});

test('every product has an Arabic name, and every size has an Arabic label', () => {
  none(problems((p) => (ARABIC.test(p.nameAr ?? '') ? '' : `nameAr "${p.nameAr}"`)), 'products without an Arabic name');
  none(problems((p) => p.sizes.filter((s) => !s.nameAr?.trim()).map((s) => s.name).join(', ')), 'sizes without an Arabic label');
});

test('only flowers have Signature/Grand/Luxe sizes (gifts, chocolates and teddies stay fixed)', () => {
  const scaled = (p) => p.sizes.length > 1 && p.sizes.some((s) => TIERS.test(s.name));
  none(problems((p) => (scaled(p) && !p.flowers.length && !PENDING_TIER_EXCEPTIONS.has(p.id) ? p.sizes.map((s) => s.name).join(' / ') : '')),
    'non-flower products with Signature/Grand/Luxe sizes (owner rule: only flowers scale)');
  const stale = [...PENDING_TIER_EXCEPTIONS].filter((id) => {
    const product = products.find((p) => p.id === id);
    return !product || !scaled(product) || product.flowers.length;
  });
  assert.deepEqual(stale, [], 'fixed or removed: take these off PENDING_TIER_EXCEPTIONS');
});

test('delivery fee wording matches the owner rule everywhere it appears (AED 30 Dubai, AED 50 elsewhere)', () => {
  // Fees are charged by Shopify shipping rates, not by site code. This guards the copy.
  const files = [
    'src/components/store/SiteFooter.tsx', 'src/components/store/Residences.tsx',
    'src/app/(store)/delivery/page.tsx', 'src/app/(store)/faq/page.tsx',
  ];
  for (const file of files) {
    const text = readFileSync(new URL(file, root), 'utf8');
    assert.match(text, /AED 30 in Dubai/, `${file}: English Dubai fee`);
    assert.match(text, /AED 50 elsewhere in the UAE/, `${file}: English UAE fee`);
    assert.match(text, /٣٠ درهماً في دبي/, `${file}: Arabic Dubai fee`);
    assert.match(text, /٥٠ درهماً في بقية الإمارات/, `${file}: Arabic UAE fee`);
  }
  // No page may promise another figure for delivery.
  const all = files.map((file) => readFileSync(new URL(file, root), 'utf8')).join('\n');
  const other = [...all.matchAll(/AED (\d+)[^.\n]{0,40}(?:delivery|Dubai|UAE)/gi)].map((m) => m[1]).filter((n) => !['30', '50'].includes(n));
  assert.deepEqual(other, []);
});
