// Server-side catalog loader. Without Shopify settings the bundled sample
// catalog is returned so the concept preview keeps working. With settings, the
// Storefront API is the only source of truth: every published product and
// every collection is loaded (page by page), and a failed request throws so
// Next.js keeps serving the last successfully rendered page instead of
// replacing live prices with sample ones.

import { sampleCatalog, type SampleProduct } from '@/data/sample-catalog';
import { slugify } from '@/lib/format';
import type { Catalog, Collection, Product, ProductSize } from '@/lib/types';
import { isShopifyConfigured, shopifyConfig, shopifyConfigError } from './config';
import { storefrontFetch } from './storefront';

export const CATALOG_CACHE_TAG = 'shopify-catalog';
// Matches `revalidate` on the store pages; the product webhook refreshes sooner.
const CATALOG_REVALIDATE_SECONDS = 300;
const FEATURED_TAG = 'featured';
const OCCASION_TAG_PREFIX = 'occasion:';
const PLACEHOLDER_IMAGE = '/assets/placeholder.svg';
/** Storefront API page sizes. Products carry variants, so their pages stay smaller. */
const PRODUCTS_PER_PAGE = 100;
const COLLECTIONS_PER_PAGE = 50;
const COLLECTION_PRODUCTS_PER_PAGE = 250;
/** Safety stop so a misbehaving cursor can never loop forever. */
const MAX_PAGES = 50;

const CATEGORY_AR: Record<string, string> = { bouquets: 'باقات', gifts: 'هدايا', preserved: 'زهور محفوظة' };
const CATEGORY_EN: Record<string, string> = { bouquets: 'Bouquets', gifts: 'Gifts', preserved: 'Preserved' };
// Used only when Shopify has no Arabic translation for an option value.
const SIZE_AR: Record<string, string> = {
  standard: 'قياسي', signature: 'أساسي', grand: 'كبير', single: 'وردة واحدة', duo: 'وردتان',
  small: 'صغير', medium: 'متوسط', large: 'كبير',
};

// ---------------------------------------------------------------------------
// Storefront API queries
// ---------------------------------------------------------------------------

const PRODUCT_FIELDS = `#graphql
  fragment CatalogProduct on Product {
    id
    handle
    title
    description
    productType
    vendor
    tags
    availableForSale
    featuredImage { url(transform: { maxWidth: 1800 }) altText }
    variants(first: 20) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
    backgroundColor: metafield(namespace: "custom", key: "background_color") { value }
    accentColor: metafield(namespace: "custom", key: "accent_color") { value }
  }
`;

const PAGE_INFO = 'pageInfo { hasNextPage endCursor }';

// Best sellers first, so "Our edit" leads with what people actually choose.
const PRODUCTS_QUERY = `#graphql
  query CatalogProducts($first: Int!, $after: String, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    products(first: $first, after: $after, sortKey: BEST_SELLING) {
      nodes { ...CatalogProduct }
      ${PAGE_INFO}
    }
  }
  ${PRODUCT_FIELDS}
`;

const COLLECTIONS_QUERY = `#graphql
  query CatalogCollections($first: Int!, $after: String, $productsFirst: Int!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    collections(first: $first, after: $after, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        description
        image { url(transform: { maxWidth: 1800 }) }
        products(first: $productsFirst, sortKey: COLLECTION_DEFAULT) { nodes { handle } ${PAGE_INFO} }
      }
      ${PAGE_INFO}
    }
  }
`;

// Only for collections holding more products than fit in one page.
const COLLECTION_PRODUCTS_QUERY = `#graphql
  query CollectionProducts($handle: String!, $first: Int!, $after: String, $country: CountryCode!)
  @inContext(country: $country) {
    collection(handle: $handle) {
      products(first: $first, after: $after, sortKey: COLLECTION_DEFAULT) { nodes { handle } ${PAGE_INFO} }
    }
  }
`;

interface PageInfo { hasNextPage: boolean; endCursor: string | null }
interface Connection<T> { nodes: T[]; pageInfo: PageInfo }
interface ShopifyMoney { amount: string; currencyCode: string }
interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  selectedOptions: Array<{ name: string; value: string }>;
}
interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  featuredImage: { url: string; altText: string | null } | null;
  variants: { nodes: ShopifyVariant[] };
  backgroundColor: { value: string } | null;
  accentColor: { value: string } | null;
}
interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: { url: string } | null;
  products: Connection<{ handle: string }>;
}

type Language = 'EN' | 'AR';
const cacheOptions = { next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] } };
const EMPTY_PAGE = { hasNextPage: false, endCursor: null };

