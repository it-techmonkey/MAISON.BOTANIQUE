# Organic growth foundations — review specification

25 October 2026. User authorised implementation and scheduled drafting/checks. Production publication still requires the owner's specific PR approval. The private growth operating plan lives in the parent workspace at business/growth/OPERATING_PLAN.md; it and customer records are not part of this public repository.

## Scope

- Two useful commercial entry points: `/occasions/birthday` and `/occasions/love` with current catalogue filtering.
- A small journal at `/journal`, initially containing birthday-card messages and sending flowers to Dubai from abroad. Complete text, not empty article templates.
- Matching `/ar/` routes with Arabic in initial HTML, translated titles/descriptions, self canonicals, reciprocal language alternates and sitemap entries.
- Language switch moves between equivalent new URLs, preserving the existing store provider and bag. Old product/shop routes keep their existing saved language behaviour.
- Header, occasion tiles and footer use the new occasion destinations for these two supported subjects. Other occasion filters and Gifts for her retain their existing destinations.
- Ordering answers on landing pages and two extra general FAQ answers; product pages show card/size answers and the existing Shopify answer summary when supplied.
- `/shop` uses the existing collection title as its H1; home and occasion collections retain H2.
- Dependency-free read-only public-HTML audit, plus regression coverage. No new SaaS, paid AI calls or public community posts.

## Baseline, decision and copy checks

This is an extension of the approved storefront, not a new visual direction. Reuse the collection browser, product cards, quick-add, header, footer and FAQ details. Preserve home composition, seasonal artwork/placement, product images/prices/contents, four promises, welcome offer, JVC switch, checkout and working WhatsApp number. No new image generation or motion layer. Older removed occasion designs are not restored.

Current source tokens: paper #F5F2EB, sand #EEEAE2, ink #26332B, muted #5D665B, wine #673C43; Cormorant Garamond display, DM Sans body, Noto Naskh Arabic. New content heading: 32–64px desktop fluid, 30–42px mobile, weight 400, tracking −.015em; Arabic tracking 0 and line-height 1.4. New paragraphs: 17px desktop / 16px phone, line-height 1.7, full ink. New body/link text minimum 16px. The preserved global store has legacy smaller utility labels; do not misreport a whole-site typography pass.

Signature content idea: Maison's handwritten card becomes the useful starting point for buying birthday flowers. The existing occasion collection and card field supply the interaction. Short practical guides support a matching selling task rather than unrelated traffic.

Claims: same-day Dubai only, subject to available windows and one-hour lead; 60-day ordinary horizon, seasonal dates separate; AED 30 Dubai / AED 50 other UAE, JVC copy only behind the existing switch; payment acceptance only as offered at checkout. No new savings claims, shipping promises, physical product counts, qualifications, customer reviews or outcome statistics are invented. Native Arabic review remains an owner gate.

## Architecture limits

This pilots translated URLs for these content pages. It does not migrate all existing product/collection/help URLs. The root HTML keeps its existing static language default, while the store wrapper and article carry server-rendered lang/dir and Arabic text; hydration updates document lang/dir as before. Verify the actual source and rendered page rather than claiming a whole-site international SEO migration.

Journal edits are reviewed source changes: AI drafts stay outside the public repository until reviewed. No CMS, unauthenticated content-writing endpoint or paid generation API is added. Preview noindex follows the existing SITE_INDEXABLE environment gate. Search appearance and FAQ rich results are not guaranteed; no FAQPage markup or invented product review ratings are added.

## Acceptance checks

1. Node tests, Python tooling tests, typecheck, build and dependency audit.
2. New EN/AR routes return 200 with one H1, correct canonical/alternates, readable complete content and matching sitemap entries. Unknown guides are 404; non-pilot occasions retain redirects.
3. Arabic appears without JavaScript; language switching preserves the bag. Existing browsing, offers, saved dates, product options and checkout handoff regressions run without paying/submitting enquiry forms.
4. Screenshots and overflow checks at 1440, 414, 390, 360 and 320px; reduced motion; focus and FAQ keyboard access. Inspect home preservation and the product-page additions as well as new pages.
5. Review the GitHub-connected Vercel preview and CI. Keep live purchase, authenticated search/feed metrics, physical product parity and native Arabic marked unverified unless independently checked.

## Repeatable commands

```sh
npm test
python3 -I -m unittest discover -s tests -p 'test_*.py'
npm run typecheck
npm run build
npm run growth:check -- --base http://localhost:3012 --growth
E2E_BASE_URL=http://localhost:3012 npm run test:e2e
```

The check reads only public HTML; it cannot establish Google indexing, human page experience, actual payment success or attribution continuity. Default live scope excludes new pages until deployed. Use --growth after deployment or against the review build. An unreachable origin returns early so a scheduled run does not repeat the same timeout on every path.
