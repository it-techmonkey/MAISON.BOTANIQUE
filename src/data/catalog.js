// One product registry for every view: the three hero concept pieces plus the
// collection built from the Shopify export (scripts/build_collection.py).
// Collection prices are research placeholders until Maison prices are set.
import { products as conceptProducts } from './products.js';
import collectionData from './collection.json';

export const ROOMS = [
  { id: 'all', en: 'All', ar: 'الكل' },
  { id: 'roses', en: 'Roses', ar: 'الورود' },
  { id: 'bouquets', en: 'Bouquets', ar: 'باقات' },
  { id: 'vases', en: 'Vases & Boxes', ar: 'مزهريات وصناديق' },
  { id: 'gifts', en: 'Flowers & Gifts', ar: 'زهور وهدايا' },
  { id: 'grand', en: 'Grand Gestures', ar: 'لفتات كبرى' },
  { id: 'beauty', en: 'Beauty', ar: 'هدايا الجمال' },
  { id: 'hampers', en: 'Hampers & Keepsakes', ar: 'سلال وتذكارات' },
];

const roomOf = (id) => ROOMS.find((room) => room.id === id) || ROOMS[2];

export const collectionProducts = collectionData.products.map((item) => ({
  ...item,
  category: roomOf(item.room).en,
  categoryAr: roomOf(item.room).ar,
  description: item.composition.join(', '),
  descriptionAr: item.compositionAr.join('، '),
}));

export const allProducts = [...conceptProducts, ...collectionProducts];

// The hero shows real catalogue pieces photographed with Maison branding.
export const heroProducts = collectionData.hero
  .map((id) => collectionProducts.find((product) => product.id === id))
  .filter(Boolean);

export function findProduct(id) {
  return allProducts.find((product) => product.id === id) || null;
}

export const OCCASIONS = [
  { id: 'birthday', en: 'Birthday', ar: 'عيد ميلاد' },
  { id: 'love', en: 'Love & Anniversary', ar: 'حب وذكرى' },
  { id: 'thanks', en: 'Thank You', ar: 'شكر وامتنان' },
  { id: 'get-well', en: 'Get Well', ar: 'سلامتك' },
  { id: 'new-baby', en: 'New Baby', ar: 'مولود جديد' },
  { id: 'congratulations', en: 'Congratulations', ar: 'تهنئة' },
  { id: 'wedding', en: 'Wedding', ar: 'زفاف' },
  { id: 'sorry', en: "I'm Sorry", ar: 'اعتذار' },
  { id: 'just-because', en: 'Just Because', ar: 'من دون مناسبة' },
];

// Rooms and occasions that actually have products, for navigation.
export const liveRooms = ROOMS.filter((room) => room.id === 'all' || collectionProducts.some((p) => p.room === room.id));
export const liveOccasions = OCCASIONS.filter((o) => collectionProducts.some((p) => p.occasions.includes(o.id)));

// Shop groups: how buyers browse. A product can sit in several groups (a rose box is in
// Roses and in Boxes). Each id is also its shareable link, e.g. #roses or #under-300.
const priceIn = (min, max) => (p) => p.price >= min && p.price < max;
export const GROUPS = [
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
  { id: 'grand-gestures', en: 'Grand Gestures', ar: 'لفتات كبرى', kind: 'curated', test: (p) => p.room === 'grand' || (p.stems || 0) >= 100 },
  // by budget
  { id: 'under-300', en: 'Under AED 300', ar: 'أقل من 300 درهم', kind: 'budget', test: priceIn(0, 300) },
  { id: 'aed-300-500', en: 'AED 300 – 500', ar: '300 – 500 درهم', kind: 'budget', test: priceIn(300, 500) },
  { id: 'aed-500-1000', en: 'AED 500 – 1,000', ar: '500 – 1,000 درهم', kind: 'budget', test: priceIn(500, 1000) },
  { id: 'aed-1000-plus', en: 'AED 1,000 and above', ar: '1,000 درهم فأكثر', kind: 'budget', test: priceIn(1000, Infinity) },
];

// Groups with fewer than six pieces stay hidden until the catalogue fills them.
export const liveGroups = GROUPS
  .map((g) => ({ ...g, count: collectionProducts.filter(g.test).length }))
  .filter((g) => g.id === 'all' || g.count >= 6);
export const findGroup = (id) => liveGroups.find((g) => g.id === id) || null;
// The tabs above the grid: the main ways in, in this order.
export const TAB_IDS = ['all', 'roses', 'bouquets', 'boxes', 'vases', 'gifts', 'grand-gestures', 'under-300'];
// Old links (#grand, product-type rooms) still land somewhere sensible.
export const GROUP_ALIASES = { grand: 'grand-gestures', hampers: 'gifts', beauty: 'gifts' };
