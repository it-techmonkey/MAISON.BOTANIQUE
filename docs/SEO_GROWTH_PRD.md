# Maison Botanique organic search growth PRD

**Version:** 21 October 2026. **Source:** owner-provided “Search plan for maisonbotaniqueflowers.com” (21 October 2026), checked against fresh `origin/main` at `224ebcc` and the live domain. **Status:** Phase 1 code in review; production indexing remains closed.

## Recommendation and boundaries

First make the existing store discoverable and trustworthy. Then publish a small number of useful shopping pages for real occasions, products, and delivery questions. Build authority through genuine reviews and relevant editorial mentions. Use Google Search Console and Bing Webmaster Tools to decide what to improve. Do not buy a mass-directory package, produce weekly filler blogs, or keep resubmitting unchanged URLs.

The search destination is `https://www.maisonbotaniqueflowers.com`. The bare domain currently redirects there. Shopify is the live product and price authority. The owner must separately approve any change to `main`, production, Shopify, DNS, or paid tools. Do not use the destructive catalog seed script for SEO edits. Preserve the approved hero, shopping flow, Arabic interface, offer, size rules and gift curation. No public street address or invented delivery promise.

## Baseline and evidence

| Finding on 21 Oct | Evidence | Effect |
| --- | --- | --- |
| Search is closed | Live `robots.txt` says `Disallow: /`; root layout has `noindex, nofollow` while `SITE_INDEXABLE` is not `true`. | Public pages are not currently eligible for ordinary indexing. |
| Canonical host differs | Bare domain returns a 308 to `www`; code fallback and `.env.example` use bare domain. Production environment value is not visible here. | Canonicals/sitemap may point to a redirect. |
| Shopify-style paths fail | The real Eloise handle loads on `shop./products/eloise-pink-and-white-rose-bouquet`, while the matching live `www/products/eloise-pink-and-white-rose-bouquet` returned 404. | Product discovery routes can lose shoppers. |
| Search pages are thinly linked | Main navigation uses filters or fragments; `/shop` is rendered largely from client state. | Important themes have no strong crawlable landing URL. |
| Product answers are unused | `answerSummary` and `faq` load from Shopify but are not visible on product pages. | Helpful answers are absent from the rendered page. |
| Delivery claims conflict | Maintained owner decision says same-day Dubai; current product and delivery copy says same-day across the UAE. | A factual launch review is necessary before inviting search traffic. |

The attached plan's search volumes, ranking difficulty, AI citation patterns, and one-to-two-week indexing forecast are hypotheses, not measured Maison data. Search Console access, Business Profile eligibility, live checkout, and Merchant Center status are unverified. A sitemap or recrawl request does not guarantee indexing or higher rankings.

## Goals and measurements

**Primary business goal:** profitable orders from non-brand organic search, not raw impressions. Track organic first landing page → product view → add to bag → checkout → order/revenue. Compare after discounts, product cost and delivery cost. The existing 25% eligible first-order offer and displayed 10% struck-price tags affect margin; final product economics remain unresolved.

**Leading indicators:** eligible/indexed canonical pages; non-brand impressions and clicks by page/query; product rich-result eligibility; Google Business Profile actions/reviews if eligible; Bing AI citations where reported; crawl 404s from Shopify sources. Measure weekly trends against a launch baseline and annotate site changes. Segment English and Arabic when Arabic URLs exist.

**Pilot:** 1 occasion collection, 1 useful Dubai delivery page, a National Day collection/guide if approved, and visible answer blocks on 20 real best sellers. Continue only when pages are crawlable, accurate, receiving relevant impressions, and some visitors progress toward a bag or order. Review after 4 and 8 weeks; do not treat 14-day indexing or an order as guaranteed pass/fail criteria.

## Delivery plan

### Phase 0 — ownership and factual launch gate (this week)

1. Owner identifies who controls Google Search Console, Bing Webmaster Tools, Google Business Profile, Shopify theme, and Vercel production variables. Search existing properties/listings before creating duplicates.
2. Confirm the public canonical host (`www` is the current redirect destination). In Vercel set `NEXT_PUBLIC_SITE_URL=https://www.maisonbotaniqueflowers.com` for production after the review branch is approved and before opening indexing. Set verification tokens only after the respective search property is created.
3. Verify delivery by emirate, fees, JVC address rule, daily cut-off, real checkout and support channel. Rewrite every public same-day claim to match the verified operation. The maintained decision is same-day Dubai only; the present live copy is broader. This is a launch blocker, not a reason to invent a new promise.
4. Inspect Google Business Profile eligibility. A service-area business needs a genuine staffed/operational address for verification; hide it publicly if customers do not visit. Do not create a virtual-office profile or publish the address just for SEO.
5. Take a read-only live Shopify/product and compare-at-price review before any Merchant Center feed. Never overwrite current Shopify data with recorded exports.

