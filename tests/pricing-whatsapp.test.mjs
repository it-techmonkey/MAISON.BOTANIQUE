// The "% off" tag beside struck prices (src/lib/discount.ts) and the WhatsApp
// enquiry text (src/lib/whatsapp.ts).
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+971 50 000 0000';
process.env.NEXT_PUBLIC_SITE_URL = 'https://maisonbotaniqueflowers.com/';
const { discountPercent, percentLabel } = await import('../src/lib/discount.ts');
const { whatsappLink, whatsappMessage, whatsappNumber, isWhatsappOpen } = await import('../src/lib/whatsapp.ts');

test('the off tag is worked out from the two prices and rounded to a whole percent', () => {
  assert.equal(discountPercent(90, 100), 10);
  assert.equal(discountPercent(235, 560), 58);
  assert.equal(discountPercent(470, 1119), 58);
  assert.equal(discountPercent(99.5, 110), 10); // 9.55% rounds to 10
  assert.equal(discountPercent(100.6, 110), 9); // 8.55% rounds to 9
});

test('no tag without a higher struck price', () => {
  assert.equal(discountPercent(100, null), 0);
  assert.equal(discountPercent(100, undefined), 0);
  assert.equal(discountPercent(100, 100), 0);
  assert.equal(discountPercent(100, 90), 0);
  assert.equal(discountPercent(0, 100), 0);
});

test('percent labels in English and Arabic digits', () => {
  assert.equal(percentLabel(10, false), '10%');
  assert.equal(percentLabel(10, true), '١٠٪');
  assert.equal(percentLabel(58, true), '٥٨٪');
});

test('the WhatsApp number is normalised to 971 digits', () => {
  assert.equal(whatsappNumber(), '971500000000');
  assert.match(whatsappLink('Hi'), /^https:\/\/wa\.me\/971500000000\?text=Hi$/);
  assert.equal(whatsappLink(''), 'https://wa.me/971500000000');
});

test('product enquiry names the product, size, price, delivery and link', () => {
  const enquiry = {
    name: 'Eloise — Pink & White Rose Bouquet', size: 'Grand', price: 'AED 470', delivery: 'Thu 22 Oct · 9am – 12pm',
    url: 'https://maisonbotaniqueflowers.com/shop/eloise-pink-and-white-rose-bouquet',
  };
  const text = whatsappMessage.product(false, enquiry);
  assert.equal(text, [
    'Hello Maison Botanique, I\'d like to ask about "Eloise — Pink & White Rose Bouquet" (Grand, AED 470).',
    'Delivery: Thu 22 Oct · 9am – 12pm',
    'https://maisonbotaniqueflowers.com/shop/eloise-pink-and-white-rose-bouquet',
  ].join('\n'));
  const decoded = decodeURIComponent(new URL(whatsappLink(text)).searchParams.get('text') ?? '');
  assert.equal(decoded, text);
});

test('product enquiry leaves out a missing price or delivery cleanly', () => {
  const text = whatsappMessage.product(false, { name: 'Hazel', size: 'Signature', url: 'https://x/shop/hazel' });
  assert.equal(text, 'Hello Maison Botanique, I\'d like to ask about "Hazel" (Signature).\nhttps://x/shop/hazel');
});

test('Arabic product enquiry keeps the same parts', () => {
  const text = whatsappMessage.product(true, { name: 'إيلويز', size: 'غراند', price: '٤٧٠ د.إ.', url: 'https://x/shop/eloise' });
  assert.match(text, /«إيلويز»/);
  assert.match(text, /\(غراند، ٤٧٠ د\.إ\.\)/);
  assert.match(text, /https:\/\/x\/shop\/eloise$/);
});

test('florist hours are judged in Dubai time', () => {
  assert.equal(isWhatsappOpen(new Date('2026-10-21T04:59:00Z')), false); // 08:59 Dubai
  assert.equal(isWhatsappOpen(new Date('2026-10-21T05:00:00Z')), true); // 09:00
  assert.equal(isWhatsappOpen(new Date('2026-10-21T16:59:00Z')), true); // 20:59
  assert.equal(isWhatsappOpen(new Date('2026-10-21T17:00:00Z')), false); // 21:00
});
