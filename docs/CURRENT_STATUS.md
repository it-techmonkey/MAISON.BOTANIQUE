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
- Cleanup branch: `cleanup/workspace-organization`. Neither local nor remote main is changed by cleanup.
  Local main remains stale; branch from fresh `origin/main`.

## Governing owner decisions

- Signature / Grand / Luxe; only flowers multiply; one Signature photo per product.
- No product counts in customer UI. Paper/ivory backgrounds; Cormorant Garamond italic for card previews.
- Preserve the current three-product scroll hero, arrows, approved headline and four promises.
- 25% off eligible first orders, MAISON25 fallback; no first-100 or advertised candle claim.
- Same-day promise is Dubai only. Free JVC requires the full recipient address; AED 30 elsewhere in Dubai,
  AED 40 elsewhere in the UAE. Four daily delivery windows, three-hour lead, 60-day horizon.
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
