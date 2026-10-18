# Maison Botanique – Shopify product export (DRAFT)

Files
- `products.json` – 308 products (`meta` + `products`). Shopify Admin-style fields: title, handle, vendor, product_type, tags, body_html, options, variants, images, metafields. Extras: `review_flags`, `translations.ar`, `reference_id`.
- `images/` – 31 WebP images (1254x1254), referenced by `images[].filename`. AI-generated concepts, pending owner approval.
- `pricing-worksheet.csv` – one row per variant (1203): proposed SKU, placeholder price, empty column for the Maison retail price.
- `duplicate-decisions-RECOMMENDED.csv` – record of duplicate decisions. 18 duplicates already removed from products.json; 2 pairs were merged into single products with options (teddy colour; rose colour).
- `image-issues.csv` – product-by-product image problems and the fix.

Rules for the upload
1. Import everything as DRAFT / unpublished. Do not publish any product until its flags are cleared.
2. PRICES ARE PLACEHOLDERS. Variant prices are the competitors' AED prices copied from research data (UAEFlowers / GiftyGram). They are not Maison prices. 22 products have no price (null). Replace every price before publishing.
3. SKUs are proposed (`MB-<category>-<nnn>-<variant>`). Variant names (Classic / Double the quantity / Deluxe / Premium) come from research; physical differences are unconfirmed.
4. 279 products have no approved image yet (`no_image_yet` / `image_withheld`). Do not publish those.
5. Arabic title/description (`translations.ar`) are empty.
6. `review_flags`: `merged_from_2_listings`, `similar_listing_rename_needed:<group>`, `seasonal_occasion_listing_keep` (graduation / National Flag / Raksha Bandhan - intentionally kept), `third_party_brand_contents`, `character_licensing_required`, `composition_needs_confirmation`, `price_is_placeholder_competitor_reference`, `no_price_available`, `no_image_yet`.
7. Do not add competitor names, URLs or photos to the store.

Update 18 Oct 2026 - descriptions
- 101 weak/missing descriptions were rewritten from source facts only (nothing added or removed from the catalogue). `body_html_original` keeps the old text.
- `description_status`: `draft_ready_for_review` (15), `draft_needs_owner_confirmation` (86, see `owner_to_confirm`), `original_composition_kept` (207).
- `image_prompt` (detailed) is separate from the customer description (`body_html`). All of them are in `product-copy-and-prompts.csv`.

Update 18 Oct 2026 - Arabic and brands
- `translations.ar.title` and `translations.ar.body_html` are drafted for all 308 products (machine-drafted, needs native-speaker review). Variant/option names are not translated yet; they will change in the version cleanup.
- Brand names (chocolates, toys, characters) stay as listed: Maison will supply them.
- Variant structure still needs cleanup before launch (see the owner's decision on Classic/Deluxe/Premium tiers, add-ons, age numbers and letters).

Update 18 Oct 2026 - tiers and SEO
- Versions standardised: Signature (as pictured) / Grand (double) / Luxe (triple), one photo, sizes explained in the description and option names. The duplicate "Double the quantity" and the "Make it special" add-ons were removed from variants (`legacy_variants_removed` keeps a record). Age number (Pink Birthday XL) and letter (Customized Letter) are text fields (`custom_fields`). Pink Baby Roses White/Gold prices need review.
- Basic SEO/AEO/GEO: see `site-seo/` and the `seo`, `images[].alt`, `answer_summary` and `faq` fields. Arabic equivalents are under `translations.ar`.
- `pricing-worksheet.csv` was rebuilt for the new variants (prices are still competitor placeholders).
