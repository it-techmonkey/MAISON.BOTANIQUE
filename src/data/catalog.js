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