/** Follows a cursor-paginated connection to the end. */
async function fetchAll<T>(loadPage: (after: string | null) => Promise<Connection<T>>, first: string | null = null): Promise<T[]> {
  const items: T[] = [];
  let after = first;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const connection = await loadPage(after);
    items.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) return items;
    after = connection.pageInfo.endCursor;
  }
  console.warn(`[catalog] Stopped after ${MAX_PAGES} pages; some items were not loaded.`);
  return items;
}

function fetchProducts(language: Language) {
  return fetchAll(async (after) => (await storefrontFetch<{ products: Connection<ShopifyProduct> }>(
    PRODUCTS_QUERY,
    { first: PRODUCTS_PER_PAGE, after, country: shopifyConfig.country, language },
    cacheOptions,
  )).products);
}

async function fetchCollections(language: Language) {
  const collections = await fetchAll(async (after) => (await storefrontFetch<{ collections: Connection<ShopifyCollection> }>(
    COLLECTIONS_QUERY,
    { first: COLLECTIONS_PER_PAGE, after, productsFirst: COLLECTION_PRODUCTS_PER_PAGE, country: shopifyConfig.country, language },
    cacheOptions,
  )).collections);
  // Arabic is only used for titles and descriptions.
  if (language === 'AR') return collections;

  // Finish the product lists of very large collections.
  return Promise.all(collections.map(async (collection) => {
    if (!collection.products.pageInfo.hasNextPage) return collection;
    const rest = await fetchAll(async (after) => {
      const data = await storefrontFetch<{ collection: { products: Connection<{ handle: string }> } | null }>(
        COLLECTION_PRODUCTS_QUERY,
        { handle: collection.handle, first: COLLECTION_PRODUCTS_PER_PAGE, after, country: shopifyConfig.country },
        cacheOptions,
      );
      return data.collection?.products ?? { nodes: [], pageInfo: EMPTY_PAGE };
    }, collection.products.pageInfo.endCursor);
    return { ...collection, products: { nodes: [...collection.products.nodes, ...rest], pageInfo: EMPTY_PAGE } };
  }));
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function categoryId(productType: string) {
  const value = productType.toLowerCase();
  if (value.includes('preserv')) return 'preserved';
  if (value.includes('gift')) return 'gifts';
  return 'bouquets';
}

function occasionsFromTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.startsWith(OCCASION_TAG_PREFIX))
    .map((tag) => slugify(tag.slice(OCCASION_TAG_PREFIX.length)))
    .filter(Boolean);
}

function hexColor(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim() : fallback;
}

/**
 * The option a shopper chooses ("Signature", "Grand", …). Products with more
 * than one option use the combined variant title ("Grand / Blush").
 */
function sizeLabel(variant: ShopifyVariant) {
  const value = variant.selectedOptions.length === 1 ? variant.selectedOptions[0].value : variant.title;
  return !value || value === 'Default Title' ? 'Standard' : value;
}

function mapSizes(variants: ShopifyVariant[], arabicVariants: Map<string, ShopifyVariant>): ProductSize[] {
  const usedIds = new Set<string>();
  return variants.map((variant, index) => {
    const name = sizeLabel(variant);
    let id = slugify(name) || `option-${index + 1}`;
    if (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);

    const arabicVariant = arabicVariants.get(variant.id);
    const translated = arabicVariant ? sizeLabel(arabicVariant) : name;
    const nameAr = translated !== name ? translated : SIZE_AR[slugify(name)] ?? name;
    return {
      id,
      name,
      nameAr,
      price: Number(variant.price.amount),
      variantId: variant.id,
      // A variant without a price is never sold (it would check out for free).
      available: variant.availableForSale && Number(variant.price.amount) > 0,
    };
  });
}

