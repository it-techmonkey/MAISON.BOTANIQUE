> Historical record. Use [current status](../CURRENT_STATUS.md) for the maintained project state.

# Design merge: implementation and verification

19 October 2026. Branch `design-merge`, separate worktree `mb-design-merge/`, based on GitHub `origin/main` at `7f3658f`.

**Local production-build preview:** http://localhost:3014

No push, pull request, Vercel deployment, production merge, Shopify write or image spending has occurred in this chat. The branch is committed locally. Before/after screenshots and browser evidence live in this `review/` folder. Requirement-labelled commits include subsequent validation fixes; they have not been consolidated into exactly one commit per requirement.

## Requirement status

| ID | Status | Evidence / remaining work |
|---|---|---|
| R1 | Implemented and checked | Three-product scroll-held hero, arrows, approved headline, Add to bag sheet, occasion link, paper fade, four promise icons with same-day Dubai wording. Reduced motion uses arrows without pinning. |
| R2 | Implemented and checked | Complete home collection after home sections; no repeated occasion circles. Home hash filtering and standalone `/shop` retained. |
| R3 | Implemented and checked | Scrolling bilingual ribbon, no code in its visible text or accessible name, reduced-motion static message. Same-day wording is Dubai only per the owner's correction. |
| R4 | Implemented and checked | MAISON25 defaults, unified EN/AR wording, no stacked-discount claim, truthful unsaved-contact fallback. Invalid legacy saved offer codes are discarded. |
| R5 | Website implemented; live shipping pending | Full recipient delivery address requested at checkout. AED 30 Dubai / AED 40 other UAE copy; no free-delivery area. Approved daily four-window picker, three-hour lead, 60-day horizon. Shopify rates are not configured or verified here. |
| R6 | Implemented and checked | Makeup & Beauty and Money groups. Money stays hidden with no products, becomes visible from one. Owner-approved 24-product Gifts for her selection enforced in both catalogue adapters, internal `just-because` retained, canonical new URL and permanent old URL redirect. No Shopify tags changed. |
| R7 | Implemented | “A gift for every gesture” / “هدية لكل لفتة”; approved four price bands, shared across tiles/menu/filters; mobile tiles remain one horizontally scrollable row. Most loved retained. |
| R8 | Implemented | Residences retained, non-exclusive wording, corrected fees and collection action. |
| R9 | Implemented | Existing footer retained, delivery copy added, small non-logo labels raised. |
| R10 | Implemented and checked | `/jvc` permanently redirects to `/?offer=open`; popup opens despite previous dismissal. |
| R11 | Implemented and checked | Ten language/width combinations have no document overflow and no rendered text below 11px outside excluded wordmarks/screen-reader-only nodes. Hero text, details and controls do not overlap. |
| R12 | Drafts prepared; publication blocked on facts | Five unpublished product briefs and owner review page prepared. Separate arrangement fee/cash principal process confirmed. Exact flower counts, plush sizes, Maison prices, approved images and final cash instructions remain pending. |
| R13 | Ledger parity checked; live verification pending | Reconciled all 822 variants (previous bundle had only 809). Products, size prices, increments and rounded compare-at values validated. Regeneration reapplies the approved ledger. Build runs the validator. Competitor repricing requires explicit flag. No Storefront credentials are available locally, so no independent live Shopify match is claimed. |
| R14 | Code and local checks complete; firewall activation pending | WhatsApp clears buy bar and hero arrows. Consent control explicitly identified. Streamed 16KB input limit, origin validation, five attempts per ten minutes per instance. Product/Offer/LocalBusiness JSON-LD without a public street address. Long server-only catalogue text removed from browser data without removing search/customisation facts. Distributed Vercel firewall rule still needs setup. |
| R15 | Implemented and mocked; live verification/setup pending | Customer-bound deterministic one-use codes, first-order signup check, optional marketing consent, encrypted HttpOnly contact cookie, optional bag signup and automatic cart discount/buyer identity. Discount/session secrets and dedicated permissions required. See eligibility limitation below before launch. |
| R16 | Instructions updated; external setup pending | Root CLAUDE.md updated and copied to AGENTS.md; brand documents updated. Setup checklist committed. GitHub account has WRITE access, not ADMIN; it cannot enable branch protection. Hosting secrets, firewall and webhook registrations remain pending. |

## Verified

