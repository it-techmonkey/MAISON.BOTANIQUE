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
  /** `gid://shopify/ProductVariant/…` for live products; null in the sample catalog. */
  variantId: string | null;
  available: boolean;
}

export interface Product {
  /** Shopify product handle. */
  id: string;
  /** `gid://shopify/Product/…` for live products; null in the sample catalog. */
  shopifyId: string | null;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  /** Shopify product type and vendor, as reported to analytics. */
  productType: string;
  vendor: string;
  occasions: string[];
  image: string;
  imageAlt: string;
  /** Lowest size price, shown on cards. */
  price: number;
  currencyCode: string;
  bg: string;
  accent: string;
  description: string;
  descriptionAr: string;
  sizes: ProductSize[];
  available: boolean;
  /** Shown in the pinned hero gallery. */
  featured: boolean;
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
