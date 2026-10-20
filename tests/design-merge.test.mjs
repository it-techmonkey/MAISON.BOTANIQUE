import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = 'test-maison.myshopify.com';
process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN = 'test-public';
process.env.SHOPIFY_FORMS_ADMIN_TOKEN = 'test-forms';
process.env.SHOPIFY_DISCOUNTS_ADMIN_TOKEN = 'test-discounts';
process.env.OFFER_CODE_SECRET = 'test-code-secret-with-at-least-32-characters';
process.env.OFFER_SESSION_SECRET = 'test-cookie-secret-with-at-least-32-characters';
delete process.env.VERCEL;
const { parseEnquiry } = await import('../src/lib/enquiry.ts');
const { checkEnquiryLimit, readEnquiryBody } = await import('../src/lib/enquiry-limit.ts');
const { openOfferSession, sealOffer } = await import('../src/lib/offer-session.ts');
const { getWelcomeCode, WelcomeNotEligible } = await import('../src/lib/shopify/welcome-offer.ts');
const { BUDGET_BANDS, budgetOf, liveCatalogGroups } = await import('../src/lib/catalog-groups.ts');
const { browserCatalog, hydrateBrowserCatalog } = await import('../src/lib/browser-catalog.ts');
const { upsertCustomer } = await import('../src/lib/shopify/forms.ts');

test('offer consent is optional; newsletter consent and valid contact remain required', () => {
  assert.equal(parseEnquiry({ kind: 'offer', email: 'test@example.com', consent: false }).ok, true);
  assert.equal(parseEnquiry({ kind: 'offer', phone: '0501234567', consent: false }).value.phone, '+971501234567');
  assert.equal(parseEnquiry({ kind: 'offer', email: 'bad' }).ok, false);
  assert.equal(parseEnquiry({ kind: 'newsletter', email: 'test@example.com', consent: false }).ok, false);
});

test('contact session rejects tampering and expires without exposing plaintext contact', () => {
  const value = { customerId: 'gid://shopify/Customer/1', code: 'TEST', email: 'test@example.com', phone: '' };
  const sealed = sealOffer(value, 1000);
  assert.equal(sealed.includes(value.email), false);
  assert.equal(openOfferSession(sealed, 1001).email, value.email);
  assert.equal(openOfferSession(sealed, 1000 + 31 * 86400_000), null);
  assert.equal(openOfferSession(sealed.slice(0, -8) + 'AAAAAAAA', 1001), null);
});

test('enquiry limit isolates IPs, blocks sixth attempt and resets after ten minutes', () => {
  const request = (ip) => new Request('https://example.com/api/enquiry', { headers: { 'x-forwarded-for': ip } });
  for (let i = 0; i < 5; i++) assert.equal(checkEnquiryLimit(request('192.0.2.1'), 1000), 0);
  assert.equal(checkEnquiryLimit(request('192.0.2.1'), 1000), 600);
  assert.equal(checkEnquiryLimit(request('192.0.2.2'), 1000), 0);
  assert.equal(checkEnquiryLimit(request('192.0.2.1'), 601000), 0);
});

test('request size cap counts UTF-8 bytes', async () => {
  await assert.rejects(readEnquiryBody(new Request('https://example.com', { method: 'POST', body: 'é'.repeat(9000) })), RangeError);
  assert.equal(await readEnquiryBody(new Request('https://example.com', { method: 'POST', body: '{}' })), '{}');
});

test('budget boundaries have no gaps or overlap; one Money product is sufficient', () => {
  assert.equal(BUDGET_BANDS.length, 4);
  for (const [price, band] of [[299.99, 'b1'], [300, 'b2'], [499.99, 'b2'], [500, 'b3'], [999.99, 'b3'], [1000, 'b4']]) assert.equal(budgetOf(price), band);
  const product = { room: 'money', flowers: [], format: 'gift', stems: null, price: 500, occasions: [] };
  assert.equal(liveCatalogGroups([]).findGroup('money'), null);
  assert.equal(liveCatalogGroups([product]).findGroup('money').count, 1);
});

