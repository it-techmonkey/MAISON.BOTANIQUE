# Shopify integration and merge plan

**Decision, 16 October 2026:** use the current bilingual editorial storefront as the visual and interaction baseline, connect it to Shopify for commerce, and add consent-aware storefront and checkout analytics. The GitHub branch is for review. Do not merge it into `main` until the owner explicitly approves that action.

## Branch and code strategy

- `main` in `it-techmonkey/MAISON.BOTANIQUE` is the original Next.js concept. `codex/editorial-storefront-preview` is a Vite/React replacement at the repository root. A normal merge would replace most Next.js files. Review it as a complete storefront candidate, not as a small component patch.
- Keep the current hero, horizontal collection, search, occasion/type filters, Arabic RTL flow, product details, gift note, preferred-date entry, as the starting point.
- Reuse the original repository's content separation and typed catalog idea where helpful. Do not import its unverified contact details, service promises, testimonials, product names, prices, or photos as real business data. Its images require source rights and actual-product checks.
- **Update, 17 October 2026:** the storefront was moved from Vite to Next.js 16 (App Router, TypeScript) to match the team's other headless Shopify builds and to render the catalog on the server. The design and bilingual behavior were ported unchanged. Catalog, cart, checkout handoff, Shopify analytics and the catalog webhook are implemented. On request, analytics track every visitor without a consent prompt, which supersedes the consent-first approach below; store configuration is in [docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md).

## Commerce work, in order

1. **Store setup and source data.** Create/configure the Shopify store and Headless sales channel. Publish approved products to that channel. Supply real product/variant IDs, SKUs, sizes, AED prices, inventory, descriptions, approved photos, translations, and category/occasion metadata. Keep private Admin credentials off the client.
2. **Catalog.** Replace sample product records and prices with Storefront API data. Preserve a stable mapping to the current design order and filters. Query the AE market and English/Arabic localization; use Shopify availability and merchandise prices as the source of truth.
3. **Cart.** Replace the browser-only sample bag with a persisted Shopify cart. Set buyer country to AE and carry each selected variant and quantity. Confirm that gift notes and the chosen date appear in the order/fulfilment workflow; a preferred date must be validated against real delivery capacity before it is promised.
4. **Checkout.** Send customers to the cart's Shopify-hosted `checkoutUrl`. Show the Storefront API cart cost and currency rather than local arithmetic, and verify discounts, tax, shipping, stock changes, checkout errors, abandoned/recovered carts, and English/Arabic handoff.
5. **Welcome offer.** A single code (BLOOM25, 25% off a first order, one use per customer) created in Shopify. Delivery is never free: AED 30 in Dubai and AED 40 elsewhere in the UAE, for every area.

## Analytics and privacy

- Define one event schema for storefront `product_viewed`, filter/search use, add-to-cart, and checkout start. Track only after the visitor's applicable consent choice. Avoid customer names, gift-note text, email, phone, or full addresses in analytics payloads.
- Use Shopify's Headless channel for sales attribution and Shopify's checkout customer events/Web Pixels for checkout progression and `checkout_completed`. Treat a browser completion event as a signal, not the only source of order truth; it can be missed if the page fails to load. Reconcile purchases against Shopify order reporting and deduplicate by a stable checkout/order identifier where the selected analytics destination permits it.
- Decide the reporting destination (Shopify reports alone, GA4, another platform, or a combination) before implementation. A custom Vite storefront needs its own consent-aware page and product event instrumentation; do not assume Shopify checkout pixels automatically measure browsing on this external site. Test the cross-domain journey and consent handoff.

## Review gates before any merge

1. Publish the branch and use its compare/draft-review view. Leave `main` unchanged.
2. Confirm asset rights, approved catalog and claims, final legal/contact content, and native Arabic copy.
3. Build and inspect desktop, phone, RTL, keyboard, and reduced-motion paths. Run a dependency audit against the committed lockfile before production release.
4. Complete end-to-end test orders in a non-production Shopify setup, including prices, shipping, promotions, refunds/cancellations, order attributes, and event reporting.
5. Configure Next.js hosting (`npm ci`, `npm run build`, `npm start`, or a Next.js host such as Vercel) with the environment variables from `.env.example`. Review deployment and domain/noindex (`SITE_INDEXABLE`) settings separately.
6. Ask the owner to review the branch diff and staging site. Merge only after explicit approval.

## Inputs still needed

Shopify store domain and authorized admin access; Headless public token (private tokens stay server-side); final catalog/variants and imagery; Arabic product translations; Dubai delivery rules; welcome offer terms; approved analytics destination and privacy/consent wording; final logo, contact details, and policies.

## Shopify references

- [Bring your own headless stack](https://shopify.dev/docs/storefronts/headless/bring-your-own-stack)
- [Headless channel and order attribution](https://shopify.dev/docs/storefronts/headless/overview)
- [Storefront API cart and hosted checkout](https://shopify.dev/docs/api/storefront/latest/objects/cart)
- [Localized storefronts and Markets](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/markets)
- [Web Pixels and customer events](https://shopify.dev/docs/api/web-pixels-api)
- [Checkout completed event behavior](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed)
- [Customer Privacy API for custom storefronts](https://shopify.dev/docs/api/customer-privacy)
