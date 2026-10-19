// Server-side catalog loader. Shopify is the source of truth: every product
// published to the Headless channel and every collection is loaded (page by
// page) through the Storefront API. Storefront fields (card line, contents,
// occasions, flowers, format, stems, display order, hero) come from tags and
// `maison.*` metafields written by scripts/shopify-catalog-sync.mjs. A failed
// request throws, so Next.js keeps serving the last good page instead of
// replacing live prices.
//
// Without Shopify settings the bundled export (src/data/collection.json) is
// used, so the design preview keeps working.

import { slugify } from '@/lib/format';
import { roomOf } from '@/lib/catalog-groups';
import type { Catalog, Collection, Product, ProductCustomField, ProductFormat, ProductRoom, ProductSize } from '@/lib/types';
import { isShopifyConfigured, shopifyConfig, shopifyConfigError } from './config';
import { storefrontFetch } from './storefront';

export const CATALOG_CACHE_TAG = 'shopify-catalog';
// Matches `revalidate` on the store pages; the product webhook refreshes sooner.
const CATALOG_REVALIDATE_SECONDS = 300;
const FEATURED_TAG = 'featured';
const PLACEHOLDER_IMAGE = '/assets/placeholder.svg';
/** Storefront API page sizes. Products carry variants and metafields, so their pages stay smaller. */
const PRODUCTS_PER_PAGE = 100;
const COLLECTIONS_PER_PAGE = 50;
const COLLECTION_PRODUCTS_PER_PAGE = 250;
/** Safety stop so a misbehaving cursor can never loop forever. */
const MAX_PAGES = 50;
const ROOM_IDS: ProductRoom[] = ['roses', 'bouquets', 'vases', 'gifts', 'grand', 'beauty', 'hampers'];
const FORMATS: ProductFormat[] = ['bouquet', 'box', 'vase', 'gift'];

/** `maison.*` metafields the site reads (see scripts/shopify-catalog-sync.mjs). */
const METAFIELD_KEYS = [
  'card_line', 'card_line_ar', 'composition', 'composition_ar', 'stem_count', 'sort_order', 'hero_order',
  'catalog_number', 'room', 'feature', 'size_details', 'title_ar', 'description_ar', 'custom_fields',
  'answer_summary', 'answer_summary_ar', 'faq',
] as const;
type MetafieldKey = typeof METAFIELD_KEYS[number];

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
    featuredImage {
      url(transform: { maxWidth: 1200 })
      small: url(transform: { maxWidth: 480 })
      altText
    }
    variants(first: 50) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount }
        selectedOptions { name value }
      }
    }
    metafields(identifiers: [${METAFIELD_KEYS.map((key) => `{ namespace: "maison", key: "${key}" }`).join(', ')}]) { key value }
  }