function mapShopifyProduct(product: ShopifyProduct, arabic: ShopifyProduct | undefined): Product | null {
  const variants = product.variants.nodes;
  if (!variants.length) return null;
  // Not shown until it has a price in Shopify.
  if (!variants.some((variant) => Number(variant.price.amount) > 0)) {
    console.warn(`[catalog] Hiding "${product.handle}": no variant has a price.`);
    return null;
  }
  const arabicVariants = new Map((arabic?.variants.nodes ?? []).map((variant) => [variant.id, variant]));
  const sizes = mapSizes(variants, arabicVariants);
  const category = categoryId(product.productType);
  const tags = product.tags.map((tag) => tag.trim().toLowerCase());

  return {
    id: product.handle,
    shopifyId: product.id,
    name: product.title,
    nameAr: arabic?.title || product.title,
    category: CATEGORY_EN[category],
    categoryAr: CATEGORY_AR[category],
    productType: product.productType,
    vendor: product.vendor,
    occasions: occasionsFromTags(product.tags),
    image: product.featuredImage?.url || PLACEHOLDER_IMAGE,
    imageAlt: product.featuredImage?.altText || product.title,
    price: Math.min(...sizes.filter((size) => size.price > 0).map((size) => size.price)),
    currencyCode: variants[0].price.currencyCode,
    bg: hexColor(product.backgroundColor?.value, '#E9E1D5'),
    accent: hexColor(product.accentColor?.value, '#673C43'),
    description: product.description,
    descriptionAr: arabic?.description || product.description,
    sizes,
    available: product.availableForSale && sizes.some((size) => size.available),
    featured: tags.includes(FEATURED_TAG),
  };
}

function mapSampleProduct(sample: SampleProduct): Product {
  const sizes = sample.sizes.map((size) => ({
    id: slugify(size.name),
    name: size.name,
    nameAr: size.nameAr,
    price: size.price,
    variantId: null,
    available: true,
  }));
  const category = categoryId(sample.productType);
  return {
    id: sample.handle,
    shopifyId: null,
    name: sample.title,
    nameAr: sample.titleAr,
    category: CATEGORY_EN[category],
    categoryAr: CATEGORY_AR[category],
    productType: sample.productType,
    vendor: 'Maison Botanique',
    occasions: sample.occasions,
    image: sample.image,
    imageAlt: sample.title,
    price: Math.min(...sizes.map((size) => size.price)),
    currencyCode: 'AED',
    bg: sample.backgroundColor,
    accent: sample.accentColor,
    description: sample.description,
    descriptionAr: sample.descriptionAr,
    sizes,
    available: true,
    featured: sample.featured,
  };
}

function withFeaturedFallback(products: Product[]) {
  if (products.some((product) => product.featured)) return products;
  return products.map((product, index) => (index < 3 ? { ...product, featured: true } : product));
}

function mapShopifyCollection(collection: ShopifyCollection, arabic: ShopifyCollection | undefined, known: Set<string>): Collection {
  return {
    id: collection.handle,
    shopifyId: collection.id,
    title: collection.title,
    titleAr: arabic?.title || collection.title,
    description: collection.description,
    descriptionAr: arabic?.description || collection.description,
    image: collection.image?.url ?? null,
    // Products not published to this storefront are left out.
    productIds: collection.products.nodes.map((product) => product.handle).filter((handle) => known.has(handle)),
  };
}

/** The sample catalog has no Shopify collections, so its product types stand in for them. */
function sampleCollections(products: Product[]): Collection[] {
  return Object.keys(CATEGORY_EN).map((id) => ({
    id,
    shopifyId: null,
    title: CATEGORY_EN[id],
    titleAr: CATEGORY_AR[id],
    description: '',
    descriptionAr: '',
    image: null,
    productIds: products.filter((product) => categoryId(product.category) === id).map((product) => product.id),
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCatalog(): Promise<Catalog> {
  if (shopifyConfigError) throw new Error(`Shopify is misconfigured: ${shopifyConfigError}`);
  if (!isShopifyConfigured) {
    const products = sampleCatalog.map(mapSampleProduct);
    return { source: 'sample', products, collections: sampleCollections(products) };
  }

  // Arabic text is optional: if the language is not published for the market,
  // English copy is used rather than failing the whole page.
  const arabicOrNothing = <T,>(request: Promise<T[]>) => request.catch((error) => {
    console.warn('[catalog] Arabic content unavailable; using English text.', error);
    return [] as T[];
  });
  const [english, arabic, englishCollections, arabicCollections] = await Promise.all([
    fetchProducts('EN'),
    arabicOrNothing(fetchProducts('AR')),
    fetchCollections('EN'),
    arabicOrNothing(fetchCollections('AR')),
  ]);

  const arabicById = new Map(arabic.map((product) => [product.id, product]));
  const products = withFeaturedFallback(english
    .map((product) => mapShopifyProduct(product, arabicById.get(product.id)))
    .filter((product): product is Product => product !== null));

  const known = new Set(products.map((product) => product.id));
  const arabicCollectionById = new Map(arabicCollections.map((collection) => [collection.id, collection]));
  const collections = englishCollections
    .map((collection) => mapShopifyCollection(collection, arabicCollectionById.get(collection.id), known))
    .filter((collection) => collection.productIds.length > 0);

  return { source: 'shopify', products, collections };
}