- Bundled Node 24.19.0; `npm ci` completed.
- `npm test`: nine checks passed. These cover optional offer consent, required newsletter consent, encrypted cookie integrity/expiry, byte limits, request limits, budget boundaries, Money threshold, customer-specific code creation/reuse/first-order rejection, timeout recovery, no SMS subscription without consent and preservation of shopping/search data during projection.
- `npm run typecheck`: passed.
- `npm run build`: passed, generating 349 static pages/routes. The initial sandboxed build could not fetch Google Fonts; the successful build used approved network access.
- `python3 -I scripts/check_prices.py`: all 822 variants match the approved ledger. Live Shopify explicitly not checked.
- `npm audit --omit=dev`: zero known vulnerabilities at the time checked.
- Actual local enquiry endpoint returned the expected 422, 413, 403, five 503 responses without credentials, then 429. No Shopify writes occurred.
- Production-build browser checks: English and Arabic at 1440, 414, 390, 360 and 320px. All ten screen checks passed; all eight flow groups passed; no uncaught browser errors.
- Flow groups: hero scroll/arrows/occasion link; quick-add size/card/signature to bag/delivery/preview checkout; home Makeup/search; truthful popup 503 fallback with unchecked marketing consent; successful personal-code response; JVC and occasion redirects/canonical; product markup and WhatsApp placement; reduced motion.
- Personal-code responses and signup failures were mocked in the browser. No real customer, order, discount or checkout transaction was created.
- Before/after local home HTML measurement for the browser-data change: 786,878 → 682,738 bytes, reduction 104,140 bytes (13.2%). This is an uncompressed local development response measurement, not a production network benchmark.

Evidence: `design-merge-browser-qa.json`, `design-merge-after-{en,ar}-{width}.png`, `design-merge-before-{width}.png`, `design-merge-bag-mobile.png`, `design-merge-product-desktop.png`, `design-merge-offer-fallback.png`. Baseline screenshots were captured in English; before/after Arabic baseline screenshots were not captured. Arabic after screenshots were captured at all five widths.

The design-skill inspector was also run. Its art-direction rules flag the existing approved eyebrows, tracked labels, hairlines, button shadow and 11px/13px text scale; these differ from its generic house rules and were retained to honour the approved design. It also inspected with the intentionally automatic offer modal open, so covered-text findings from that run are not evidence of hero collisions. Independent browser checks dismissed the offer, measured overlap and exercised the controls. Full inspector output is retained under `design-merge-inspector/`; it is not represented as a clean inspector pass.

## Launch gates / limitations

1. **Five products:** owner still needs to confirm missing contents and Maison prices. No made-up flower counts, plush sizes, cash denominations or fees were published. Images have not been generated or paid for. Review: `design-merge-new-products-review.html`.
2. **Live Shopify:** credentials are absent in the local worktree; snapshot parity is not live-store verification. Shipping, personalised discount creation, buyer identity/discount acceptance and real checkout still need approved live testing.
3. **First-order enforcement:** signup and automatic application reject customers with prior orders. A Shopify customer-ID-bound basic discount alone does not guarantee rejection if someone signs up, places another order and later enters the old unused code directly in hosted checkout. MAISON25 also needs a real first-order eligibility rule, not merely once-per-customer. This must be resolved/verified in Shopify before launch; it is not claimed complete by the mocked tests.
4. **Contact handoff:** requires `OFFER_SESSION_SECRET`. Individual codes require `SHOPIFY_DISCOUNTS_ADMIN_TOKEN` and `OFFER_CODE_SECRET`. Public code fallback remains available, but successful automatic live redemption is not verified.
5. **Rate limit:** route memory is per server instance; a platform firewall rule is needed for a shared production limit. No new paid service or plan was purchased.
6. **WhatsApp:** existing production configuration was not changed. The only local env value found was the pre-existing test number `971500000000`; local layout tests used that value. The actual production customer-facing number has not been independently verified. The ignored local environment file was not committed.
7. **GitHub protection:** connected account reports WRITE permission; an administrator must configure the prepared main-branch rule.
8. **Publishing:** pushing the branch creates a Vercel preview. The workspace requires the owner's approval before publishing, so the remote preview/PR step is awaiting that approval. Production merge requires a separate explicit yes.

The exact setup checklist is `mb-design-merge/docs/DESIGN_MERGE_SETUP.md`.
