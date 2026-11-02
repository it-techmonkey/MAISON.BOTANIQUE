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

test('sub-categories are bilingual and have a photo; Diwali is live', async () => {
  const { CURATED_COLLECTIONS } = await import('../src/lib/hamper.ts');
  assert.ok(CURATED_COLLECTIONS.some((c) => c.slug === 'diwali' && c.live));
  for (const c of CURATED_COLLECTIONS) assert.ok(c.en && c.ar && c.titleEn && c.titleAr && c.introEn && c.introAr && existsSync(`public${c.photo}`), c.slug);
});

test('ready-made hamper ideas follow the rules and every item has a cut-out photo', async () => {
  const { HAMPER_PRESETS, HAMPER_SLOTS, selectionFromSlots, hamperCutout, presetPhoto } = await import('../src/lib/hamper.ts');
  assert.ok(HAMPER_PRESETS.length >= 3);
  for (const preset of HAMPER_PRESETS) {
    const selection = selectionFromSlots(preset.slots);
    assert.deepEqual(hamperProblems(selection), [], preset.id);
    assert.ok(existsSync(`public${presetPhoto(preset.id)}`), `${preset.id} photo`);
    for (const slot of HAMPER_SLOTS.filter((slot) => preset.slots[slot.id])) assert.ok(HAMPER_SECTIONS.filter((section) => slot.sections.includes(section.id)).some((section) => section.items.some((item) => item.code === preset.slots[slot.id])), `${preset.id} ${slot.id} is from the right section`);
  }
  for (const item of HAMPER_ITEMS) assert.ok(existsSync(`public${hamperCutout(item.code)}`), item.code);
});

test('a card message and the recipient reminder reach the partner', () => {
  const message = hamperMessage(example, 'Happy Diwali, Mama');
  assert.ok(message.includes('Card message: Happy Diwali, Mama'));
  assert.ok(message.includes('confirm the recipient'));
  assert.ok(!hamperMessage(example).includes('Card message'));
});

test('the photo request accepts only a valid catalogue hamper and the prompt names exactly its products', async () => {
  const { parseRenderRequest, hamperRenderPrompt } = await import('../src/lib/hamper-render.ts');
  const ok = { basket: 'B3', picks: ['L1', 'P1', 'T2', 'W4'], treats: ['F2'] };
  assert.deepEqual(parseRenderRequest(ok), ok);
  for (const bad of [null, {}, { ...ok, basket: 'X9' }, { ...ok, picks: ['L1', 'L1', 'P1'] }, { ...ok, picks: ['L1'] }, { ...ok, treats: [] }, { ...ok, picks: ['L1', 'P1', 'T2', 'W4', 'L2', 'L3'] }, { ...ok, basket: 'L1' }]) assert.equal(parseRenderRequest(bad), null);
  const prompt = hamperRenderPrompt(ok);
  for (const part of ['Sirohi kesariya tray', 'Terracotta candle', 'Mithai box (9 pc)', 'exactly these 5 products', 'Exactly one of each']) assert.ok(prompt.includes(part), part);
  assert.ok(!prompt.includes('Sirohi elegant tray'));
});
