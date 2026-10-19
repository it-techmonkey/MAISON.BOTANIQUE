#!/usr/bin/env node
/**
 * Seeds a Shopify development store with the sample catalog from
 * src/data/sample-catalog.ts so the headless storefront has real products,
 * variants, prices, images, Arabic translations and a homepage collection.
 *
 *   npm run shopify:seed                 # create or update everything
 *   npm run shopify:seed -- --images     # re-upload images for existing products
 *   npm run shopify:seed -- --draft      # create products as drafts
 *
 * Re-running is safe: products are matched by handle and updated in place.
 * Requires Node 22.18+ (it imports TypeScript files directly), the client ID
 * and secret of the Dev Dashboard app in .env.local and, for a client transfer
 * store, a one-time `npm run shopify:auth` (see scripts/lib/admin-auth.mjs).
 * Admin credentials stay on this machine; never expose them through
 * NEXT_PUBLIC_ variables.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleCatalog } from '../src/data/sample-catalog.ts';
import { CATALOG_COLLECTION_HANDLE as collectionHandle, SHOPIFY_API_VERSION as apiVersion } from '../src/lib/shopify/config.ts';
import { domain, getAdminAccessToken } from './lib/admin-auth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const REUPLOAD_IMAGES = args.has('--images');
const STATUS = args.has('--draft') ? 'DRAFT' : 'ACTIVE';

// Products are published to the sales channel(s) whose name contains this.
const PUBLICATION_NAME = 'headless';
const OPTION_NAME = 'Presentation';

// ---------------------------------------------------------------------------
// Admin API client
// ---------------------------------------------------------------------------

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const adminToken = await getAdminAccessToken().catch((error) => fail(error.message));

async function admin(query, variables = {}, attempt = 0) {
  const response = await fetch(`https://${domain}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    body: JSON.stringify({ query, variables }),
  });
  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    await sleep(1000 * 2 ** attempt);
    return admin(query, variables, attempt + 1);
  }
  if (!response.ok) throw new Error(`Admin API ${response.status}: ${await response.text()}`);
  const json = await response.json();
  if (json.errors?.some((error) => error.extensions?.code === 'THROTTLED') && attempt < 5) {
    await sleep(2000 * 2 ** attempt);
    return admin(query, variables, attempt + 1);
  }
  if (json.errors?.length) throw new Error(json.errors.map((error) => error.message).join('; '));
  return json.data;
}

function checkUserErrors(result, label, { ignoreCodes = [] } = {}) {
  const errors = (result?.userErrors ?? []).filter((error) => !ignoreCodes.includes(error.code));
  if (errors.length) throw new Error(`${label}: ${errors.map((error) => `${error.field?.join('.') ?? ''} ${error.message}`).join('; ')}`);
  return result;
}

// ---------------------------------------------------------------------------
// Store setup
// ---------------------------------------------------------------------------

const COLOR_DEFINITIONS = [
  { key: 'background_color', name: 'Background colour', description: 'Panel colour behind the product photograph.' },
  { key: 'accent_color', name: 'Accent colour', description: 'Accent colour used with the product.' },
];

async function ensureMetafieldDefinitions() {
  for (const definition of COLOR_DEFINITIONS) {
    const created = await admin(`#graphql
      mutation Define($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { field message code } }
      }`, {
      definition: {
        ...definition, namespace: 'custom', type: 'color', ownerType: 'PRODUCT', access: { storefront: 'PUBLIC_READ' },
      },
    });
    const result = created.metafieldDefinitionCreate;
    if (result.userErrors.some((error) => error.code === 'TAKEN')) {
      // Already defined: make sure the storefront can read it.
      const updated = await admin(`#graphql
        mutation Expose($definition: MetafieldDefinitionUpdateInput!) {
          metafieldDefinitionUpdate(definition: $definition) { userErrors { field message code } }
        }`, { definition: { namespace: 'custom', key: definition.key, ownerType: 'PRODUCT', access: { storefront: 'PUBLIC_READ' } } });
      checkUserErrors(updated.metafieldDefinitionUpdate, `metafield ${definition.key}`);
    } else {
      checkUserErrors(result, `metafield ${definition.key}`);
    }
  }
  console.log('✓ Metafield definitions custom.background_color and custom.accent_color (storefront readable)');
}

async function ensureArabic() {
  try {
    const enabled = await admin(`#graphql
      mutation { shopLocaleEnable(locale: "ar") { shopLocale { locale } userErrors { field message } } }`);
    const errors = enabled.shopLocaleEnable.userErrors.filter((error) => !/already/i.test(error.message));
    if (errors.length) throw new Error(errors[0].message);
    const published = await admin(`#graphql
      mutation { shopLocaleUpdate(locale: "ar", shopLocale: { published: true }) { userErrors { field message } } }`);
    checkUserErrors(published.shopLocaleUpdate, 'publish Arabic');
    console.log('✓ Arabic enabled and published (also add it to the UAE market under Settings › Markets)');
    return true;
  } catch (error) {
    console.warn(`! Could not enable Arabic automatically (${error.message}). Translations will be skipped.`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

async function uploadImage(relativePath, alt) {
  const filePath = path.join(ROOT, 'public', relativePath);
  const bytes = await readFile(filePath);
  const filename = path.basename(filePath);
  const mimeType = filename.endsWith('.png') ? 'image/png' : filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

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
  return { originalSource: target.resourceUrl, contentType: 'IMAGE', alt };
}

async function findProduct(handle) {
  const data = await admin(`#graphql
    query Find($query: String!) { products(first: 1, query: $query) { nodes { id handle mediaCount { count } } } }`,
  { query: `handle:${handle}` });
  return data.products.nodes.find((product) => product.handle === handle) ?? null;
}

const escapeHtml = (value) => value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

async function upsertProduct(sample) {
  const existing = await findProduct(sample.handle);
  const needsImage = REUPLOAD_IMAGES || !existing || !existing.mediaCount?.count;
  const tags = [...sample.occasions.map((occasion) => `occasion:${occasion}`), ...(sample.featured ? ['featured'] : [])];

  const input = {
    title: sample.title,
    handle: sample.handle,
    descriptionHtml: `<p>${escapeHtml(sample.description)}</p>`,
    productType: sample.productType,
    vendor: 'Maison Botanique',
    status: STATUS,
    tags,
    productOptions: [{ name: OPTION_NAME, position: 1, values: sample.sizes.map((size) => ({ name: size.name })) }],
    variants: sample.sizes.map((size) => ({
      optionValues: [{ optionName: OPTION_NAME, name: size.name }],
      price: size.price.toFixed(2),
      // Arrangements are made to order, so stock is not counted by default.
      inventoryItem: { tracked: false },
    })),
    metafields: [
      { namespace: 'custom', key: 'background_color', type: 'color', value: sample.backgroundColor },
      { namespace: 'custom', key: 'accent_color', type: 'color', value: sample.accentColor },
    ],
  };
  if (needsImage) input.files = [await uploadImage(sample.image, sample.title)];

  const data = await admin(`#graphql
    mutation Upsert($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
      productSet(synchronous: true, identifier: $identifier, input: $input) {
        product { id options { name optionValues { id name } } }
        userErrors { field message code }
      }
    }`, { identifier: { handle: sample.handle }, input });
  const { product } = checkUserErrors(data.productSet, `product ${sample.handle}`);
  console.log(`✓ ${existing ? 'Updated' : 'Created'} ${sample.title}${needsImage ? ' (with image)' : ''}`);
  return product;
}

async function registerTranslations(resourceId, valuesByKey) {
  const data = await admin(`#graphql
    query Translatable($id: ID!) { translatableResource(resourceId: $id) { translatableContent { key digest } } }`,
  { id: resourceId });
  const translations = (data.translatableResource?.translatableContent ?? [])
    .filter((content) => valuesByKey[content.key])
    .map((content) => ({ locale: 'ar', key: content.key, value: valuesByKey[content.key], translatableContentDigest: content.digest }));
  if (!translations.length) return;
  const result = await admin(`#graphql
    mutation Translate($id: ID!, $translations: [TranslationInput!]!) {
      translationsRegister(resourceId: $id, translations: $translations) { userErrors { field message } }
    }`, { id: resourceId, translations });
  checkUserErrors(result.translationsRegister, `translations for ${resourceId}`);
}

async function translateProduct(sample, product) {
  await registerTranslations(product.id, {
    title: sample.titleAr,
    body_html: `<p>${escapeHtml(sample.descriptionAr)}</p>`,
  });
  const option = product.options.find((item) => item.name === OPTION_NAME);
  for (const value of option?.optionValues ?? []) {
    const size = sample.sizes.find((item) => item.name === value.name);
    if (size) await registerTranslations(value.id, { name: size.nameAr });
  }
}

// ---------------------------------------------------------------------------
// Collection and sales channel
// ---------------------------------------------------------------------------

async function upsertCollection(productIds) {
  const found = await admin(`#graphql
    query Collection($query: String!) {
      collections(first: 1, query: $query) { nodes { id handle products(first: 250) { nodes { id } } } }
    }`, { query: `handle:${collectionHandle}` });
  let collection = found.collections.nodes.find((item) => item.handle === collectionHandle);

  if (!collection) {
    const created = await admin(`#graphql
      mutation Create($input: CollectionInput!) {
        collectionCreate(input: $input) { collection { id } userErrors { field message } }
      }`, { input: { title: 'Homepage', handle: collectionHandle, sortOrder: 'MANUAL', products: productIds } });
    collection = checkUserErrors(created.collectionCreate, 'create collection').collection;
    console.log(`✓ Created manual collection "${collectionHandle}"`);
  } else {
    const present = new Set(collection.products.nodes.map((product) => product.id));
    const missing = productIds.filter((id) => !present.has(id));
    if (missing.length) {
      const added = await admin(`#graphql
        mutation Add($id: ID!, $productIds: [ID!]!) {
          collectionAddProducts(id: $id, productIds: $productIds) { userErrors { field message } }
        }`, { id: collection.id, productIds: missing });
      checkUserErrors(added.collectionAddProducts, 'add products to collection');
    }
    const moves = productIds.map((id, index) => ({ id, newPosition: String(index) }));
    const reordered = await admin(`#graphql
      mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
        collectionReorderProducts(id: $id, moves: $moves) { userErrors { field message } }
      }`, { id: collection.id, moves });
    checkUserErrors(reordered.collectionReorderProducts, 'reorder collection');
    console.log(`✓ Updated collection "${collectionHandle}" (manual sort order follows the sample catalog)`);
  }
  return collection.id;
}

async function listPublications() {
  try {
    const data = await admin('query { publications(first: 50) { nodes { id name } } }');
    return data.publications.nodes.map((node) => ({ id: node.id, name: node.name }));
  } catch {
    const data = await admin('query { publications(first: 50) { nodes { id catalog { title } } } }');
    return data.publications.nodes.map((node) => ({ id: node.id, name: node.catalog?.title ?? '' }));
  }
}

async function publish(resourceIds) {
  const publications = await listPublications();
  const targets = publications.filter((publication) => publication.name.toLowerCase().includes(PUBLICATION_NAME));
  if (!targets.length) {
    console.warn('! No Headless sales channel found, so nothing was published.');
    console.warn(`  Available: ${publications.map((publication) => publication.name).join(', ') || 'none'}`);
    console.warn('  Install the Headless channel (docs/SHOPIFY_SETUP.md, step 3) and run the seed again.');
    return;
  }
  for (const id of resourceIds) {
    const result = await admin(`#graphql
      mutation Publish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { field message } }
      }`, { id, input: targets.map((publication) => ({ publicationId: publication.id })) });
    checkUserErrors(result.publishablePublish, `publish ${id}`);
  }
  console.log(`✓ Published ${resourceIds.length} items to: ${targets.map((publication) => publication.name).join(', ')}`);
}

// ---------------------------------------------------------------------------

console.log(`Seeding ${sampleCatalog.length} sample products into ${domain} (Admin API ${apiVersion})\n`);
try {
  await ensureMetafieldDefinitions();
  const arabic = await ensureArabic();
  const productIds = [];
  for (const sample of sampleCatalog) {
    const product = await upsertProduct(sample);
    if (arabic) await translateProduct(sample, product);
    productIds.push(product.id);
  }
  if (arabic) console.log('✓ Arabic titles, descriptions and presentation names registered');
  const collectionId = await upsertCollection(productIds);
  await publish([...productIds, collectionId]);
  console.log('\nDone. The storefront refreshes within 5 minutes, or immediately once the product webhook is set up.');
} catch (error) {
  fail(error.message);
}