**Exit:** one factual delivery matrix and one canonical domain, plus owners for each external account. No live indexing switch yet.

### Phase 1 — technical launch foundations (current review PR)

| Requirement | Implementation | Acceptance |
| --- | --- | --- |
| Recover Shopify-style links | Permanent `/products/:handle` → `/shop/:handle`, old renamed handles direct to new handles, `/products` and `/collections/all` → `/shop`, three policy paths → matching policy pages. | Representative old/current URLs reach a 200 page without a 404 or redirect chain. Hydrogen checkout/account routes still work. |
| One canonical host | Code fallback and sample environment use `www`; home gets a self-canonical. | Home/product canonical, sitemap and schema use the same host in a production-like build. |
| Clean sitemap | Exclude `frontpage` and empty collections; use Shopify `updatedAt` for real product/collection `lastmod` when available. | Sitemap contains only intended public URLs and truthful modification dates. |
| Site identity | Organization/WebSite schema without an unverified address or phone; product seller references the shared organization; product breadcrumb schema. | JSON-LD parses; URLs match the canonical host; no false LocalBusiness claim. |
| Verification hooks | Optional Google and Bing meta tokens via environment variables. | Tags appear only when values are configured. No token in Git. |
| Search-ready home snippet | Clear title/description naming flowers and Dubai, while preserving the approved visible headline. | One H1 and canonical `/`; no unapproved delivery guarantee. |
| Consistent delivery wording | Replace UAE-wide same-day wording in EN/AR visible copy and metadata with the maintained Dubai-only same-day scope. | No page promises same-day service outside Dubai; checkout eligibility still requires a separate live test. |

Run `npm test`, Python tooling tests, `npm run typecheck`, `npm run build`, and a preview crawl. Check EN/AR, 1440/414/390/360/320 px, reduced motion and the buying flow for visible changes. Open a review PR and Vercel preview. Do not merge or set `SITE_INDEXABLE=true` as part of the PR.

**External dependency:** Shopify's `shop.` theme currently creates its own indexable redirect surface. Review its theme and use a working server-side or equivalent permanent redirect to the correct `www/shop/...` URL where possible. If a canonical/noindex template is needed, allow crawling so search engines can see it. Preserve checkout and legitimate Shopify agent endpoints. Verify the exact live theme behavior before editing it.

### Phase 2 — crawlable commercial pages (weeks 2–4 after launch approval)

1. Keep the current occasion filtering experience, but give high-value occasions real collection URLs. Start with Birthday. Use a Shopify collection or a server-rendered equivalent backed by the live product tags. Link it from home, menu, related products, and sitemap. The old `/occasions/birthday` can redirect there. Avoid a return to discarded standalone layouts.
2. Give `/shop` a server-rendered H1 and initial product links or progressive pagination. Ensure links work without JavaScript. Link real flower/category collections from primary navigation; do not canonicalize meaningful product groups to generic `/shop`.
3. Show each product's approved `answer_summary` and FAQ text in the visible page, in EN/AR where reviewed. The answer should state exact contents/size, gift use, delivery/card facts only when verified. Start with 20 best sellers. Add FAQ markup only for visible, accurate answers; do not expect FAQ rich results.
4. Add collection breadcrumb/ItemList markup where the rendered grid matches it, descriptive image alt, and a short human-written introduction. No product counts in UI.
5. Create one National Day gift page by 10 November only if real products, imagery, stock and delivery copy are approved. Link it to relevant products and update the same URL in later years. Do not publish a page merely to hit a date.

**Exit:** each pilot URL returns 200, self-canonicalizes, is in the sitemap, is linked from a crawlable page, contains useful unique information, and leads to the existing add-to-bag flow.

### Phase 3 — local trust, content and performance (days 30–90)

1. If eligible, complete Google Business Profile as a service-area business with exact business name, real phone/site, suitable category, service areas, hours, authentic images and a review-request process. Ask customers after delivery without rewards or review gating. Explore Bing Places only if UAE service-area eligibility is confirmed; Bing Webmaster Tools is separate and should still be set up.
2. Publish a Dubai delivery page with the verified fee, cut-off, windows, neighbourhood coverage and practical delivery answers. Consider Abu Dhabi, then JVC only if each page has real distinct operational information. Avoid templated suburb pages and doorway pages.
3. Add Google Merchant Center free listings through Shopify after feed eligibility, landing URLs, price/availability/shipping/returns and compare-at prices are reconciled. Confirm any Shopify AI shopping channel availability in the UAE before planning around it.
4. Reduce the full-catalogue payload sent on every page, coordinated with the existing performance worktree. Measure mobile Core Web Vitals with PageSpeed/CrUX after real traffic exists. Prioritize an observed bottleneck rather than a speculative score.
5. Build Arabic URL versions only with complete main-content translation, native review, correct `lang`/`dir`, self-canonicals and reciprocal `en-AE`/`ar-AE` hreflang. The existing browser-only Arabic switch does not create Arabic search landing pages.

