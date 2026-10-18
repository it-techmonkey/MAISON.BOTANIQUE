# Maison Botanique: Shopify push guide for the developer

Everything you need is in **`shopify-push.json`**, with the image files in **`images/`**. Rebuild the JSON after any catalog change with `python3 build_shopify_push.py` (the source of truth is `products.json`).

## What the file contains

| Section | What it is | How to use it |
|---|---|---|
| `meta` | Counts, rules and `known_issues` | Read first. `known_issues` lists products without any price, and images still awaiting owner approval. |
| `master_data.metafield_definitions` | 8 product metafield definitions, namespace `maison` | Create with `metafieldDefinitionCreate` (ownerType `PRODUCT`) **before** pushing products. |
| `master_data.collections` | 14 collections, each with its product handles | Create with `collectionCreate` (custom collections). Add products with `collectionAddProducts` after the products exist. |
| `master_data.product_types`, `tags` | Vocabulary | For filters and navigation; there is nothing to create. |
| `master_data.options` | Size tiers and the quantity rule | Signature = as pictured, Grand = 2× the flowers, Luxe = 3× the flowers. Gift items (vase, box, teddy, chocolates) stay the same. |
| `master_data.sku_master` | One row per variant SKU (822) | Master SKU list with placeholder and Maison prices. |
| `products[]` | 318 products | `input` is a ready **`productSet`** input (Admin GraphQL **2026-10**). `translations.ar` is the Arabic content. `review` holds internal checks. |

## Push order

1. **Shop setup.** In the admin: currency AED, market UAE, and Arabic added as a published locale (it can stay unpublished until the native review is done).
2. **Metafield definitions.** Run `metafieldDefinitionCreate` for each entry in `master_data.metafield_definitions`. Internal-only ones (`reference_id`, `review_flags`, `image_status`) must not be exposed to the Storefront API.
3. **Images.** For each file in `products[].input.files` (and the variant `file` entries, which point to the same files):
   1. Call `stagedUploadsCreate` (resource `IMAGE`, mimeType `image/webp`).
   2. Upload `shopify-export/<originalSource>` to the returned URL.
   3. Replace `originalSource` with the returned `resourceUrl`, in both the product `files` and any variant `file` with the same path.
4. **Products.** Call `productSet(input: products[i].input, synchronous: true)`. It creates the product, options, variants, prices, SKUs, images and metafields in one call. Keep the returned product ID against the `handle`.
   - Every product is `status: DRAFT`. Do not change this.
   - Handles are unique and stable; re-running `productSet` with an `identifier: {handle}` updates the product instead of duplicating it.
5. **Collections.** Call `collectionAddProducts` using the IDs from step 4.
6. **Arabic.** For each product, call `translationsRegister` (locale `ar`) for `title`, `body_html`, `meta_title` and `meta_description`, and for option names and values. Use `translatableResource` to get each digest first. All Arabic is machine-drafted and must be reviewed by a native speaker before the Arabic storefront goes live.
7. **Checks.** Verify that the product count is 318, the variant count is 822, every product has at least one image, and that the Pink option of "Teddy with 16 Pcs Ferrero Rocher Gift" shows its own image.

Keep the Admin API token server-side only. The storefront uses the public Storefront token (see the repository README).

## Rules before anything is published

- **Prices are placeholders.** Each variant uses `maison_retail_price_aed` from `pricing-worksheet.csv` when the owner has filled it in. Otherwise it uses a competitor reference price. Currently **no** Maison prices are entered, and 22 products have no price at all (`meta.known_issues.products_without_any_price`). Rebuild the JSON after the worksheet is filled.
- **Images.** 266 product images are owner-approved. 53 are still pending approval (`meta.known_issues.images_pending_owner_approval`): the 30 earliest concepts, 12 regenerated images, the 10 restored products and the Pink teddy option. Every image is an AI-generated brand image, not a photo of real stock.
- **Branded contents.** Ferrero, Lindt, Godiva, Johnson's and similar items must be genuine stock. Character items (Hello Kitty, Stitch) need licensing or a rename.
- **Customer inputs.** The `custom_fields` metafield on "Customized Letter – Red Roses Bouquet" and "Pink Birthday Flower Bouquet XL" lists the text the customer must enter (letter, age number). Collect these as cart line-item properties.
- **Internal data.** Do not show competitor names, URLs or reference IDs on the store.

## Files in this folder

`shopify-push.json` (this hand-off), `products.json` (source catalog), `images/` (321 WebP files, 1024–1254 px), `pricing-worksheet.csv` (owner enters Maison prices), `site-seo/` (store-level schema, llms.txt, FAQ), `build_shopify_push.py` (rebuilds the hand-off), `add_restored_products.py` (adds the 10 restored products).
