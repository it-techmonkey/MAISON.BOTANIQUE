#!/usr/bin/env node
/**
 * Pushes the Maison catalog into Shopify, which is then the website's only
 * source of products. Follows catalog/shopify-export/DEVELOPER_HANDOFF.md, with
 * the owner's decisions of 2026-10-19: products are ACTIVE and published to
 * the Headless channel, and prices come from catalog/shopify-export/variant-prices.csv
 * (scripts/match_prices.py), with strikethrough (compare-at) prices.
 *
 *   npm run shopify:catalog -- --dry-run     # validate and show the first product
 *   npm run shopify:catalog -- --limit 3     # first three products
 *   npm run shopify:catalog                  # everything
 *   npm run shopify:catalog -- --images      # re-upload every image
 *
 * Inputs
 *   catalog/shopify-export/shopify-push.json  productSet inputs, collections, metafield definitions
 *   catalog/shopify-export/images/            product images
 *   catalog/shopify-export/variant-prices.csv prices per SKU
 *   src/data/collection.json                  storefront fields (card line, occasions, flowers,
 *                                             format, stems, display order, hero) built by
 *                                             scripts/build_collection.py
 *
 * Storefront fields are written as tags (`occasion:*`, `flower:*`, `format:*`, `featured`)
 * and `maison.*` metafields readable by the Storefront API. Products in the store
 * that are not in the catalog are ARCHIVED (never deleted).
 *
 * Re-running is safe: products and collections are matched by handle and updated in place.
 * Uses the seed app's Admin credentials (scripts/lib/admin-auth.mjs).
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOPIFY_API_VERSION as apiVersion } from '../src/lib/shopify/config.ts';
import { domain, getAdminAccessToken } from './lib/admin-auth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT_DIR = path.join(ROOT, 'catalog', 'shopify-export');
const REPORT_FILE = path.join(EXPORT_DIR, 'sync-report.json');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const REUPLOAD_IMAGES = argv.includes('--images');
const limitIndex = argv.indexOf('--limit');
const LIMIT = limitIndex >= 0 ? Number(argv[limitIndex + 1]) : Infinity;
const HEADLESS_PUBLICATION = /headless/i;

// No competitor names in the store (export README rule 7).
const COMPETITOR_PHRASES = [/,?\s*exclusively available at UAE Flowers/gi, /\bUAE ?Flowers\b/gi, /\bGifty ?Gram\b/gi];
const clean = (text) => (typeof text === 'string' ? COMPETITOR_PHRASES.reduce((value, pattern) => value.replace(pattern, ''), text) : text);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message) => { console.error(`\n✖ ${message}\n`); process.exit(1); };

// ---------------------------------------------------------------------------
// Storefront fields
// ---------------------------------------------------------------------------

/** Metafields the website reads (Storefront API access PUBLIC_READ). */
const STOREFRONT_DEFINITIONS = [
  { key: 'card_line', type: 'single_line_text_field', name: 'Card line (EN)', description: 'Short line under the name on product cards.' },
  { key: 'card_line_ar', type: 'single_line_text_field', name: 'Card line (AR)', description: 'Arabic card line.' },
  { key: 'composition', type: 'list.single_line_text_field', name: "What's included (EN)", description: 'One item per line, shown in the quick-add sheet.' },
  { key: 'composition_ar', type: 'list.single_line_text_field', name: "What's included (AR)", description: 'Arabic list of contents.' },
  { key: 'stem_count', type: 'number_integer', name: 'Stem count', description: 'Flowers in the pictured size; used by the "number of stems" filter.' },
  { key: 'sort_order', type: 'number_integer', name: 'Display order', description: 'Position in the Featured sort (lower first).' },
  { key: 'hero_order', type: 'number_integer', name: 'Hero position', description: 'Position in the home page hero (1–3). Tag the product "featured" too.' },
  { key: 'catalog_number', type: 'number_integer', name: 'Catalog number', description: 'Shown as N° on the product sheet.' },
  { key: 'room', type: 'single_line_text_field', name: 'Room', description: 'roses, bouquets, vases, gifts, grand, beauty or hampers.' },
  { key: 'feature', type: 'multi_line_text_field', name: 'Feature note', description: 'Optional editorial note shown with the product.' },
  { key: 'size_details', type: 'json', name: 'Size details', description: 'Per size, in variant order: {name, nameAr, detail, detailAr}.' },
  // The website reads Arabic from these, so it works before Arabic is published as a store language.
  { key: 'title_ar', type: 'single_line_text_field', name: 'Title (AR)', description: 'Arabic product name shown on the website.' },
  { key: 'description_ar', type: 'multi_line_text_field', name: 'Description (AR)', description: 'Arabic description shown on the website (plain text).' },
];
/** Their definitions: these four are shown on the site, the rest stay internal. */
const PUBLIC_HANDOFF_KEYS = new Set(['answer_summary', 'answer_summary_ar', 'faq', 'size_note', 'custom_fields']);
const INTERNAL_DEFINITIONS = [
  { key: 'image_source', type: 'single_line_text_field', name: 'Image source files', description: 'Image files last uploaded by the catalog sync. Internal only.' },
];