`;

const PAGE_INFO = 'pageInfo { hasNextPage endCursor }';

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
  compareAtPrice: { amount: string } | null;
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
  featuredImage: { url: string; small: string; altText: string | null } | null;
  variants: { nodes: ShopifyVariant[] };
  metafields: Array<{ key: string; value: string } | null>;
}
interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: { url: string } | null;
  products: Connection<{ handle: string }>;
}

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

function fetchProducts() {
  return fetchAll(async (after) => (await storefrontFetch<{ products: Connection<ShopifyProduct> }>(
    PRODUCTS_QUERY,
    { first: PRODUCTS_PER_PAGE, after, country: shopifyConfig.country, language: 'EN' },
    cacheOptions,
  )).products);
}

async function fetchCollections(language: 'EN' | 'AR') {
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

const tagValues = (tags: string[], prefix: string) => tags
  .map((tag) => tag.trim().toLowerCase())
  .filter((tag) => tag.startsWith(prefix))
  .map((tag) => slugify(tag.slice(prefix.length)))
  .filter(Boolean);

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

const toNumber = (value: string | undefined) => {
  const number = Number(value);
  return value && Number.isFinite(number) ? number : null;
};

/** Size names arrive as "Signature – 51 roses" or "Signature"; Arabic and details come from `maison.size_details`. */
function mapSizes(variants: ShopifyVariant[], details: Array<{ name?: string; nameAr?: string; detail?: string; detailAr?: string }>): ProductSize[] {
  const usedIds = new Set<string>();
  return variants.map((variant, index) => {
    const value = variant.selectedOptions.length === 1 ? variant.selectedOptions[0].value : variant.title;
    const [label, ...rest] = (value && value !== 'Default Title' ? value : 'Standard').split(' – ');
    const info = details[index] ?? {};
    const name = info.name || label;
    let id = slugify(value === 'Default Title' ? 'standard' : value) || `option-${index + 1}`;
    if (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);
    const price = Number(variant.price.amount);
    const compare = variant.compareAtPrice ? Number(variant.compareAtPrice.amount) : null;
    return {
      id,
      name: variant.selectedOptions.length > 1 ? value : name,
      nameAr: info.nameAr || name,
      detail: info.detail || rest.join(' – '),
      detailAr: info.detailAr || info.detail || rest.join(' – '),
      price,
      compareAtPrice: compare && compare > price ? compare : null,
      variantId: variant.id,
      // A variant without a price is never sold (it would check out for free).
      available: variant.availableForSale && price > 0,
    };
  });
}

function customField(value: unknown): ProductCustomField | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== 'object') return null;
  const field = raw as { kind?: string; label?: string; name?: string };
  const label = field.label || field.name || '';
  const kind = field.kind === 'letter' || field.kind === 'age' ? field.kind
    : /letter|initial/i.test(label) ? 'letter' : /age/i.test(label) ? 'age' : 'text';
  return { kind, label };
}

/** Each unpriced product is reported once per server process, not on every page. */
const warnedUnpriced = new Set<string>();

function mapShopifyProduct(product: ShopifyProduct): Product | null {
  const variants = product.variants.nodes;
  if (!variants.length) return null;
  // Not shown until it has a price in Shopify.
  if (!variants.some((variant) => Number(variant.price.amount) > 0)) {
    if (!warnedUnpriced.has(product.handle)) {
      warnedUnpriced.add(product.handle);
      console.warn(`[catalog] Hiding "${product.handle}": no variant has a price.`);
    }
    return null;
  }
  const fields = Object.fromEntries(product.metafields.filter(Boolean).map((field) => [field!.key, field!.value])) as Partial<Record<MetafieldKey, string>>;
  const sizes = mapSizes(variants, parseJson(fields.size_details, []));
  const priced = sizes.filter((size) => size.price > 0);
  const cheapest = priced.reduce((low, size) => (size.price < low.price ? size : low), priced[0]);
  const tags = product.tags.map((tag) => tag.trim().toLowerCase());
  const roomId = ROOM_IDS.find((id) => id === fields.room) ?? 'bouquets';
  const room = roomOf(roomId);
  const format = tagValues(product.tags, 'format:').find((value): value is ProductFormat => FORMATS.includes(value as ProductFormat)) ?? 'bouquet';
  const heroOrder = toNumber(fields.hero_order);

  return {
    id: product.handle,
    shopifyId: product.id,
    no: toNumber(fields.catalog_number),
    name: product.title,
    nameAr: fields.title_ar || product.title,
    room: roomId,
    category: room.en,
    categoryAr: room.ar,
    line: fields.card_line ?? '',
    lineAr: fields.card_line_ar || fields.card_line || '',
    composition: parseJson(fields.composition, []),
    compositionAr: parseJson(fields.composition_ar, []),
    feature: fields.feature ?? '',
    stems: toNumber(fields.stem_count),
    flowers: tagValues(product.tags, 'flower:'),
    format,
    order: toNumber(fields.sort_order) ?? 10_000,
    custom: customField(parseJson(fields.custom_fields, null)),
    productType: product.productType,
    vendor: product.vendor,
    occasions: tagValues(product.tags, 'occasion:'),
    image: product.featuredImage?.url || PLACEHOLDER_IMAGE,
    imageSmall: product.featuredImage?.small || product.featuredImage?.url || PLACEHOLDER_IMAGE,
    imageAlt: product.featuredImage?.altText || product.title,
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    currencyCode: variants[0].price.currencyCode,
    bg: '#E9E1D5',
    accent: '#673C43',
    description: product.description,
    descriptionAr: fields.description_ar || product.description,
    sizes,
    available: product.availableForSale && sizes.some((size) => size.available),
    heroOrder,
    featured: Boolean(heroOrder) || tags.includes(FEATURED_TAG),
    answerSummary: fields.answer_summary ?? '',
    answerSummaryAr: fields.answer_summary_ar ?? '',
    faq: parseJson(fields.faq, []),
  };
}

/** Featured first by hero position, then everything by display order. */
function inDisplayOrder(products: Product[]) {
  const sorted = [...products].sort((a, b) => a.order - b.order);
  if (sorted.some((product) => product.featured)) return sorted;
  return sorted.map((product, index) => (index < 3 ? { ...product, featured: true, heroOrder: index + 1 } : product));
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

// ---------------------------------------------------------------------------
// Offline preview: the bundled export
// ---------------------------------------------------------------------------

interface ExportProduct {
  id: string; no: number; name: string; nameAr: string; room: string; price: number;
  sizes: Array<{ id: string; name: string; nameAr: string; detail: string; detailAr: string; add: number }>;
  line: string; lineAr: string; composition: string[]; compositionAr: string[]; feature: string;
  stems: number | null; occasions: string[]; flowers: string[]; format: string; order: number;
  custom: { kind?: string; label?: string } | null; image: string; imageSmall: string; alt: string;
}

async function exportCatalog(): Promise<Catalog> {
  const data = (await import('@/data/collection.json')).default as unknown as { hero: string[]; products: ExportProduct[] };
  const products = data.products.map((item): Product => {
    const room = roomOf(item.room);
    const heroIndex = data.hero.indexOf(item.id);
    return {
      id: item.id, shopifyId: null, no: item.no, name: item.name, nameAr: item.nameAr,
      room: room.id, category: room.en, categoryAr: room.ar,
      line: item.line, lineAr: item.lineAr, composition: item.composition, compositionAr: item.compositionAr,
      feature: item.feature, stems: item.stems, flowers: item.flowers,
      format: FORMATS.includes(item.format as ProductFormat) ? item.format as ProductFormat : 'bouquet',
      order: item.order, custom: customField(item.custom),
      productType: room.en, vendor: 'Maison Botanique', occasions: item.occasions,
      image: item.image, imageSmall: item.imageSmall, imageAlt: item.alt,
      price: item.price, compareAtPrice: null, currencyCode: 'AED', bg: '#E9E1D5', accent: '#673C43',
      description: item.composition.join(', '), descriptionAr: item.compositionAr.join('، '),
      sizes: item.sizes.map((size) => ({
        id: size.id, name: size.name, nameAr: size.nameAr, detail: size.detail, detailAr: size.detailAr,
        price: item.price + size.add, compareAtPrice: null, variantId: null, available: true,
      })),
      available: true, heroOrder: heroIndex >= 0 ? heroIndex + 1 : null, featured: heroIndex >= 0,
      answerSummary: '', answerSummaryAr: '', faq: [],
    };
  });
  return { source: 'sample', products: inDisplayOrder(products), collections: [] };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCatalog(): Promise<Catalog> {
  if (shopifyConfigError) throw new Error(`Shopify is misconfigured: ${shopifyConfigError}`);
  if (!isShopifyConfigured) return exportCatalog();

  // Arabic collection titles are optional: if the language is not published,
  // English titles are used rather than failing the whole page.
  const [english, englishCollections, arabicCollections] = await Promise.all([
    fetchProducts(),
    fetchCollections('EN'),
    fetchCollections('AR').catch((error) => {
      console.warn('[catalog] Arabic collection titles unavailable; using English.', error);
      return [] as ShopifyCollection[];
    }),
  ]);

  const products = inDisplayOrder(english
    .map(mapShopifyProduct)
    .filter((product): product is Product => product !== null));

  const known = new Set(products.map((product) => product.id));
  const arabicCollectionById = new Map(arabicCollections.map((collection) => [collection.id, collection]));
  const collections = englishCollections
    .map((collection) => mapShopifyCollection(collection, arabicCollectionById.get(collection.id), known))
    .filter((collection) => collection.productIds.length > 0);

  return { source: 'shopify', products, collections };
}
