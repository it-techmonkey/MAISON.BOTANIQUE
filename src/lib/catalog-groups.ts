// How the collection is browsed: rooms (the product's home), occasions and
// shop groups (by flower, format and budget). Groups are computed from the
// live catalog, so a group appears once Shopify has enough products for it.
// Each group id is also its shareable link on the home page, e.g. /#roses or
// /#occasion/birthday.

import { OCCASIONS as SITE_OCCASIONS, type Bilingual } from './site';
import type { Product, ProductRoom } from './types';

export const ROOMS: Array<{ id: ProductRoom; en: string; ar: string }> = [
  { id: 'roses', en: 'Roses', ar: 'الورود' },
  { id: 'bouquets', en: 'Bouquets', ar: 'باقات' },
  { id: 'vases', en: 'Vases & Boxes', ar: 'مزهريات وصناديق' },
  { id: 'gifts', en: 'Flowers & Gifts', ar: 'زهور وهدايا' },
  { id: 'grand', en: 'Grand Gestures', ar: 'لفتات كبرى' },
  { id: 'beauty', en: 'Beauty', ar: 'هدايا الجمال' },
  { id: 'hampers', en: 'Hampers & Keepsakes', ar: 'سلال وتذكارات' },
];

export const roomOf = (id: string) => ROOMS.find((room) => room.id === id) ?? ROOMS[1];

export interface Occasion {
  id: string;
  en: string;
  ar: string;
}

/** The occasions defined in site.ts, flattened for menus and filters. */
export const OCCASIONS: Occasion[] = SITE_OCCASIONS.map((occasion) => ({ id: occasion.id, en: occasion.name.en, ar: occasion.name.ar }));

export const findOccasion = (id: string) => OCCASIONS.find((occasion) => occasion.id === id) ?? null;
export const occasionName = (id: string): Bilingual => {
  const occasion = findOccasion(id);
  return occasion ? { en: occasion.en, ar: occasion.ar } : { en: id, ar: id };
};

export type GroupKind = 'all' | 'flower' | 'format' | 'curated' | 'budget';
export interface ShopGroup {
  id: string;
  en: string;
  ar: string;
  kind: GroupKind;
  test: (product: Product) => boolean;
}

const priceIn = (min: number, max: number) => (product: Product) => product.price >= min && product.price < max;

export const GROUPS: ShopGroup[] = [
  { id: 'all', en: 'All', ar: 'الكل', kind: 'all', test: () => true },
  // by flower
  { id: 'roses', en: 'Roses', ar: 'الورود', kind: 'flower', test: (p) => p.flowers.includes('rose') },
  { id: 'lilies', en: 'Lilies', ar: 'الزنبق', kind: 'flower', test: (p) => p.flowers.includes('lily') },
  { id: 'orchids', en: 'Orchids', ar: 'الأوركيد', kind: 'flower', test: (p) => p.flowers.includes('orchid') },
  { id: 'tulips', en: 'Tulips', ar: 'التوليب', kind: 'flower', test: (p) => p.flowers.includes('tulip') },
  { id: 'hydrangeas', en: 'Hydrangeas', ar: 'الهيدرانجيا', kind: 'flower', test: (p) => p.flowers.includes('hydrangea') },
  { id: 'sunflowers', en: 'Sunflowers', ar: 'دوار الشمس', kind: 'flower', test: (p) => p.flowers.includes('sunflower') },
  { id: 'carnations', en: 'Carnations', ar: 'القرنفل', kind: 'flower', test: (p) => p.flowers.includes('carnation') },
  { id: 'mixed', en: 'Mixed & Garden', ar: 'تشكيلات مختلطة', kind: 'flower', test: (p) => p.flowers.includes('mixed') },
  // by format
  { id: 'bouquets', en: 'Bouquets', ar: 'باقات', kind: 'format', test: (p) => p.format === 'bouquet' },
  { id: 'boxes', en: 'Boxes & Baskets', ar: 'صناديق وسلال', kind: 'format', test: (p) => p.format === 'box' },
  { id: 'vases', en: 'Vases', ar: 'مزهريات', kind: 'format', test: (p) => p.format === 'vase' },
  { id: 'gifts', en: 'Gifts & Add-ons', ar: 'هدايا وإضافات', kind: 'format', test: (p) => p.format === 'gift' },
  // curated
  { id: 'grand-gestures', en: 'Grand Gestures', ar: 'لفتات كبرى', kind: 'curated', test: (p) => p.room === 'grand' || (p.stems ?? 0) >= 100 },
  // by budget
  { id: 'under-300', en: 'Under AED 300', ar: 'أقل من 300 درهم', kind: 'budget', test: priceIn(0, 300) },
  { id: 'aed-300-500', en: 'AED 300 – 500', ar: '300 – 500 درهم', kind: 'budget', test: priceIn(300, 500) },
  { id: 'aed-500-1000', en: 'AED 500 – 1,000', ar: '500 – 1,000 درهم', kind: 'budget', test: priceIn(500, 1000) },
  { id: 'aed-1000-plus', en: 'AED 1,000 and above', ar: '1,000 درهم فأكثر', kind: 'budget', test: priceIn(1000, Infinity) },
];

/** Groups with fewer than this many pieces stay hidden until the catalog fills them. */
const MIN_GROUP_SIZE = 6;
/** The tabs above the grid: the main ways in, in this order. */
export const TAB_IDS = ['all', 'roses', 'bouquets', 'boxes', 'vases', 'gifts', 'grand-gestures', 'under-300'];
/** Old links (#grand, product-type rooms) still land somewhere sensible. */
export const GROUP_ALIASES: Record<string, string> = { grand: 'grand-gestures', hampers: 'gifts', beauty: 'gifts' };

export interface LiveCatalogGroups {
  groups: Array<ShopGroup & { count: number }>;
  occasions: Occasion[];
  findGroup: (id: string) => (ShopGroup & { count: number }) | null;
}

export function liveCatalogGroups(products: Product[]): LiveCatalogGroups {
  const groups = GROUPS
    .map((group) => ({ ...group, count: products.filter(group.test).length }))
    .filter((group) => group.id === 'all' || group.count >= MIN_GROUP_SIZE);
  const occasions = OCCASIONS.filter((occasion) => products.some((product) => product.occasions.includes(occasion.id)));
  return { groups, occasions, findGroup: (id) => groups.find((group) => group.id === id) ?? null };
}
