// Conscious Curations hamper builder (src/lib/hamper.ts, src/data/conscious-curations.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const { HAMPER_ITEMS, HAMPER_SECTIONS, hamperCodeString, hamperTotal, hamperProblems, hamperMessage, hamperWhatsappLink } = await import('../src/lib/hamper.ts');
const example = { basket: 'B1', picks: ['T1', 'L5', 'L1'], treats: ['F1'] };

test('the catalogue example order is B1 + L1 + L5 + T1 + F1 = AED 300', () => {
  assert.equal(hamperCodeString(example), 'B1 + L1 + L5 + T1 + F1');
  assert.equal(hamperTotal(example), 300);
  assert.deepEqual(hamperProblems(example), []);
});

test('every code is unique, priced, named in both languages and has a photo', () => {
  assert.equal(new Set(HAMPER_ITEMS.map((item) => item.code)).size, HAMPER_ITEMS.length);
  for (const item of HAMPER_ITEMS) {
    assert.ok(Number.isFinite(item.price) && item.price > 0, `${item.code} price`);
    assert.ok(item.en && item.ar, `${item.code} names`);
    assert.ok(existsSync(new URL(`../public${item.photo}`, import.meta.url)), `${item.code} photo`);
    assert.match(item.code, new RegExp(`^${item.code[0]}\\d$`));
  }
  assert.deepEqual(HAMPER_SECTIONS.map((section) => section.id), ['B', 'L', 'P', 'T', 'W', 'F']);
});

test('the rules: one basket, 3-5 handcrafted pieces, at least one treat', () => {
  assert.deepEqual(hamperProblems({ basket: null, picks: [], treats: [] }), ['basket', 'few', 'treat']);
  assert.deepEqual(hamperProblems({ ...example, picks: ['L1', 'L2'] }), ['few']);
  assert.deepEqual(hamperProblems({ ...example, picks: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] }), ['many']);
  assert.deepEqual(hamperProblems({ ...example, treats: [] }), ['treat']);
  assert.ok(hamperProblems({ ...example, basket: 'L1' }).includes('unknown'));
  assert.ok(hamperProblems({ ...example, picks: ['L1', 'L2', 'F1'] }).includes('unknown'));
});

test('the WhatsApp message carries the code, items, total and terms', () => {
  const message = hamperMessage(example);
  for (const part of ['B1 + L1 + L5 + T1 + F1', 'Sirohi elegant tray', 'Total: AED 300', '50% advance (AED 150)', 'before delivery']) assert.ok(message.includes(part), part);
  assert.ok(hamperWhatsappLink(example).startsWith('https://wa.me/971558436828?text='));
});
