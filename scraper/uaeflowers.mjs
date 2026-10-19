// Scrapes every product from uaeflowers.com and checks each product image for
// a brand logo with Claude.
//
//   node uaeflowers.mjs [--limit N] [--fresh] [--skip-logos]
//
//   --limit N      only scrape the first N sitemap URLs (for testing)
//   --fresh        re-download product pages instead of using the page cache
//   --skip-logos   skip the logo check (has_logo is left null)
//
// The logo check needs ANTHROPIC_API_KEY. Set LOGO_MODEL to override the model.
// Writes output/uaeflowers.json, output/uaeflowers.csv and
// output/uaeflowers_images.csv (one row per image with its logo result).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLogoChecker } from "./lib/logo-check.mjs";
import { createHttp, htmlToText, mapPool, parseArgs, readJson, toCsv, writeFile } from "./lib/util.mjs";

const BASE = "https://www.uaeflowers.com";
const IMAGE_BASE = "https://cdn.uaeflowers.com/uploads/product/";
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "output");
const PAGE_CACHE_DIR = path.join(OUT_DIR, ".cache", "uaeflowers-pages");

const args = parseArgs(process.argv.slice(2));
const site = createHttp({ minIntervalMs: 500 });
const cdn = createHttp({ minIntervalMs: 100 });

// Every product lives at a single-segment URL (e.g. /red-rose-bouquet); the
// other single-segment URLs (about-us, …) are filtered out after fetching.
async function productSlugsFromSitemap() {
  const xml = await site.request(`${BASE}/sitemap.xml`);
  const slugs = new Set();
  for (const [, loc] of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const { pathname } = new URL(loc);
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 1) slugs.add(parts[0]);
  }
  return [...slugs];
}

// Returns the product record embedded in the page's __NEXT_DATA__, or null
// when the URL is not a product page.
async function fetchProduct(slug) {
  const cachePath = path.join(PAGE_CACHE_DIR, `${encodeURIComponent(slug)}.json`);
  if (!args.fresh) {
    const cached = await readJson(cachePath, undefined);
    if (cached !== undefined) return cached.product;
  }

  let product = null;
  try {
    const html = await site.request(`${BASE}/${slug}`);
    const json = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    const props = json && JSON.parse(json).props?.pageProps;
    const result = props?.pageData?.result;
    if (props?.resolvedData?.url_type === "product" && result?.product_name) product = result;
  } catch (err) {
    if (!err.status) throw err; // network/5xx failures after retries: don't cache
  }
  await writeFile(cachePath, JSON.stringify({ product }));
  return product;
}

const UPGRADE_OPTIONS = [
  ["Classic", "new_price"],
  ["Double the quantity", "double_price"],
  ["Deluxe", "deluxe_price"],
  ["Premium", "premium_price"],
  ["Make it special", "mkspecial_price"],
  ["Make it extra special", "mkextspecial_price"],
];

function normalize(r) {
  const detail = r.product_price_detail ?? {};
  const price = r.product_price ?? detail.new_price ?? null;
  // The site only shows size options when one of these flags is set (cakes
  // reuse the same price fields, e.g. "Double the quantity" = 3 kg).
  const upgradeOptions =
    r.flower_display_varient === 1 || r.cake_display_varient === 1
      ? UPGRADE_OPTIONS.filter(([, key]) => detail[key] > 0).map(([name, key]) => ({ name, price: detail[key] }))
      : [];
  const imageFiles = [r.product_image, ...(r.product_other_image ?? []).map((img) => img.image)].filter(Boolean);

  return {
    id: r._id,
    product_number: r.product_unique_id,
    slug: r.url || r.slug,
    url: `${BASE}/${r.url || r.slug}`,
    name: r.product_name,
    tagline: r.tagline || null,
    currency: r.currency_code || "AED",
    price,
    compare_at_price: detail.old_price > price ? detail.old_price : null,
    upgrade_options: upgradeOptions,
    in_stock: r.in_stock === 1,
    delivery: r.delivery_frequency ?? null,
    rating: r.rating_avg != null ? Number(r.rating_avg) : null,
    review_count: r.review_count ?? 0,
    description_html: r.description,
    description_text: htmlToText(r.description),
    care_instructions_text: htmlToText(r.left_content),
    delivery_info_text: htmlToText(r.right_content),
    image_alt: r.image_alt_tag || null,
    images: imageFiles.map((file) => ({ url: IMAGE_BASE + file })),
    seo: { title: r.seo_title || null, description: r.seo_description || null, keywords: r.seo_keywords || null },
    created_at: r.created,
    updated_at: r.modified,
  };
}

