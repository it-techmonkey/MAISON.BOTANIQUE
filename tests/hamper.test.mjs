// Conscious Curations hamper builder (src/lib/hamper.ts, src/data/conscious-curations.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const { HAMPER_ITEMS, HAMPER_SECTIONS, hamperCodeString, hamperTotal, hamperProblems } = await import('../src/lib/hamper.ts');
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

test('sub-categories are bilingual and have a photo; Diwali is live', async () => {
  const { CURATED_COLLECTIONS } = await import('../src/lib/hamper.ts');
  assert.ok(CURATED_COLLECTIONS.some((c) => c.slug === 'diwali' && c.live));
  for (const c of CURATED_COLLECTIONS) assert.ok(c.en && c.ar && c.titleEn && c.titleAr && c.introEn && c.introAr && existsSync(`public${c.photo}`), c.slug);
});

test('ready-made hamper ideas follow the rules and have a photo', async () => {
  const { HAMPER_PRESETS, HAMPER_SLOTS, selectionFromSlots, presetPhoto, presetThumb } = await import('../src/lib/hamper.ts');
  assert.ok(HAMPER_PRESETS.length >= 3);
  for (const preset of HAMPER_PRESETS) {
    const selection = selectionFromSlots(preset.slots);
    assert.deepEqual(hamperProblems(selection), [], preset.id);
    assert.ok(existsSync(`public${presetPhoto(preset.id)}`), `${preset.id} photo`);
    assert.ok(existsSync(`public${presetThumb(preset.id)}`), `${preset.id} thumb`);
    for (const slot of HAMPER_SLOTS.filter((slot) => preset.slots[slot.id])) assert.ok(HAMPER_SECTIONS.filter((section) => slot.sections.includes(section.id)).some((section) => section.items.some((item) => item.code === preset.slots[slot.id])), `${preset.id} ${slot.id} is from the right section`);
  }
});

test('every pre-made photo is a valid hamper with a file; the closest photo is exact for a pre-made hamper and honest after a swap', async () => {
  const { HAMPER_PHOTOS, HAMPER_PRESETS, selectionFromSlots, closestHamperPhoto, presetPhoto } = await import('../src/lib/hamper.ts');
  assert.ok(HAMPER_PHOTOS.length >= 12);
  assert.equal(new Set(HAMPER_PHOTOS.map((photo) => photo.id)).size, HAMPER_PHOTOS.length);
  for (const photo of HAMPER_PHOTOS) {
    assert.deepEqual(hamperProblems(selectionFromSlots(photo.slots)), [], photo.id);
    assert.ok(existsSync(`public${presetPhoto(photo.id)}`), photo.id);
  }
  for (const preset of HAMPER_PRESETS) assert.deepEqual(closestHamperPhoto(selectionFromSlots(preset.slots)), { id: preset.id, exact: true, notShown: [] });
  const swapped = selectionFromSlots({ ...HAMPER_PRESETS[2].slots, light: 'L9' });
  const nearest = closestHamperPhoto(swapped);
  assert.equal(nearest.exact, false);
  assert.deepEqual(nearest.notShown, ['L9']);
});

test('the "from" price is the cheapest ready-made hamper', async () => {
  const { hamperFromPrice } = await import('../src/lib/hamper.ts');
  assert.equal(hamperFromPrice(), 135);
});

test('the Diwali host card has its photo and the page links both ways', async () => {
  const { readFileSync } = await import('node:fs');
  assert.ok(existsSync('public/hamper/presets/card/festive.webp'));
  assert.ok(readFileSync('src/components/store/DiwaliEdition.tsx', 'utf8').includes("/conscious-curations#diwali"));
  assert.ok(readFileSync('src/components/store/HostGiftsLink.tsx', 'utf8').includes('/diwali#host'));
});

test('the permanent builder header is not Diwali-specific (the hampers stay all year)', async () => {
  const { readFileSync } = await import('node:fs');
  const { CURATED_COLLECTIONS } = await import('../src/lib/hamper.ts');
  const header = CURATED_COLLECTIONS.map((c) => `${c.en} ${c.ar} ${c.titleEn} ${c.titleAr}`).join(' ');
  assert.ok(!/diwali|ديوالي/i.test(header), header);
  for (const file of ['src/components/store/HamperBuilder.tsx', 'src/app/(store)/conscious-curations/page.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.ok(!/Build (your own )?a? ?Diwali hamper|Happy Diwali|A Diwali hamper|ديوالي/.test(source.replace(/Diwali 2026/g, '')), file);
  }
});

test('the category page has three pillars and does not feature Chefat65', async () => {
  const { readFileSync } = await import('node:fs');
  const page = readFileSync('src/app/(store)/conscious-curations/page.tsx', 'utf8');
  assert.ok(!/Chefat65/i.test(page));
  const pillars = page.slice(page.indexOf('const PILLARS = ['), page.indexOf('];', page.indexOf('const PILLARS = [')));
  assert.equal((pillars.match(/\{ en: '/g) || []).length, 3);
});
