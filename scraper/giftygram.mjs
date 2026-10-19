// Scrapes every product from giftygram.ae (a Shopify store) via its public
// JSON endpoints. Giftygram photos carry no brand logos, so no logo check.
//
//   node giftygram.mjs
//
// Writes output/giftygram.json and output/giftygram.csv.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHttp, htmlToText, toCsv, writeFile } from "./lib/util.mjs";

const BASE = "https://www.giftygram.ae";
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "output");

// Shopify rate-limits bursts quickly; one request every 1.5s stays clear of it.
const http = createHttp({ minIntervalMs: 1500 });

async function fetchAllPages(endpoint, key) {
  const items = [];
  for (let page = 1; ; page++) {
    const data = await http.request(`${BASE}${endpoint}?limit=250&page=${page}`, { as: "json" });
    const batch = data[key] ?? [];
    items.push(...batch);
    if (batch.length < 250) return items;
  }
}

const num = (v) => (v == null || v === "" ? null : Number(v));

function normalize(p, collectionsByProduct) {
  const imageById = new Map(p.images.map((img) => [img.id, img.src]));
  const variants = p.variants.map((v) => ({
    id: v.id,
    title: v.title,
    sku: v.sku || null,
    price: num(v.price),
    compare_at_price: num(v.compare_at_price) > num(v.price) ? num(v.compare_at_price) : null,
    available: v.available,
    image_url: v.featured_image?.src ?? imageById.get(v.image_id) ?? null,
  }));
  const prices = variants.map((v) => v.price).filter((v) => v != null);
  const compares = variants.map((v) => v.compare_at_price).filter((v) => v != null);

  return {
    id: p.id,
    handle: p.handle,
    url: `${BASE}/products/${p.handle}`,
    name: p.title,
    vendor: p.vendor,
    product_type: p.product_type || null,
    collections: collectionsByProduct.get(p.id) ?? [],
    tags: p.tags,
    currency: "AED",
    price_min: prices.length ? Math.min(...prices) : null,
    price_max: prices.length ? Math.max(...prices) : null,
    compare_at_price: compares.length ? Math.max(...compares) : null,
    available: variants.some((v) => v.available),
    options: p.options.map((o) => ({ name: o.name, values: o.values })),
    variants,
    description_html: p.body_html,
    description_text: htmlToText(p.body_html),
    images: p.images.map((img) => ({
      url: img.src,
      alt: img.alt ?? null,
      width: img.width,
      height: img.height,
      position: img.position,
    })),
    published_at: p.published_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

console.log("Fetching products…");
const rawProducts = await fetchAllPages("/products.json", "products");
console.log(`  ${rawProducts.length} products`);

console.log("Fetching collections…");
const collections = await fetchAllPages("/collections.json", "collections");
const collectionsByProduct = new Map();
for (const [i, c] of collections.entries()) {
  process.stdout.write(`\r  ${i + 1}/${collections.length} ${c.handle.padEnd(50)}`);
  const products = await fetchAllPages(`/collections/${c.handle}/products.json`, "products");
  for (const p of products) {
    if (!collectionsByProduct.has(p.id)) collectionsByProduct.set(p.id, []);
    collectionsByProduct.get(p.id).push(c.title);
  }
}
process.stdout.write("\n");

const products = rawProducts.map((p) => normalize(p, collectionsByProduct));

const csvRows = products.map((p) => ({
  ...p,
  collections: p.collections,
  tags: p.tags,
  variants: p.variants.map(
    (v) => `${v.title}: ${v.price}${v.compare_at_price ? ` (was ${v.compare_at_price})` : ""}${v.available ? "" : " [sold out]"}`,
  ),
  image_urls: p.images.map((img) => img.url),
}));
const columns = [
  "id", "name", "url", "vendor", "product_type", "collections", "tags", "currency",
  "price_min", "price_max", "compare_at_price", "available", "variants", "description_text", "image_urls",
];

await writeFile(path.join(OUT_DIR, "giftygram.json"), JSON.stringify(products, null, 2));
await writeFile(path.join(OUT_DIR, "giftygram.csv"), toCsv(csvRows, columns));
console.log(`Done: ${products.length} products → output/giftygram.json, output/giftygram.csv`);