// --- 1. Discover and fetch every product page --------------------------------

await fs.mkdir(PAGE_CACHE_DIR, { recursive: true });
const slugs = (await productSlugsFromSitemap()).slice(0, args.limit);
console.log(`Fetching ${slugs.length} candidate pages from the sitemap…`);

let done = 0;
const raw = await mapPool(slugs, 3, async (slug) => {
  let product;
  try {
    product = await fetchProduct(slug);
  } catch (err) {
    console.warn(`\n  ! ${slug}: ${err.message}`);
    product = null;
  }
  process.stdout.write(`\r  ${++done}/${slugs.length}`);
  return product;
});
process.stdout.write("\n");

const seen = new Set();
const allProducts = raw
  .filter((r) => r && !seen.has(r._id) && seen.add(r._id))
  .map(normalize);
// Only keep products a customer can actually buy.
const products = allProducts.filter((p) => p.in_stock && p.price > 0);
console.log(`  ${allProducts.length} products found, ${products.length} in stock with a price`);

// --- 2. Check every image for a brand logo -----------------------------------

const checker = args.skipLogos
  ? null
  : await createLogoChecker({ cachePath: path.join(OUT_DIR, ".cache", "logo-checks.json"), http: cdn });

if (checker) {
  const images = products.flatMap((p) => p.images);
  const pending = [...new Set(images.map((img) => img.url))].filter((url) => !checker.isCached(url));
  console.log(`Checking ${pending.length} images for logos with ${checker.model} (${images.length - pending.length} cached)…`);
  const results = new Map();
  await mapPool(pending, 4, async (url) => {
    results.set(url, await checker.check(url));
    process.stdout.write(`\r  ${results.size}/${pending.length}`);
  });
  process.stdout.write("\n");
  await checker.save();
  for (const img of images) Object.assign(img, results.get(img.url) ?? (await checker.check(img.url)));
} else {
  console.warn(
    args.skipLogos
      ? "Skipping logo check (--skip-logos)."
      : "ANTHROPIC_API_KEY is not set, so the logo check was skipped. Set it and re-run; pages are cached.",
  );
  for (const p of products) for (const img of p.images) img.has_logo = null;
}

for (const p of products) {
  const flags = p.images.map((img) => img.has_logo);
  p.any_image_has_logo = flags.includes(true) ? true : flags.includes(null) ? null : false;
}

// --- 3. Write outputs --------------------------------------------------------

const yesNo = (v) => (v === true ? "yes" : v === false ? "no" : "unknown");

const productRows = products.map((p) => ({
  ...p,
  upgrade_options: p.upgrade_options.map((o) => `${o.name}: ${o.price}`),
  image_urls: p.images.map((img) => img.url),
  image_has_logo: p.images.map((img) => yesNo(img.has_logo)),
  any_image_has_logo: yesNo(p.any_image_has_logo),
  logo_brands: [...new Set(p.images.flatMap((img) => img.brands ?? []))],
}));
const productColumns = [
  "id", "product_number", "name", "url", "currency", "price", "compare_at_price", "upgrade_options",
  "in_stock", "delivery", "rating", "review_count", "description_text", "care_instructions_text",
  "delivery_info_text", "image_urls", "image_has_logo", "any_image_has_logo", "logo_brands",
];

const imageRows = products.flatMap((p) =>
  p.images.map((img) => ({
    product_id: p.id,
    product_name: p.name,
    product_url: p.url,
    image_url: img.url,
    has_logo: yesNo(img.has_logo),
    brands: img.brands ?? [],
    placement: img.placement ?? "",
    confidence: img.confidence ?? "",
    error: img.error ?? "",
  })),
);
const imageColumns = ["product_id", "product_name", "product_url", "image_url", "has_logo", "brands", "placement", "confidence", "error"];

await writeFile(path.join(OUT_DIR, "uaeflowers.json"), JSON.stringify(products, null, 2));
await writeFile(path.join(OUT_DIR, "uaeflowers.csv"), toCsv(productRows, productColumns));
await writeFile(path.join(OUT_DIR, "uaeflowers_images.csv"), toCsv(imageRows, imageColumns));

const withLogo = products.filter((p) => p.any_image_has_logo === true).length;
console.log(
  `Done: ${products.length} products, ${imageRows.length} images` +
    (checker ? `, ${withLogo} products with a logo in at least one image` : "") +
    " → output/uaeflowers.json, output/uaeflowers.csv, output/uaeflowers_images.csv",
);
