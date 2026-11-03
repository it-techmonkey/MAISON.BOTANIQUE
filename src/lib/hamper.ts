// Conscious Curations Diwali hampers: the partner's catalogue (src/data/conscious-curations.json,
// prices exactly as in her catalogue; add any markup there) and the rules of her build-your-own hamper.
// Each item is its own Shopify product (handle `cc-<code>`); the builder adds the chosen items to the bag, so ordering works like any other product.

// Relative path with a JSON attribute so the unit test loader (which appends .ts to @/ paths) can read it.
import data from '../data/conscious-curations.json' with { type: 'json' };

export interface HamperItem { code: string; /** Shopify product handle, to be created for each item. */ handle: string; en: string; ar: string; noteEn: string; noteAr: string; price: number; unit?: string; photo: string }
export interface HamperSection { id: string; en: string; ar: string; kind: 'basket' | 'pick' | 'treat'; items: HamperItem[] }

export const HAMPER_SECTIONS = data.sections as HamperSection[];
export const HAMPER_ITEMS = HAMPER_SECTIONS.flatMap((section) => section.items);
export const PICK_MIN = 3;
export const PICK_MAX = 5;

const byCode = new Map(HAMPER_ITEMS.map((item) => [item.code, item]));
const kindOf = (code: string) => HAMPER_SECTIONS.find((section) => section.items.some((item) => item.code === code))?.kind;

/** One basket, 3-5 handcrafted pieces, at least one treat. Each piece is chosen once (no quantities). */
export interface HamperSelection { basket: string | null; picks: string[]; treats: string[] }

/** Codes in the partner's order: basket, handcrafted pieces in catalogue order, then treats. */
export function hamperCodes({ basket, picks, treats }: HamperSelection) {
  const inCatalogue = (codes: string[]) => HAMPER_ITEMS.filter((item) => codes.includes(item.code)).map((item) => item.code);
  return [...(basket ? [basket] : []), ...inCatalogue(picks), ...inCatalogue(treats)];
}

export const hamperCodeString = (selection: HamperSelection) => hamperCodes(selection).join(' + ');

export const hamperTotal = (selection: HamperSelection) => hamperCodes(selection).reduce((sum, code) => sum + (byCode.get(code)?.price ?? 0), 0);

export type HamperProblem = 'basket' | 'few' | 'many' | 'treat' | 'unknown';

/** What is still missing or wrong; an empty list means the hamper can be sent. */
export function hamperProblems({ basket, picks, treats }: HamperSelection): HamperProblem[] {
  const problems: HamperProblem[] = [];
  if ((basket && kindOf(basket) !== 'basket') || picks.some((code) => kindOf(code) !== 'pick') || treats.some((code) => kindOf(code) !== 'treat')) problems.push('unknown');
  if (!basket) problems.push('basket');
  if (picks.length < PICK_MIN) problems.push('few');
  if (picks.length > PICK_MAX) problems.push('many');
  if (!treats.length) problems.push('treat');
  return problems;
}

/** Sub-categories of the Conscious Curations page. Add an entry here and a route under /conscious-curations/<slug>. */
export interface CuratedCollection { slug: string; live: boolean; en: string; ar: string; titleEn: string; titleAr: string; introEn: string; introAr: string; photo: string }
export const CURATED_COLLECTIONS = data.collections as CuratedCollection[];

/**
 * The guided hamper: one place per kind of thing, so every hamper is balanced (a light, a blessing, something for the table,
 * something for every day) without the customer having to work out what goes together. `sections` are the catalogue sections
 * offered when swapping that place.
 */
export type SlotId = 'basket' | 'light' | 'blessing' | 'table' | 'everyday' | 'extra' | 'treat' | 'treat2';
export interface HamperSlot { id: SlotId; en: string; ar: string; sections: string[]; optional?: boolean }
export const HAMPER_SLOTS: HamperSlot[] = [
  { id: 'basket', en: 'Basket', ar: 'السلة', sections: ['B'] },
  { id: 'light', en: 'Light', ar: 'الإضاءة', sections: ['L'] },
  { id: 'blessing', en: 'Blessing', ar: 'البركة', sections: ['P'] },
  { id: 'table', en: 'For the table', ar: 'للمائدة', sections: ['T'] },
  { id: 'everyday', en: 'For every day', ar: 'لكل يوم', sections: ['W'] },
  { id: 'extra', en: 'One more piece', ar: 'قطعة إضافية', sections: ['L', 'P', 'T', 'W'], optional: true },
  { id: 'treat', en: 'Treat', ar: 'الحلوى', sections: ['F'] },
  { id: 'treat2', en: 'Another treat', ar: 'حلوى أخرى', sections: ['F'], optional: true },
];

export type HamperSlots = Partial<Record<SlotId, string | null>>;
const PIECE_SLOTS: SlotId[] = ['light', 'blessing', 'table', 'everyday', 'extra'];

/** What the customer filled in, as the basket / pieces / treats the rest of this file understands. */
export function selectionFromSlots(slots: HamperSlots): HamperSelection {
  const codes = (ids: SlotId[]) => ids.map((id) => slots[id]).filter((code): code is string => !!code);
  return { basket: slots.basket ?? null, picks: codes(PIECE_SLOTS), treats: codes(['treat', 'treat2']) };
}

/** Ready-made starting points: the customer taps one, then swaps any place. Every preset must pass hamperProblems (see the test). */
export interface HamperPreset { id: string; en: string; ar: string; slots: HamperSlots }
export const HAMPER_PRESETS = data.presets as HamperPreset[];

/** Rendered photo of a ready-made hamper, shown while the customer has not changed it. */
export const presetPhoto = (id: string) => `/hamper/presets/${id}.webp`;
/** 160 px version for small buttons and chips (a few KB instead of 170). Ready-made hampers only. */
export const presetThumb = (id: string) => `/hamper/presets/thumb/${id}.webp`;
/** The lowest price of a ready-made hamper, for "from" lines. */
export const hamperFromPrice = () => Math.min(...HAMPER_PRESETS.map((preset) => hamperTotal(selectionFromSlots(preset.slots))));

/** Every pre-made hamper photo: the ready-made hampers plus a few more built from popular swaps. */
export const HAMPER_PHOTOS = [...HAMPER_PRESETS.map(({ id, slots }) => ({ id, slots })), ...(data.gallery as Array<{ id: string; slots: HamperSlots }>)];

/**
 * The pre-made photo closest to what the customer chose (same basket first, then most items in common), and the chosen items
 * it does not show. Swapped items still go in the bag; the photo is a guide, not a render of the exact hamper.
 */
export function closestHamperPhoto(selection: HamperSelection) {
  const chosen = hamperCodes(selection);
  let best = HAMPER_PHOTOS[0], bestScore = -Infinity, bestCodes: string[] = [];
  for (const photo of HAMPER_PHOTOS) {
    const codes = hamperCodes(selectionFromSlots(photo.slots));
    const shared = codes.filter((code) => chosen.includes(code)).length;
    const score = shared * 10 + (codes[0] === chosen[0] ? 5 : 0) - (codes.length - shared);
    if (score > bestScore) { best = photo; bestScore = score; bestCodes = codes; }
  }
  const notShown = chosen.filter((code) => !bestCodes.includes(code));
  return { id: best.id, exact: notShown.length === 0 && bestCodes.length === chosen.length, notShown };
}
