// Halloween and Diwali 2026: which products belong to each home-page band,
// and the Diwali pre-order delivery window.
//
// Shopify holds the live products. Until the owner publishes them, a preview
// build fills in the records from src/data/seasonal-products.json so the
// bands can be reviewed; production never shows a product Shopify does not
// return, because it could not be bought.

import data from '@/data/seasonal-products.json';
import { roomOf } from '@/lib/catalog-groups';
import type { DeliveryRange } from '@/lib/delivery';
import type { Product, ProductFormat } from '@/lib/types';

export const HALLOWEEN_HANDLES: readonly string[] = data.halloween;
export const DIWALI_HANDLES: readonly string[] = data.diwali;
export const TORAN_HANDLE = 'marigold-toran';

const SEASONAL = new Set([...HALLOWEEN_HANDLES, ...DIWALI_HANDLES]);
/** Seasonal pieces stay in the collection but never stand in for a category photo (owner, 25 Oct 2026). */
export const isSeasonal = (id: string) => SEASONAL.has(id);

const DELIVERY_RANGES: Record<string, DeliveryRange> = data.deliveryRanges;

export const seasonalDeliveryRange = (handle: string): DeliveryRange | null => DELIVERY_RANGES[handle] ?? null;
export const seasonalExpired = (handle: string, dubaiDate: string) => {
  const range = seasonalDeliveryRange(handle);
  return Boolean(range && dubaiDate > range.to);
};

/** The dates every product in the bag can be delivered on, or null when there is no limit. */
export function deliveryRangeFor(handles: readonly string[]): DeliveryRange | null {
  const ranges = handles.map(seasonalDeliveryRange).filter((range): range is DeliveryRange => range !== null);
  if (!ranges.length) return null;
  return ranges.reduce((a, b) => ({ from: a.from > b.from ? a.from : b.from, to: a.to < b.to ? a.to : b.to }));
}

/** Preview builds may show seasonal products that are still drafts in Shopify. */
const previewFallbackAllowed = process.env.VERCEL_ENV !== 'production';

function previewProduct(item: typeof data.products[number], index: number): Product {
  const room = roomOf(item.room);
  const sizes = item.sizes.map((size) => ({ ...size, variantId: null, available: true }));
  const lowest = sizes.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    id: item.id, shopifyId: null, no: item.no, name: item.name, nameAr: item.nameAr,
    room: room.id, category: room.en, categoryAr: room.ar,
    line: item.line, lineAr: item.lineAr, composition: item.composition, compositionAr: item.compositionAr,
    feature: '', stems: item.stems, flowers: item.flowers, format: item.format as ProductFormat,
    order: index + 1, custom: null, productType: room.en, vendor: 'Maison Botanique', occasions: item.occasions,
    image: `/seasonal/${item.id}-960.webp`, imageSmall: `/seasonal/${item.id}-480.webp`, imageAlt: item.imageAlt,
    price: lowest.price, compareAtPrice: lowest.compareAtPrice, currencyCode: 'AED', bg: '#E9E1D5', accent: '#673C43',
    description: item.composition.join(', '), descriptionAr: item.compositionAr.join('، '),
    sizes, available: true, heroOrder: null, featured: false,
    answerSummary: '', answerSummaryAr: '', faq: [],
  };
}

/** Adds the seasonal records Shopify did not return, on preview builds only. */
export function withSeasonalPreview(products: Product[]): Product[] {
  if (!previewFallbackAllowed) return products;
  const known = new Set(products.map((product) => product.id));
  const missing = data.products.map(previewProduct).filter((product) => !known.has(product.id));
  return missing.length ? [...missing, ...products] : products;
}

/** The products for a band, in the band's own order, skipping any not in the catalogue. */
export function pick(products: Product[], handles: readonly string[]) {
  const byId = new Map(products.map((product) => [product.id, product]));
  return handles.map((handle) => byId.get(handle)).filter((product): product is Product => Boolean(product));
}
