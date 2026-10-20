export type Locale = 'en' | 'ar';

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface ProductSize {
  /** Stable slug used for radio inputs and the preview cart. */
  id: string;
  name: string;
  nameAr: string;
  price: number;
  /** Strikethrough ("was") price, when higher than `price`. */
  compareAtPrice: number | null;
  /** What the size means, e.g. "51 roses" or "As pictured". */
  detail: string;
  detailAr: string;
  /** `gid://shopify/ProductVariant/…` for live products; null in the sample catalog. */
  variantId: string | null;
  available: boolean;
}

/** Text the customer must enter at add-to-cart, e.g. a letter or an age number. */
export interface ProductCustomField {
  kind: 'letter' | 'age' | 'text';
  label: string;
}

/** How the collection is browsed: the product's room, flowers and format. */
export type ProductRoom = 'roses' | 'bouquets' | 'vases' | 'gifts' | 'grand' | 'beauty' | 'hampers' | 'money';
export type ProductFormat = 'bouquet' | 'box' | 'vase' | 'gift';

export interface Product {
  /** Shopify product handle. */
  id: string;
  /** `gid://shopify/Product/…` for live products; null in the sample catalog. */
  shopifyId: string | null;
  /** Catalog number, shown as N° 050. */
  no: number | null;
  name: string;
  nameAr: string;
  room: ProductRoom;
  /** Label of the room, e.g. "Vases & Boxes". */
  category: string;
  categoryAr: string;
  /** Short line under the name on cards. */
  line: string;
  lineAr: string;
  /** What's included, one item per entry. */
  composition: string[];
  compositionAr: string[];
  /** Optional editorial note. */
  feature: string;
  /** Flowers in the pictured size; null when not counted. */
  stems: number | null;
  /** Flower families (rose, lily, …) and format, for the shop groups. */
  flowers: string[];
  format: ProductFormat;
  /** Position in the Featured sort (lower first). */
  order: number;
  custom: ProductCustomField | null;
  /** Shopify product type and vendor, as reported to analytics. */
  productType: string;
  vendor: string;
  occasions: string[];
  image: string;
  /** About 480 px wide, for cards and thumbnails. */
  imageSmall: string;
  imageAlt: string;
  /** Lowest size price, shown on cards. */
  price: number;
  /** Strikethrough price for the lowest size. */
  compareAtPrice: number | null;
  currencyCode: string;
  bg: string;
  accent: string;
  description: string;
  descriptionAr: string;
  sizes: ProductSize[];
  available: boolean;
  /** Position in the home hero (1–3), or null. */
  heroOrder: number | null;
  /** Shown in the pinned hero gallery. */
  featured: boolean;
  /** Short answer for search and assistants, and FAQ pairs for the product page. */
  answerSummary: string;
  answerSummaryAr: string;
  faq: Array<{ q: string; a: string }>;
}

/** `sample` is the bundled concept catalog; `shopify` is the live Storefront API catalog. */
export type CatalogSource = 'sample' | 'shopify';

export interface Collection {
  /** Shopify collection handle. */
  id: string;
  /** `gid://shopify/Collection/…` for live collections; null in the sample catalog. */
  shopifyId: string | null;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  image: string | null;
  /** Handles of the collection's products, in the collection's own order. */
  productIds: string[];
}

export interface Catalog {
  source: CatalogSource;
  products: Product[];
  collections: Collection[];
}