### Phase 4 — repeatable growth (quarterly)

Use Search Console queries to choose one page with commercial intent and a realistic opportunity. Improve its answer, product selection and internal links, then let it be recrawled. Publish original seasonal or care content when it serves a customer decision; a useful guide every 2–4 weeks is a starting capacity, not a ranking quota. Pitch editors and real UAE gift guides with specific products and photography. Record actual earned links and referral sales. Refresh or merge weak pages quarterly. Plan Ramadan, both Eids, Valentine's and UAE Mother's Day 8–10 weeks before the event; confirm lunar dates closer to launch.

## Operating calendar and automation

| Cadence | Human task | Safe automation / trigger |
| --- | --- | --- |
| Once at launch | Verify Google Search Console and Bing Webmaster Tools, submit the canonical sitemap, inspect home and 3 priority pages, then approve `SITE_INDEXABLE=true` after all gates pass. | CI checks sitemap/redirect/canonical invariants on every PR. |
| Weekly, 30–60 min | Review queries, indexed-page issues and organic landing-to-order data. Choose one page to improve; answer genuine customer questions; request reviews after completed deliveries. | One read-only Monday digest of Search Console, Bing and PostHog if account access is connected. Alert on new 404s/indexing failures. Quiet when nothing meaningful changes. |
| Every 2–4 weeks | Publish or refresh **one** useful guide/occasion page if product facts and images are ready. Review top competing results before drafting. | Draft outline and internal links for owner review; no automatic publishing or Shopify writes. |
| Monthly | Check selected rich results, mobile CWV, listing accuracy, actual organic orders and Bing AI Performance. Audit the 20-product pilot. | Export a time-series report; record publication and site-change dates. A small fixed AI-question sample can be directional, never a ranking KPI. |
| Quarterly | Decide which themes/pages to expand, consolidate weak content, review margin and editorial mentions. | Seasonal deadline reminders; dated content inventory. |

**Reindexing rule:** Google discovers updated URLs through internal links and sitemaps. Use URL Inspection to request a crawl for an important new or corrected URL once; do not submit the same unchanged URL weekly. Indexing and ranking are not guaranteed.

**Yellow Pages and directories:** This means adding a consistent business listing on a legitimate directory, not linking the website *to* a directory for a ranking boost. First prioritize an eligible Google Business Profile, then relevant consumer-facing UAE maps/listings. Review a specific Yellow Pages UAE listing only if it accepts the true service-area model, displays the correct website/contact and has a free or clearly justified plan. Avoid bulk citation packages, fake addresses, paid links and duplicate profiles. Check directory referrals in analytics; keep listings that customers use.

## Page ownership and approvals

| Work | Owner | Approval before public release |
| --- | --- | --- |
| Code, CI, preview and PR | Codex/developer | Owner merge approval |
| Product facts, delivery matrix, discounts, compare-at prices | Owner/operations + Shopify live data | Owner factual approval |
| EN/AR commercial copy and seasonal selections | Marketing draft + native Arabic editor | Owner editorial approval |
| Search Console/Bing/GBP/Merchant Center accounts | Owner account administrator | Owner access and eligibility confirmation |
| Shopify theme redirects and feed settings | Shopify administrator | Owner review of exact settings |

## Decision log from the attachment

**Accepted:** indexability and canonical issues are urgent; Shopify product links must resolve; occasion demand needs a crawlable route; answer-first product copy should use real Shopify data; official webmaster tools and eligible local listings matter.

**Changed:** do not promise a one-week opening, 14-day indexing or 3–6 month rankings; do not create a 30-prompt weekly AI scorecard as a primary KPI; do not produce blog posts on a fixed weekly quota; do not create `llms.txt` in the launch critical path; do not add LocalBusiness markup without verified eligibility/details; do not publish area pages by swapping place names.

**Pending owner facts:** existing account ownership; verified service-area address; actual same-day coverage; correct Shopify storefront redirect/theme behavior; social profiles; Merchant Center channel eligibility; final prices and compare-at reference prices; native Arabic approval.

## Reference guidance

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) and [Google: AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): ordinary crawlability, useful content and merchant data matter; special AI files are not required.
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), and [indexing FAQ](https://developers.google.com/search/help/crawling-index-faq): sitemaps and requests aid discovery, not guaranteed indexing/ranking.
- [Google: Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization), [Business Profile eligibility](https://support.google.com/business/answer/3038177), [local ranking](https://support.google.com/business/answer/7091), and [spam policies](https://developers.google.com/search/docs/essentials/spam-policies).
- [Bing: AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c) reports citations, not traffic or a ranking score. [Google Merchant Center free listings](https://support.google.com/merchants/answer/13692890) require eligible, approved products.
