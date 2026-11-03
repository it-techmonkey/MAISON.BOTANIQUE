// The partner's items as store products. Shopify holds the live ones (handle `cc-<code>`, see src/data/conscious-curations.json);
// until they exist a preview build fills them in so the hamper builder and the bag can be tried. Production never shows a product
// Shopify does not return, because it could not be bought.
import { HAMPER_ITEMS, type HamperItem } from './hamper';
import type { Product } from './types';

const previewAllowed = process.env.VERCEL_ENV !== 'production';

function previewProduct(item: HamperItem, index: number): Product {
  const detail = item.unit ? 'Sold as a pair' : 'One piece';
  return {
    id: item.handle, shopifyId: null, no: null, name: item.en, nameAr: item.ar,
    room: 'gifts', category: 'Conscious Curations', categoryAr: 'Conscious Curations',
    line: item.noteEn, lineAr: item.noteAr, composition: [item.noteEn], compositionAr: [item.noteAr],
    feature: '', stems: null, flowers: [], format: 'gift', order: 9000 + index, custom: null,
    productType: 'Conscious Curations', vendor: 'Conscious Curations', occasions: [],
    image: item.photo, imageSmall: item.photo, imageAlt: item.en, price: item.price, compareAtPrice: null, currencyCode: 'AED',
    bg: '#E9E1D5', accent: '#673C43', description: item.noteEn, descriptionAr: item.noteAr,
    sizes: [{ id: 'default', name: detail, nameAr: item.unit ? 'للزوج' : 'قطعة', price: item.price, compareAtPrice: null, detail, detailAr: item.unit ? 'تُباع كزوج' : 'قطعة واحدة', variantId: null, available: true }],
    available: true, heroOrder: null, featured: false, answerSummary: '', answerSummaryAr: '', faq: [],
  };
}

/** Adds the hamper items Shopify did not return, on preview builds only. */
export function withHamperPreview(products: Product[]): Product[] {
  if (!previewAllowed) return products;
  const known = new Set(products.map((product) => product.id));
  const missing = HAMPER_ITEMS.map(previewProduct).filter((product) => !known.has(product.id));
  return missing.length ? [...products, ...missing] : products;
}

/** Items of a hamper that are on the shelf as products; the builder can only add the hamper when none are missing. */
export const isHamperProduct = (id: string) => HAMPER_ITEMS.some((item) => item.handle === id);
