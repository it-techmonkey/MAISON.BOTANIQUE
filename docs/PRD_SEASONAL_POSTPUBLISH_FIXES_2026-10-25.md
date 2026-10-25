# PRD: Seasonal launch repair

**Date:** 25 October 2026
**Branch:** `fix/seasonal-postpublish-fixes`
**Baseline:** Created from `origin/main` at `577f4f0` (PR #35), then rebased onto `ed0017f` (PR #36 price fix)
**Status:** Implemented and verified in the review preview. Production release remains a separate owner decision.

## 1. Problem and outcome

Five seasonal products were published before their home sections and delivery guard reached production. The merged seasonal deployment failed because the live Shopify price check treated the seven new variants as unexpected ledger entries. On the public site, a customer could add the Marigold Toran, select a date before its stated 5 November start, and reach an enabled checkout button. The preview design works but has mobile scanability and campaign-end gaps.

**Outcome:** A production-ready PR whose preview builds with the live seasonal catalogue, whose checkout cannot accept a delivery outside a seasonal product's allowed dates, and whose English/Arabic seasonal sections remain clear on small phones. Do not change the approved hero, other catalogue sections, offer, Shopify prices or production settings.

## 2. Customer and business requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| R1 | Price gate recognizes the seven owner-priced seasonal variants separately from the historical ledger. | With a mocked live catalogue containing 822 ledger variants plus seven seasonal SKUs, price verification passes; a changed seasonal price, compare-at price, or unknown SKU fails. Preview/production build passes. |
| R2 | A seasonal item constrains the whole order's delivery date. | Toran checkout can use only its published preorder range. Halloween pieces can use dates through 31 October. A saved stale date is invalidated; checkout URL is not issued for a disallowed date. |
| R3 | Incompatible occasions have an understandable recovery path. | Halloween plus toran in one bag yields a bilingual “separate orders” explanation, disables checkout, and leaves remove controls available. No blank or impossible date picker is presented as a valid choice. |
| R4 | Campaign sections and offers expire. | Halloween shelf stops appearing after 31 October in Dubai; Diwali band stops appearing after its last sale/delivery date. Expired seasonal products do not expose a valid checkout date even if Shopify remains published. |
| R5 | Diwali message agrees with the available dates. | Band, product page, and picker use one approved end date and never suggest “today” outside the range. The generic 60-day hint is replaced by seasonal-specific copy when restricted. |
| R6 | Mobile cards and price are legible. | At 320, 360, 390 and 414 px, short Halloween display names and a swipe cue make the four products discoverable; toran “From” price is clear above its action, away from fireworks. Full product names remain on product pages and accessible links. |
| R7 | Existing storefront behavior stays intact. | English/Arabic RTL, reduced motion, keyboard navigation, cart options and standard non-seasonal delivery work. No page-level horizontal overflow at 320–1440 px. |
| R8 | Product detail claims match seasonal delivery and care. | Toran and Halloween pages state their actual date ranges; the toran page does not promise same-day delivery or give bouquet stem-trimming instructions. Product images render without a Next.js fill-parent warning. |

## 3. Scope and decisions

- **In scope:** seasonal price-gate regression coverage, seasonal catalogue metadata, delivery-range logic, bag and product picker copy, home seasonal components/styles, focused tests, and rollout verification. The price-gate implementation landed independently in PR #36 while this work was in progress.
- **Out of scope:** paid image generation, Shopify catalogue sync, physical product photography, changing prices, production merge, checkout payment submission, and the unrelated Shop All/hero work.
- **Halloween availability:** 25–31 October 2026 (from the currently live launch date through Halloween). This is a launch safeguard and can be shortened operationally by unpublishing stock.
- **Toran availability:** 5–15 November 2026. The owner explicitly chose to keep 15 November as the last delivery day on 25 October. The full range must appear in customer-facing copy.
- **Mixed cart policy:** one order has one delivery date. If seasonal ranges do not overlap, the customer must place separate orders; no automatic split or duplicate shipping charge is attempted.
- **Imagery:** the existing approved concepts stay in the preview. Before heavier promotion, operations must compare one physical sample per SKU with the displayed photo and contents. This is a release note, not a code substitute for sample verification.

## 4. Delivery sequence

1. **Recover the build.** Incorporate the seasonal price-check fix from PR #36; add a regression test for live seasonal variants and unexpected SKUs. Confirm the failure mode is resolved locally with mocked Storefront data.
2. **Harden dates.** Centralize Halloween and toran ranges. Validate persisted cart schedules and checkout against the range; make non-overlapping ranges explicit. Update date picker and product copy without changing unrelated delivery rules.
3. **End campaigns cleanly.** Hide past-date home bands based on Dubai date. Keep product pages functional as information, but prevent post-campaign checkout while products remain published.
4. **Polish the approved design.** Shorten display names only in the Halloween shelf, add a mobile swipe cue, and move the Diwali price above its button on phones. Preserve images, headline, palette and section order.
   Align seasonal product-page delivery and care text with the product form and repair the image wrapper warning found during browser QA.
5. **Verify and ship for review.** Run JS tests, Python tests, typecheck, production-mode build, live/preview browser checks in English and Arabic at 1440/414/390/360/320, reduced motion and shopping flow. Push the review branch, open a PR, inspect the GitHub/Vercel preview, and report any limitations. Do not merge to `main`.

## 5. Risks and release gate

- Shopify is the live source. The Vercel price gate must fail on unknown live products rather than silently accepting them. The seasonal exception is limited to the seven named SKUs and their stated prices.
- A product may remain published after its campaign. Code must block impossible dates independently of Shopify visibility; operations should still unpublish or update stock when the campaign ends.
- One physical sample per product and the toran mounting/length details require operational verification. Code and generated images cannot prove fulfillment fidelity.
- A successful local build is insufficient. **The PR is ready only when its Vercel preview succeeds and the date picker/bag are checked in that preview.** Production promotion and merge require owner approval under workspace rules.

## 6. Progress ledger

| Step | Status | Evidence |
| --- | --- | --- |
| Fresh isolated worktree | Done | Created from `origin/main` at `577f4f0`; rebased onto `ed0017f` after PR #36 merged. |
| PRD | Done | This document |
| Price gate | Verified in tests and deploy | PR #36 added seven seasonal variants outside the historical ledger. This branch adds a mocked paginated Storefront test that passes with the ledger and rejects changed prices, changed compare-at, and unknown SKUs. The Vercel preview build succeeded; the local build did not independently check live Shopify prices. |
| Delivery and conflict rules | Verified | Toran 5–15 November, Halloween 25–31 October, mixed-cart and ended-window cases pass unit and browser tests. Cart checkout checks product handles even if a live product disappears from the catalogue. |
| Campaign expiry | Verified locally | Frozen Dubai-clock browser tests hide Halloween after 31 October and Diwali after 15 November, and disable ordering after each window. |
| Mobile and Arabic polish | Verified locally | English and Arabic visual review at 390 px; 320 px seasonal visual review. No horizontal page overflow at 1440, 414, 390, 360 or 320 px. Reduced-motion check passes. |
| Tests and browser QA | Done locally | 44 Node tests, 5 Python tests, typecheck, production-mode build, and 32 Playwright flows passed. Product page and bag were checked for date copy, error recovery, the 5 November quick choice, and no Next.js image-parent warning. |
| Review PR and preview | Done | [PR #37](https://github.com/it-techmonkey/MAISON.BOTANIQUE/pull/37); [Vercel preview](https://maison-botanique-git-fix-seasonal-p-3356b2-techmonkeys-projects.vercel.app). Vercel and GitHub checks passed; all four seasonal Playwright flows passed against the deployed URL. Production merge awaits owner approval. |
