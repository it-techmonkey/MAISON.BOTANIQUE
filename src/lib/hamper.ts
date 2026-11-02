// Conscious Curations Diwali hampers: the partner's catalogue (src/data/conscious-curations.json,
// prices exactly as in her catalogue; add any markup there) and the rules of her build-your-own hamper.
// Orders go to the partner by WhatsApp with the code string; nothing here touches Shopify or checkout.

// Relative path with a JSON attribute so the unit test loader (which appends .ts to @/ paths) can read it.
import data from '../data/conscious-curations.json' with { type: 'json' };

export interface HamperItem { code: string; en: string; ar: string; noteEn: string; noteAr: string; price: number; unit?: string; photo: string }
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

/** The message the partner receives (English: her catalogue and order form are English). */
export function hamperMessage(selection: HamperSelection) {
  const total = hamperTotal(selection);
  const lines = hamperCodes(selection).map((code) => {
    const item = byCode.get(code)!;
    return `${item.code} ${item.en}${item.unit ? ' (pair)' : ''}, AED ${item.price}`;
  });
  return [
    'Hello Conscious Curations, I’d like to order a Diwali hamper from the Maison Botanique website:',
    `Code: ${hamperCodeString(selection)}`,
    ...lines,
    `Total: AED ${total}`,
    `I understand that a 50% advance (AED ${total / 2}) books the order and the rest is settled before delivery. Delivery is at a small extra cost (free above AED 1,000).`,
  ].join('\n');
}

export const hamperWhatsappLink = (selection: HamperSelection) => `https://wa.me/${data.whatsapp}?text=${encodeURIComponent(hamperMessage(selection))}`;

/** Sub-categories of the Conscious Curations page. Add an entry here and a route under /conscious-curations/<slug>. */
export interface CuratedCollection { slug: string; live: boolean; en: string; ar: string; titleEn: string; titleAr: string; introEn: string; introAr: string; photo: string }
export const CURATED_COLLECTIONS = data.collections as CuratedCollection[];

/** Ready-made starting points: the customer taps one, then swaps pieces. Every preset must pass hamperProblems (see the test). */
export interface HamperPreset extends HamperSelection { id: string; en: string; ar: string }
export const HAMPER_PRESETS = data.presets as HamperPreset[];

/** Cut-out photo used in the picture of the hamper. */
export const hamperCutout = (code: string) => `/hamper/cut/${code.toLowerCase()}.webp`;
