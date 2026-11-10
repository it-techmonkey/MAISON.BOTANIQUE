// The licensed company details shown on the contact page, the terms and the Organization markup.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { BUSINESS } = await import('../src/lib/site.ts');
const { siteSchema } = await import('../src/lib/site-schema.ts');
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('business details are complete in English and Arabic', () => {
  assert.equal(BUSINESS.licenceNumber, '1667073');
  for (const field of [BUSINESS.legalName, BUSINESS.address]) {
    assert.ok(field.en.length > 0);
    assert.match(field.ar, /[؀-ۿ]/);
  }
  assert.match(BUSINESS.address.en, /Bin Dasmal Building 1/);
});

test('Organization markup carries the legal name and Dubai address', () => {
  const org = siteSchema()['@graph'].find((node) => node['@type'] === 'Organization');
  assert.equal(org.legalName, BUSINESS.legalName.en);
  assert.equal(org.address.streetAddress, BUSINESS.streetAddress);
  assert.equal(org.address.addressCountry, 'AE');
});

test('the details appear on the contact page and terms, not in the footer', () => {
  assert.match(read('src/app/(store)/contact/page.tsx'), /BUSINESS\.address/);
  assert.match(read('src/app/(store)/terms/page.tsx'), /BUSINESS\.licenceNumber/);
  assert.doesNotMatch(read('src/components/store/SiteFooter.tsx'), /BUSINESS|1667073/);
});
