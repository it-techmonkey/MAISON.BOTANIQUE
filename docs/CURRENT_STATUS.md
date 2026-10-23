# Current project status

19 October 2026, Dubai time. Cleanup baseline: GitHub `main` at `8ae247f`.
PR #2 merged R1–R16; PR #3 subsequently changed hero spacing and made occasions collection filters.
This cleanup preserves that newer application baseline.

## Code and records

- Next.js + Shopify is current. Earlier Vite/Sites projects are archived locally.
- Recorded catalogue: 318 products and 822 variants. These describe the snapshot, not an independently
  verified current live inventory. Shopify owns live data; export files are not automatically refreshed mirrors.
- Website curation includes Gifts for her and Most loved. Occasion URLs redirect to collection filters.
- `catalog/image-pipeline/` is the maintained tooling source. Ignored links connect media, references and keys.
- Type checking now generates Next.js route helpers automatically, including in fresh clones and CI.
- Cleanup branch: `cleanup/workspace-organization`. Neither local nor remote main is changed by cleanup.
  Local main remains stale; branch from fresh `origin/main`.

## Governing owner decisions

- Signature / Grand / Luxe; only flowers multiply; one Signature photo per product.
- No product counts in customer UI. Paper/ivory backgrounds; Cormorant Garamond italic for card previews.
- Preserve the current three-product scroll hero, arrows, approved headline and four promises.
- 25% off eligible first orders, MAISON25 fallback; no first-100 or advertised candle claim. Revised 20 October 2026:
  struck prices carry a calculated "NN% off" tag (40-60%, fixed per product) and the desktop side tab reads "25% + up to 60% off".
- Prices show the new UAE Dirham sign instead of the letters AED (PR #6).
- Product names and URLs changed on 20 October 2026: every product has a brand-style name ("Eloise — Pink & White Rose Bouquet"), an
  Arabic name and a matching handle (`catalog/shopify-export/product-renames.json`). Old `/shop/<handle>` URLs redirect (next.config.ts).
  The data and images are renamed in the repository, and `npm run shopify:names-prices -- --apply` was run on 20 October 2026 (318 products,
  813 compare-at prices; live check passes). Re-run it only after changing `product-renames.json` or the ledger. Image alt text on Shopify
  still quotes the old names.
- Same-day delivery wording is as on main on 20 October 2026 (UAE-wide, no free JVC) and is still under owner discussion. AED 30 in Dubai,
  AED 50 elsewhere in the UAE (revised 20 October 2026; code change in PR #5). Four daily delivery windows, one-hour lead (shortened from three hours on 23 October 2026), 60-day horizon.
- Keep real gift brands and seasonal products. Do not publish competitor florist material.
- Money bouquet cash principal is separate; only the arrangement fee is paid/discounted online.
- Preserve working WhatsApp configuration; no public street address in LocalBusiness markup.

## Pending or not independently verified

1. Final Maison prices and the historical 52-product interim-price discrepancy. Ledger parity is not
   commercial approval or independent live-store verification.
2. Five unpublished product briefs: contents, prices, approved images and cash-handling details.
3. Shopify shipping, first-order discount enforcement, real checkout/payment, translations and webhook setup.
4. Production credentials, distributed enquiry limits, deployment behavior and the real WhatsApp number.
5. Native Arabic review and remaining image/content approvals.
6. Repository visibility and administrator-enforced main protection. CI does not itself protect main.
7. Bikanervala proposal reconciliation with current main; its unfinished work remains isolated locally.
8. Off-device backup. The verified sensitive recovery snapshot is local only.

See [live setup gates](DESIGN_MERGE_SETUP.md), [workspace locations](WORKSPACE.md),
and [historical reports](archive/README.md). Earlier reports describe their recorded stage, not current status.
