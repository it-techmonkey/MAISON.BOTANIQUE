#!/usr/bin/env node
/**
 * Imports the product export in shopify-export/ into the store.
 *
 *   npm run shopify:import -- --dry-run     # validate and transform only
 *   npm run shopify:import -- --limit 3     # first three products
 *   npm run shopify:import                  # everything
 *   npm run shopify:import -- --images      # re-upload images for existing products
 *
 * Follows shopify-export/README.md: every product is a DRAFT and is not
 * published to any sales channel, prices stay the export's placeholders
 * (missing prices become 0.00 and keep the `no_price_available` flag), and
 * review flags become `review:*` tags so they can be filtered in the admin.
 * Collections are created as manual collections, also unpublished.
 *
 * Re-running is safe: products are matched by handle and updated in place.
 * Uses the seed app's Admin credentials (scripts/lib/admin-auth.mjs).
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOPIFY_API_VERSION as apiVersion } from '../src/lib/shopify/config.ts';
import { domain, getAdminAccessToken } from './lib/admin-auth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT_DIR = path.join(ROOT, 'shopify-export');
const REPORT_FILE = path.join(EXPORT_DIR, 'import-report.json');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const REUPLOAD_IMAGES = argv.includes('--images');
const limitIndex = argv.indexOf('--limit');
const LIMIT = limitIndex >= 0 ? Number(argv[limitIndex + 1]) : Infinity;

// Rule 7 of the export README: no competitor names in the store.
const COMPETITOR_PHRASES = [/,?\s*exclusively available at UAE Flowers/gi, /\bUAE ?Flowers\b/gi, /\bGifty ?Gram\b/gi];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message) => { console.error(`\n✖ ${message}\n`); process.exit(1); };

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

const slugify = (value) => value.normalize('NFKD').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function clean(text) {
  if (!text) return text;
  return COMPETITOR_PHRASES.reduce((value, pattern) => value.replace(pattern, ''), text);
}

function toProductSetInput(product) {
  const [option] = product.options;
  const flagTags = product.review_flags.map((flag) => `review:${flag}`);
  return {
    title: clean(product.title),
    handle: product.handle,
    descriptionHtml: clean(product.body_html) ?? '',
    productType: product.product_type,
    vendor: product.vendor || 'Maison Botanique',
    status: 'DRAFT',
    tags: [...new Set([...product.tags, ...flagTags])],
    seo: { title: clean(product.seo?.title) ?? undefined, description: clean(product.seo?.description) ?? undefined },
    productOptions: [{ name: option.name, position: 1, values: option.values.map((name) => ({ name })) }],
    variants: product.variants.map((variant) => ({
      optionValues: [{ optionName: option.name, name: variant.option1 }],
      price: variant.price ?? '0.00',
      ...(variant.compare_at_price ? { compareAtPrice: variant.compare_at_price } : {}),
      ...(variant.barcode ? { barcode: variant.barcode } : {}),
      taxable: variant.taxable !== false,
      inventoryPolicy: variant.inventory_policy === 'continue' ? 'CONTINUE' : 'DENY',
      // Made to order: stock is not counted unless the export says otherwise.
      inventoryItem: { sku: variant.sku, tracked: Boolean(variant.inventory_management), requiresShipping: variant.requires_shipping !== false },
    })),
    metafields: product.metafields.map(({ namespace, key, type, value }) => ({ namespace, key, type, value: String(value) })),
  };
}

function validate(products) {
  const problems = [];
  const handles = new Set();
  for (const product of products) {
    if (handles.has(product.handle)) problems.push(`duplicate handle ${product.handle}`);
    handles.add(product.handle);
    if (product.options.length !== 1) problems.push(`${product.handle}: expected one option`);
    const values = new Set(product.options[0].values);
    for (const variant of product.variants) {
      if (!values.has(variant.option1)) problems.push(`${product.handle}: variant "${variant.option1}" not in option values`);
    }
    if (product.variants.length > 2048) problems.push(`${product.handle}: more than 2048 variants`);
  }
  return problems;
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
  // Stay well inside the cost budget on long runs.
  const throttle = json.extensions?.cost?.throttleStatus;
  if (throttle && throttle.currentlyAvailable < 400) await sleep(1500);
  return json.data;
}

function checkUserErrors(result, label) {
  const errors = result?.userErrors ?? [];
  if (errors.length) throw new Error(`${label}: ${errors.map((error) => `${error.field?.join('.') ?? ''} ${error.message}`).join('; ')}`);
  return result;
}

async function uploadImage(image) {
  const filePath = path.join(EXPORT_DIR, image.filename);
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
  return { originalSource: target.resourceUrl, contentType: 'IMAGE', alt: clean(image.alt) || undefined };
}

async function findProduct(handle) {
  const data = await admin(`#graphql
    query Find($handle: String!) { productByIdentifier(identifier: { handle: $handle }) { id mediaCount { count } } }`,
  { handle });
  return data.productByIdentifier;
}

async function upsertProduct(product) {
  const existing = await findProduct(product.handle);
  const input = toProductSetInput(product);
  const needsImages = product.images.length > 0 && (REUPLOAD_IMAGES || !existing || !existing.mediaCount?.count);
  if (needsImages) {
    input.files = [];
    for (const image of [...product.images].sort((a, b) => a.position - b.position)) input.files.push(await uploadImage(image));
  }
  const data = await admin(`#graphql
    mutation Upsert($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
      productSet(synchronous: true, identifier: $identifier, input: $input) {
        product { id }
        userErrors { field message code }
      }
    }`, { identifier: { handle: product.handle }, input });
  const { product: saved } = checkUserErrors(data.productSet, `product ${product.handle}`);
  return { id: saved.id, created: !existing, images: needsImages ? input.files.length : 0 };
}

async function upsertCollection(title, productIds) {
  const handle = slugify(title);
  const found = await admin(`#graphql
    query Collection($handle: String!) { collectionByIdentifier(identifier: { handle: $handle }) { id } }`, { handle });
  let id = found.collectionByIdentifier?.id;
  if (!id) {
    const created = await admin(`#graphql
      mutation Create($input: CollectionInput!) {
        collectionCreate(input: $input) { collection { id } userErrors { field message } }
      }`, { input: { title, handle, sortOrder: 'MANUAL' } });
    id = checkUserErrors(created.collectionCreate, `collection ${title}`).collection.id;
  }
  // collectionAddProducts ignores products already in the collection.
  for (let index = 0; index < productIds.length; index += 250) {
    const added = await admin(`#graphql
      mutation Add($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) { userErrors { field message } }
      }`, { id, productIds: productIds.slice(index, index + 250) });
    const errors = (added.collectionAddProducts.userErrors ?? []).filter((error) => !/already/i.test(error.message));
    checkUserErrors({ userErrors: errors }, `add products to ${title}`);
  }
  return { id, handle, created: !found.collectionByIdentifier };
}

// ---------------------------------------------------------------------------

const exported = JSON.parse(await readFile(path.join(EXPORT_DIR, 'products.json'), 'utf8'));
const products = exported.products.slice(0, LIMIT);

const problems = validate(exported.products);
if (problems.length) fail(`The export has problems:\n  ${problems.join('\n  ')}`);
const cleaned = exported.products.filter((product) => clean(product.body_html) !== product.body_html || clean(product.title) !== product.title);

console.log(`${exported.products.length} products in the export; importing ${products.length} as DRAFT into ${domain} (Admin API ${apiVersion}).`);
console.log(`Variants: ${products.reduce((total, product) => total + product.variants.length, 0)}. Images: ${products.reduce((total, product) => total + product.images.length, 0)}.`);
if (cleaned.length) console.log(`Competitor names removed from: ${cleaned.map((product) => product.title).join('; ')}`);

if (DRY_RUN) {
  const sample = toProductSetInput(products[0]);
  console.log('\nDry run. First product as sent to Shopify:\n', JSON.stringify(sample, null, 2).slice(0, 2000));
  process.exit(0);
}

adminToken = await getAdminAccessToken().catch((error) => fail(error.message));

const report = { startedAt: new Date().toISOString(), store: domain, products: {}, collections: {}, errors: [] };
const idsByCollection = new Map();
let done = 0;

for (const product of products) {
  try {
    const result = await upsertProduct(product);
    report.products[product.handle] = result;
    for (const title of product.collections ?? []) {
      if (!idsByCollection.has(title)) idsByCollection.set(title, []);
      idsByCollection.get(title).push(result.id);
    }
    done += 1;
    console.log(`✓ ${String(done).padStart(3)}/${products.length} ${result.created ? 'Created' : 'Updated'} ${product.title}${result.images ? ` (+${result.images} image${result.images > 1 ? 's' : ''})` : ''}`);
  } catch (error) {
    report.errors.push({ handle: product.handle, message: error.message });
    console.error(`✖ ${product.handle}: ${error.message}`);
  }
  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
}

for (const [title, ids] of idsByCollection) {
  try {
    const result = await upsertCollection(title, ids);
    report.collections[title] = { ...result, products: ids.length };
    console.log(`✓ Collection "${title}" (${ids.length} products)${result.created ? ' created' : ''}`);
  } catch (error) {
    report.errors.push({ collection: title, message: error.message });
    console.error(`✖ collection ${title}: ${error.message}`);
  }
}

report.finishedAt = new Date().toISOString();
await writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
console.log(`\n${done}/${products.length} products imported as drafts, ${report.errors.length} error(s). Report: shopify-export/import-report.json`);
console.log('Nothing was published. Review prices, images and review:* tags before setting products Active and publishing to Headless.');
if (report.errors.length) process.exitCode = 1;
