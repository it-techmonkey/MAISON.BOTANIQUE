# Maison Botanique – Shopify product export (DRAFT)

Files
- `products.json` – 328 products (`meta` + `products`). Shopify Admin-style fields: title, handle, vendor, product_type, tags, body_html, options, variants, images, metafields. Extras: `review_flags`, `translations.ar`, `reference_id`.
- `images/` – 33 WebP images (1254x1254), referenced by `images[].filename`. AI-generated concepts, pending owner approval.
- `pricing-worksheet.csv` – one row per variant (1,271): proposed SKU, placeholder price, empty column for the Maison retail price.
- `duplicate-decisions-RECOMMENDED.csv` – proposed keep/drop per duplicate group. NOT applied to products.json yet; owner must approve.
- `image-issues.csv` – product-by-product image problems and the fix.

Rules for the upload
1. Import everything as DRAFT / unpublished. Do not publish any product until its flags are cleared.
2. PRICES ARE PLACEHOLDERS. Variant prices are the competitors' AED prices copied from research data (UAEFlowers / GiftyGram). They are not Maison prices. 24 products have no price (null). Replace every price before publishing.
3. SKUs are proposed (`MB-<category>-<nnn>-<variant>`). Variant names (Classic / Double the quantity / Deluxe / Premium) come from research; physical differences are unconfirmed.
4. 295 products have no approved image yet (`no_image_yet` / `image_withheld`). Do not publish those.
5. Arabic title/description (`translations.ar`) are empty.
6. `review_flags`: `possible_duplicate:<group>`, `seasonal_or_promo_listing`, `third_party_brand_contents`, `character_licensing_required`, `composition_needs_confirmation`, `price_is_placeholder_competitor_reference`, `no_price_available`, `no_image_yet`.
7. Do not add competitor names, URLs or photos to the store.
