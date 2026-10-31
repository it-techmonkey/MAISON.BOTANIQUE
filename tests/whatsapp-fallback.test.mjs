import test from 'node:test';
import assert from 'node:assert/strict';

delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const { SITE } = await import('../src/lib/site.ts');

test('WhatsApp falls back to the public phone when the preview has no setting', () => {
  assert.equal(SITE.whatsapp, SITE.phone?.replace(/\D/g, ''));
});
