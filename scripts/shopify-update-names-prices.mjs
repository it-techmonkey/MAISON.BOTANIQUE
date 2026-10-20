#!/usr/bin/env node
/**
 * Applies two owner decisions of 2026-10-20 to the LIVE Shopify catalogue, and
 * nothing else:
 *
 *   1. new product names, Arabic names and URL handles
 *      (catalog/shopify-export/product-renames.json, from scripts/apply_product_renames.py)
 *   2. new strikethrough ("compare at") prices, 40-60% off
 *      (catalog/shopify-export/variant-prices.csv, from scripts/set_strikethrough.py)
 *
 * It is not the seed script: descriptions, images, tags, collections, selling
 * prices and every other live edit stay as they are. Per product it updates the
 * title, handle (with a redirect from the old URL), SEO title and description,
 * the Arabic title and SEO translations, the metafields that quote the name
 * (title_ar, answer_summary, answer_summary_ar, faq), and each variant's
 * compare-at price.
 *
 *   npm run shopify:names-prices                   # dry run: reads Shopify, writes nothing
 *   npm run shopify:names-prices -- --apply        # makes the changes
 *   npm run shopify:names-prices -- --apply --limit 3
 *
 * Safe to run again: a product already carrying the new handle is matched by it.
 * Image alt text still quotes the old name; it is not changed here.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOPIFY_API_VERSION as apiVersion } from '../src/lib/shopify/config.ts';
import { domain, getAdminAccessToken } from './lib/admin-auth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT_DIR = path.join(ROOT, 'catalog', 'shopify-export');
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const limitIndex = argv.indexOf('--limit');
const LIMIT = limitIndex >= 0 ? Number(argv[limitIndex + 1]) : Infinity;
const NAME_METAFIELDS = ['answer_summary', 'answer_summary_ar', 'faq'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message) => { console.error(`\n✖ ${message}\n`); process.exit(1); };

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

function checkUserErrors(result, label) {
  const errors = result?.userErrors ?? [];
  if (errors.length) throw new Error(`${label}: ${errors.map((error) => `${error.field?.join('.') ?? ''} ${error.message}`).join('; ')}`);
  return result;
}

const parseCsv = (text) => {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const names = head.replace(/^﻿/, '').split(',');
  return lines.map((line) => {
    const cells = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (quoted && char === '"' && line[index + 1] === '"') { cell += '"'; index += 1; } else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { cells.push(cell); cell = ''; } else cell += char;
    }
    cells.push(cell);
    return Object.fromEntries(names.map((name, index) => [name, cells[index] ?? '']));
  });
};

const renames = JSON.parse(await readFile(path.join(EXPORT_DIR, 'product-renames.json'), 'utf8'));
const push = JSON.parse(await readFile(path.join(EXPORT_DIR, 'shopify-push.json'), 'utf8'));
const ledger = parseCsv(await readFile(path.join(EXPORT_DIR, 'variant-prices.csv'), 'utf8'));
const pushByHandle = new Map(push.products.map((product) => [product.handle, product]));
const compareBySku = new Map(ledger.map((row) => [row.sku, row]));

adminToken = await getAdminAccessToken().catch((error) => fail(error.message));

async function findProduct(handle) {
  const data = await admin(`#graphql
    query Find($handle: String!) {
      productByIdentifier(identifier: { handle: $handle }) {
        id handle title
        variants(first: 100) { nodes { id sku price compareAtPrice } }
      }
    }`, { handle });
  return data.productByIdentifier;
}

async function updateProduct(rename, entry) {
  const product = (await findProduct(rename.oldHandle)) ?? (await findProduct(rename.handle));
  if (!product) throw new Error(`not found in Shopify: ${rename.oldHandle}`);

  const variants = product.variants.nodes.map((variant) => {
    const row = compareBySku.get(variant.sku);
    if (!row) throw new Error(`no ledger row for SKU ${variant.sku}`);
    if (Number(row.price) !== Number(variant.price)) throw new Error(`selling price differs for ${variant.sku}: Shopify ${variant.price}, ledger ${row.price}`);
    return { id: variant.id, compareAtPrice: row.compare_at_price, current: variant.compareAtPrice };
  });
  const changes = {
    renamed: product.handle !== rename.handle || product.title !== rename.title,
    comparePrices: variants.filter((variant) => Number(variant.current) !== Number(variant.compareAtPrice)).length,
  };
  if (!APPLY) return { id: product.id, ...changes };

  const metafields = [
    ...entry.input.metafields.filter((field) => NAME_METAFIELDS.includes(field.key))
      .map((field) => ({ namespace: field.namespace, key: field.key, type: field.type, value: String(field.value) })),
    { namespace: 'maison', key: 'title_ar', type: 'single_line_text_field', value: rename.titleAr },
  ];
  const updated = await admin(`#graphql
    mutation Update($product: ProductUpdateInput!) {
      productUpdate(product: $product) { product { id handle } userErrors { field message } }
    }`, {
    product: {
      id: product.id,
      title: rename.title,
      handle: rename.handle,
      redirectNewHandle: product.handle !== rename.handle,
      seo: { title: entry.input.seo.title, description: entry.input.seo.description },
      metafields,
    },
  });
  checkUserErrors(updated.productUpdate, `product ${rename.oldHandle}`);

  if (changes.comparePrices) {
    const saved = await admin(`#graphql
      mutation Compare($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
      }`, { productId: product.id, variants: variants.map(({ id, compareAtPrice }) => ({ id, compareAtPrice })) });
    checkUserErrors(saved.productVariantsBulkUpdate, `compare-at prices ${rename.handle}`);
  }

  const arabic = entry.translations?.ar;
  if (arabic) {
    const wanted = { title: rename.titleAr, meta_title: arabic.seo_title, meta_description: arabic.seo_description };
    const digests = await admin(`#graphql
      query Digests($id: ID!) { translatableResource(resourceId: $id) { translatableContent { key digest } } }`, { id: product.id });
    const translations = digests.translatableResource.translatableContent
      .filter((content) => wanted[content.key])
      .map((content) => ({ locale: 'ar', key: content.key, value: wanted[content.key], translatableContentDigest: content.digest }));
    if (translations.length) {
      const saved = await admin(`#graphql
        mutation Translate($id: ID!, $translations: [TranslationInput!]!) {
          translationsRegister(resourceId: $id, translations: $translations) { userErrors { field message } }
        }`, { id: product.id, translations });
      checkUserErrors(saved.translationsRegister, `Arabic translation ${rename.handle}`);
    }
  }
  return { id: product.id, ...changes };
}

const todo = renames.slice(0, LIMIT);
console.log(`${APPLY ? 'APPLYING' : 'Dry run:'} ${todo.length} products on ${domain} (Admin API ${apiVersion}).`);
const totals = { renamed: 0, comparePrices: 0, errors: 0 };
let done = 0;
for (const rename of todo) {
  try {
    const entry = pushByHandle.get(rename.handle);
    if (!entry) throw new Error(`${rename.handle} missing from shopify-push.json`);
    const result = await updateProduct(rename, entry);
    totals.renamed += result.renamed ? 1 : 0;
    totals.comparePrices += result.comparePrices;
    done += 1;
    if (APPLY || done <= 3) console.log(`${APPLY ? '✓' : '·'} ${String(done).padStart(3)}/${todo.length} ${rename.oldTitle} → ${rename.title}${result.comparePrices ? ` (${result.comparePrices} compare-at)` : ''}`);
  } catch (error) {
    totals.errors += 1;
    console.error(`✖ ${rename.oldHandle}: ${error.message}`);
  }
}
console.log(`\n${APPLY ? 'Done' : 'Dry run complete'}: ${totals.renamed} products to rename, ${totals.comparePrices} variant compare-at prices to change, ${totals.errors} errors.`);
if (!APPLY) console.log('Nothing was changed. Re-run with --apply to update Shopify.');
process.exit(totals.errors ? 1 : 0);