const plainText = (html) => (html ?? '')
  .replace(/<\/(p|li|h\d)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .split('\n').map((line) => line.trim()).filter(Boolean).join('\n');

function storefrontFields(item, heroOrder, arabic) {
  const metafield = (key, type, value) => (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)
    ? [] : [{ namespace: 'maison', key, type, value: typeof value === 'string' ? value : JSON.stringify(value) }]);
  const tags = [
    ...item.occasions.map((id) => `occasion:${id}`),
    ...item.flowers.map((id) => `flower:${id}`),
    ...(item.format ? [`format:${item.format}`] : []),
    ...(heroOrder ? ['featured'] : []),
  ];
  const metafields = [
    ...metafield('card_line', 'single_line_text_field', item.line),
    ...metafield('card_line_ar', 'single_line_text_field', item.lineAr),
    ...metafield('composition', 'list.single_line_text_field', item.composition),
    ...metafield('composition_ar', 'list.single_line_text_field', item.compositionAr),
    ...metafield('stem_count', 'number_integer', item.stems == null ? null : String(item.stems)),
    ...metafield('sort_order', 'number_integer', String(item.order)),
    ...metafield('hero_order', 'number_integer', heroOrder ? String(heroOrder) : null),
    ...metafield('catalog_number', 'number_integer', item.no == null ? null : String(item.no)),
    ...metafield('room', 'single_line_text_field', item.room),
    ...metafield('feature', 'multi_line_text_field', item.feature),
    ...metafield('size_details', 'json', item.sizes.map(({ name, nameAr, detail, detailAr }) => ({ name, nameAr, detail, detailAr }))),
    ...metafield('title_ar', 'single_line_text_field', clean(arabic?.title) || item.nameAr),
    ...metafield('description_ar', 'multi_line_text_field', clean(plainText(arabic?.body_html))),
  ];
  return { tags, metafields };
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

let adminToken = null;

async function admin(query, variables = {}, attempt = 0) {
  const response = await fetch(`https://${domain}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    body: JSON.stringify({ query, variables }),
  });
  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    await sleep(1000 * 2 ** attempt);
    return admin(query, variables, attempt + 1);
  }
  if (!response.ok) throw new Error(`Admin API ${response.status}: ${await response.text()}`);
  const json = await response.json();
  if (json.errors?.some((error) => error.extensions?.code === 'THROTTLED') && attempt < 6) {
    await sleep(2000 * 2 ** attempt);
    return admin(query, variables, attempt + 1);
  }
  if (json.errors?.length) throw new Error(json.errors.map((error) => error.message).join('; '));
  const throttle = json.extensions?.cost?.throttleStatus;
  if (throttle && throttle.currentlyAvailable < 400) await sleep(1500);
  return json.data;
}

function checkUserErrors(result, label, ignore = /$^/) {
  const errors = (result?.userErrors ?? []).filter((error) => !ignore.test(`${error.code ?? ''} ${error.message}`));
  if (errors.length) throw new Error(`${label}: ${errors.map((error) => `${error.field?.join('.') ?? ''} ${error.message}`).join('; ')}`);
  return result;
}

async function ensureDefinition({ key, type, name, description }, storefront) {
  const definition = { ownerType: 'PRODUCT', namespace: 'maison', key, type, name, description, access: { storefront } };
  const created = await admin(`#graphql
    mutation Create($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { code message field } }
    }`, { definition });
  const errors = created.metafieldDefinitionCreate.userErrors;
  if (!errors.length) return 'created';
  if (!errors.some((error) => error.code === 'TAKEN')) throw new Error(`definition ${key}: ${errors.map((error) => error.message).join('; ')}`);
  const updated = await admin(`#graphql
    mutation Update($definition: MetafieldDefinitionUpdateInput!) {
      metafieldDefinitionUpdate(definition: $definition) { updatedDefinition { id } userErrors { code message field } }
    }`, { definition: { ownerType: 'PRODUCT', namespace: 'maison', key, name, description, access: { storefront } } });
  checkUserErrors(updated.metafieldDefinitionUpdate, `definition ${key}`);
  return 'updated';
}

async function headlessPublicationId() {
  const data = await admin(`#graphql
    query { publications(first: 25) { nodes { id name } } }`);
  const publication = data.publications.nodes.find((node) => HEADLESS_PUBLICATION.test(node.name));
  if (!publication) throw new Error(`No Headless publication found (have: ${data.publications.nodes.map((node) => node.name).join(', ')})`);
  return publication.id;
}

async function uploadImage(relativePath) {
  const filePath = path.join(EXPORT_DIR, relativePath);
  const bytes = await readFile(filePath);
  const filename = path.basename(filePath);
  const mimeType = filename.endsWith('.webp') ? 'image/webp' : filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const staged = await admin(`#graphql
    mutation Stage($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`, { input: [{ filename, mimeType, httpMethod: 'POST', resource: 'IMAGE', fileSize: String(bytes.length) }] });
  const [target] = checkUserErrors(staged.stagedUploadsCreate, `stage ${filename}`).stagedTargets;
  const form = new FormData();
  target.parameters.forEach(({ name, value }) => form.append(name, value));
  form.append('file', new Blob([bytes], { type: mimeType }), filename);
  const upload = await fetch(target.url, { method: 'POST', body: form });
  if (!upload.ok) throw new Error(`Image upload failed for ${filename}: ${upload.status}`);
  return target.resourceUrl;
}

async function findProduct(handle) {
  const data = await admin(`#graphql
    query Find($handle: String!) {
      productByIdentifier(identifier: { handle: $handle }) {
        id
        mediaCount { count }
        imageSource: metafield(namespace: "maison", key: "image_source") { value }
      }
    }`, { handle });
  return data.productByIdentifier;
}

/** Arabic must exist as a shop language for translations; it stays unpublished until reviewed. */
async function ensureArabicLocale() {
  const data = await admin(`#graphql
    query { shopLocales { locale published } }`);
  const arabic = data.shopLocales.find((item) => item.locale === 'ar');
  if (arabic) return arabic.published ? 'published' : 'enabled';
  const enabled = await admin(`#graphql
    mutation { shopLocaleEnable(locale: "ar") { shopLocale { locale published } userErrors { field message } } }`);
  checkUserErrors(enabled.shopLocaleEnable, 'enable Arabic');
  return 'enabled now (unpublished)';
}

async function registerArabic(productId, arabic) {
  if (!arabic) return 0;
  const wanted = { title: clean(arabic.title), body_html: clean(arabic.body_html), meta_title: clean(arabic.seo_title), meta_description: clean(arabic.seo_description) };
  const data = await admin(`#graphql
    query Digests($id: ID!) { translatableResource(resourceId: $id) { translatableContent { key digest } } }`, { id: productId });
  const translations = data.translatableResource.translatableContent
    .filter((content) => wanted[content.key])
    .map((content) => ({ locale: 'ar', key: content.key, value: wanted[content.key], translatableContentDigest: content.digest }));
  if (!translations.length) return 0;
  const saved = await admin(`#graphql
    mutation Translate($id: ID!, $translations: [TranslationInput!]!) {
      translationsRegister(resourceId: $id, translations: $translations) { userErrors { field message } }
    }`, { id: productId, translations });
  checkUserErrors(saved.translationsRegister, 'Arabic translation');
  return translations.length;
}

async function publish(id, publicationId) {
  const data = await admin(`#graphql
    mutation Publish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { field message } }
    }`, { id, input: [{ publicationId }] });
  checkUserErrors(data.publishablePublish, 'publish', /already/i);
}

// ---------------------------------------------------------------------------
// Product input
// ---------------------------------------------------------------------------

function productInput(entry, prices, site) {
  const input = structuredClone(entry.input);
  input.title = clean(input.title);
  input.descriptionHtml = clean(input.descriptionHtml) ?? '';
  if (input.seo) input.seo = { title: clean(input.seo.title), description: clean(input.seo.description) };
  input.status = 'ACTIVE';
  input.tags = [...new Set([...(input.tags ?? []), ...site.tags])];
  input.metafields = [
    ...(input.metafields ?? []).map((field) => ({ ...field, value: String(field.value) })),
    ...site.metafields,
  ];
  for (const variant of input.variants) {
    const price = prices.get(variant.sku);
    if (!price) throw new Error(`no price for SKU ${variant.sku}`);
    variant.price = price.price;
    variant.compareAtPrice = price.compare_at_price || null;
    if (variant.inventoryItem) variant.inventoryItem.sku = variant.sku;
    else variant.inventoryItem = { sku: variant.sku, tracked: false, requiresShipping: true };
    delete variant.sku;
  }
  return input;
}

const imagePaths = (input) => [...new Set([
  ...(input.files ?? []).map((file) => file.originalSource),
  ...input.variants.flatMap((variant) => (variant.file ? [variant.file.originalSource] : [])),
])];

async function syncProduct(entry, prices, site, publicationId) {
  const existing = await findProduct(entry.handle);
  const input = productInput(entry, prices, site);
  const sources = imagePaths(input);
  const signature = sources.map((source) => path.basename(source)).join(',');
  const needsImages = REUPLOAD_IMAGES || !existing || !existing.mediaCount?.count || existing.imageSource?.value !== signature;

  if (needsImages) {
    const uploaded = new Map();
    for (const source of sources) uploaded.set(source, await uploadImage(source));
    input.files = (input.files ?? []).map((file) => ({ ...file, alt: clean(file.alt), originalSource: uploaded.get(file.originalSource) }));
    for (const variant of input.variants) {
      if (variant.file) variant.file = { ...variant.file, alt: clean(variant.file.alt), originalSource: uploaded.get(variant.file.originalSource) };
    }
    input.metafields.push({ namespace: 'maison', key: 'image_source', type: 'single_line_text_field', value: signature });
  } else {
    // Media already match the catalog: leave them untouched.
    delete input.files;
    for (const variant of input.variants) delete variant.file;
  }

  const data = await admin(`#graphql
    mutation Upsert($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
      productSet(synchronous: true, identifier: $identifier, input: $input) {
        product { id }
        userErrors { field message code }
      }
    }`, { identifier: { handle: entry.handle }, input });
  const { product } = checkUserErrors(data.productSet, `product ${entry.handle}`);
  await publish(product.id, publicationId);
  const translated = await registerArabic(product.id, entry.translations?.ar);
  return { id: product.id, created: !existing, images: needsImages ? sources.length : 0, translated };
}

async function syncCollection(collection, productIds, publicationId) {
  const found = await admin(`#graphql
    query Collection($handle: String!) {
      collectionByIdentifier(identifier: { handle: $handle }) { id products(first: 250) { nodes { id } } }
    }`, { handle: collection.handle });
  let id = found.collectionByIdentifier?.id;
  if (!id) {
    const created = await admin(`#graphql
      mutation Create($input: CollectionInput!) {
        collectionCreate(input: $input) { collection { id } userErrors { field message } }
      }`, { input: { title: collection.title, handle: collection.handle, sortOrder: 'MANUAL' } });
    id = checkUserErrors(created.collectionCreate, `collection ${collection.title}`).collection.id;
  }
  const current = new Set((found.collectionByIdentifier?.products.nodes ?? []).map((node) => node.id));
  const wanted = new Set(productIds);
  const toAdd = productIds.filter((productId) => !current.has(productId));
  const toRemove = [...current].filter((productId) => !wanted.has(productId));
  for (let index = 0; index < toAdd.length; index += 250) {
    const added = await admin(`#graphql
      mutation Add($id: ID!, $productIds: [ID!]!) { collectionAddProducts(id: $id, productIds: $productIds) { userErrors { field message } } }`,
    { id, productIds: toAdd.slice(index, index + 250) });
    checkUserErrors(added.collectionAddProducts, `add to ${collection.title}`, /already/i);
  }
  if (toRemove.length) {
    const removed = await admin(`#graphql
      mutation Remove($id: ID!, $productIds: [ID!]!) { collectionRemoveProducts(id: $id, productIds: $productIds) { userErrors { field message } } }`,
    { id, productIds: toRemove });
    checkUserErrors(removed.collectionRemoveProducts, `remove from ${collection.title}`);
  }
  await publish(id, publicationId);
  return { id, added: toAdd.length, removed: toRemove.length, created: !found.collectionByIdentifier };
}

async function archiveOthers(keep) {
  const archived = [];
  let after = null;
  do {
    const data = await admin(`#graphql
      query Products($after: String) {
        products(first: 250, after: $after, query: "-status:archived") { nodes { id handle } pageInfo { hasNextPage endCursor } }
      }`, { after });
    for (const product of data.products.nodes) {
      if (keep.has(product.handle)) continue;
      const result = await admin(`#graphql
        mutation Archive($input: ProductInput!) { productUpdate(input: $input) { userErrors { field message } } }`,
      { input: { id: product.id, status: 'ARCHIVED' } });
      checkUserErrors(result.productUpdate, `archive ${product.handle}`);
      archived.push(product.handle);
    }
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return archived;
}

// ---------------------------------------------------------------------------

const push = JSON.parse(await readFile(path.join(EXPORT_DIR, 'shopify-push.json'), 'utf8'));
const collectionData = JSON.parse(await readFile(path.join(ROOT, 'src', 'data', 'collection.json'), 'utf8'));
const priceRows = (await readFile(path.join(EXPORT_DIR, 'variant-prices.csv'), 'utf8')).trim().split(/\r?\n/);
const header = priceRows.shift().split(',');
const parseCsvLine = (line) => {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted && char === '"' && line[index + 1] === '"') { cell += '"'; index += 1; } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(cell); cell = ''; } else cell += char;
  }
  cells.push(cell);
  return Object.fromEntries(header.map((name, index) => [name, cells[index] ?? '']));
};
const prices = new Map(priceRows.map(parseCsvLine).map((row) => [row.sku, row]));
const siteByHandle = new Map(collectionData.products.map((item) => [item.id, item]));
const heroOrder = new Map(collectionData.hero.map((handle, index) => [handle, index + 1]));

const entries = push.products.slice(0, LIMIT);
const problems = [];
for (const entry of push.products) {
  if (!siteByHandle.has(entry.handle)) problems.push(`${entry.handle}: missing from src/data/collection.json`);
  for (const variant of entry.input.variants) if (!prices.has(variant.sku)) problems.push(`${entry.handle}: no price for ${variant.sku}`);
}
if (problems.length) fail(`The catalog has problems:\n  ${problems.slice(0, 20).join('\n  ')}`);

console.log(`${push.products.length} products in the catalog; syncing ${entries.length} to ${domain} (Admin API ${apiVersion}) as ACTIVE on Headless.`);

if (DRY_RUN) {
  const first = entries[0];
  const input = productInput(first, prices, storefrontFields(siteByHandle.get(first.handle), heroOrder.get(first.handle), first.translations?.ar));
  console.log('\nDry run. First product as sent to Shopify (before image upload):\n', JSON.stringify(input, null, 2).slice(0, 3000));
  process.exit(0);
}

adminToken = await getAdminAccessToken().catch((error) => fail(error.message));
const report = { startedAt: new Date().toISOString(), store: domain, definitions: {}, products: {}, collections: {}, archived: [], errors: [] };

for (const definition of push.master_data.metafield_definitions) {
  report.definitions[definition.key] = await ensureDefinition(definition, PUBLIC_HANDOFF_KEYS.has(definition.key) ? 'PUBLIC_READ' : 'NONE');
}
for (const definition of STOREFRONT_DEFINITIONS) report.definitions[definition.key] = await ensureDefinition(definition, 'PUBLIC_READ');
for (const definition of INTERNAL_DEFINITIONS) report.definitions[definition.key] = await ensureDefinition(definition, 'NONE');
console.log(`✓ Metafield definitions: ${Object.keys(report.definitions).length}`);

console.log(`✓ Arabic store language: ${await ensureArabicLocale()}`);
const publicationId = await headlessPublicationId();
const idsByHandle = new Map();
let done = 0;
for (const entry of entries) {
  try {
    const site = storefrontFields(siteByHandle.get(entry.handle), heroOrder.get(entry.handle), entry.translations?.ar);
    const result = await syncProduct(entry, prices, site, publicationId);
    report.products[entry.handle] = result;
    idsByHandle.set(entry.handle, result.id);
    done += 1;
    console.log(`✓ ${String(done).padStart(3)}/${entries.length} ${result.created ? 'Created' : 'Updated'} ${entry.input.title}${result.images ? ` (+${result.images} image${result.images > 1 ? 's' : ''})` : ''}`);
  } catch (error) {
    report.errors.push({ handle: entry.handle, message: error.message });
    console.error(`✖ ${entry.handle}: ${error.message}`);
  }
  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
}

if (LIMIT === Infinity && !report.errors.length) {
  for (const collection of push.master_data.collections) {
    try {
      const ids = collection.product_handles.map((handle) => idsByHandle.get(handle)).filter(Boolean);
      const result = await syncCollection(collection, ids, publicationId);
      report.collections[collection.handle] = result;
      console.log(`✓ Collection "${collection.title}": ${ids.length} products (+${result.added} / −${result.removed})${result.created ? ', created' : ''}`);
    } catch (error) {
      report.errors.push({ collection: collection.handle, message: error.message });
      console.error(`✖ collection ${collection.handle}: ${error.message}`);
    }
  }
  report.archived = await archiveOthers(new Set(push.products.map((entry) => entry.handle)));
  if (report.archived.length) console.log(`✓ Archived ${report.archived.length} products not in the catalog: ${report.archived.join(', ')}`);
} else if (LIMIT !== Infinity) {
  console.log('Partial run: collections and archiving are skipped.');
}

report.finishedAt = new Date().toISOString();
await writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
console.log(`\n${done}/${entries.length} products synced, ${report.errors.length} error(s). Report: catalog/shopify-export/sync-report.json`);
if (report.errors.length) process.exitCode = 1;