test('personal codes are customer-bound, single-use, idempotent and first-order only', async () => {
  const originalFetch = global.fetch;
  const codes = new Set();
  let orders = '0', creates = 0;
  global.fetch = async (_url, options) => {
    const { query, variables } = JSON.parse(options.body);
    if (query.includes('WelcomeEligibility')) return Response.json({ data: { customer: { numberOfOrders: orders } } });
    if (query.includes('query WelcomeCode')) return Response.json({ data: { codeDiscountNodeByCode: codes.has(variables.code) ? { id: 'discount-1' } : null } });
    if (query.includes('mutation WelcomeDiscount')) {
      creates++;
      assert.deepEqual(variables.input.context.customers.add, ['gid://shopify/Customer/1']);
      assert.equal(variables.input.usageLimit, 1);
      assert.equal(variables.input.customerGets.value.percentage, .25);
      assert.equal(variables.input.endsAt, null);
      assert.equal('minimumRequirement' in variables.input, false);
      codes.add(variables.input.code);
      return Response.json({ data: { discountCodeBasicCreate: { userErrors: [] } } });
    }
    throw new Error('Unexpected network request');
  };
  try {
    const first = await getWelcomeCode('gid://shopify/Customer/1');
    assert.match(first, /^MB25-[A-F0-9]{20}$/);
    assert.equal(await getWelcomeCode('gid://shopify/Customer/1'), first);
    assert.equal(creates, 1);
    orders = '1';
    await assert.rejects(getWelcomeCode('gid://shopify/Customer/1'), WelcomeNotEligible);
    orders = '0';
    delete process.env.SHOPIFY_DISCOUNTS_ADMIN_TOKEN;
    assert.equal(await getWelcomeCode('gid://shopify/Customer/1'), 'MAISON25');
  } finally { global.fetch = originalFetch; process.env.SHOPIFY_DISCOUNTS_ADMIN_TOKEN = 'test-discounts'; }
});

test('phone offer without marketing consent never subscribes to SMS', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => {
    const { query, variables } = JSON.parse(options.body);
    if (query.includes('query OfferCustomer')) return Response.json({ data: { customer: null } });
    assert.equal(query.includes('mutation OfferCustomerCreate'), true);
    assert.equal('smsMarketingConsent' in variables.input, false);
    assert.equal(variables.input.tags.includes('newsletter'), false);
    return Response.json({ data: { customerCreate: { customer: { id: 'new-customer' }, userErrors: [] } } });
  };
  try {
    const input = parseEnquiry({ kind: 'offer', phone: '0501234567', consent: false }).value;
    assert.equal(await upsertCustomer(input), 'new-customer');
  } finally { global.fetch = originalFetch; }
});

test('discount creation timeout reuses an already-created code', async () => {
  const originalFetch = global.fetch;
  let created = false, creates = 0;
  global.fetch = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    if (query.includes('WelcomeEligibility')) return Response.json({ data: { customer: { numberOfOrders: '0' } } });
    if (query.includes('query WelcomeCode')) return Response.json({ data: { codeDiscountNodeByCode: created ? { id: 'discount' } : null } });
    creates++;
    created = true;
    throw new Error('Timeout after Shopify committed the discount');
  };
  try {
    assert.match(await getWelcomeCode('gid://shopify/Customer/2'), /^MB25-/);
    assert.equal(creates, 1);
  } finally { global.fetch = originalFetch; }
});

test('browser projection retains shopping and search facts and reduces repeated page text', () => {
  const product = { id: 'test', description: 'long text '.repeat(100), descriptionAr: 'نص '.repeat(100), feature: 'editorial', answerSummary: 'answer', answerSummaryAr: 'إجابة', faq: [{ q: 'q', a: 'a' }], composition: ['51 pink roses'], compositionAr: ['٥١ وردة'], custom: { kind: 'letter', label: 'Letter' }, sizes: [{ id: 'signature', price: 235, compareAtPrice: 261 }], price: 235 };
  const full = { source: 'sample', products: [product], collections: [] };
  const slim = browserCatalog(full);
  assert.ok(JSON.stringify(slim).length < JSON.stringify(full).length);
  const restored = hydrateBrowserCatalog(slim).products[0];
  for (const field of ['id', 'composition', 'compositionAr', 'custom', 'sizes', 'price']) assert.deepEqual(restored[field], product[field]);
  assert.equal('faq' in slim.products[0], false);
  assert.equal(restored.description, '');
  assert.equal(full.products[0].description, product.description);
});
