# Maison Botanique — private storefront concept

An English and Arabic flower storefront for Dubai. Maison Botanique is the confirmed brand name; the owner corrected the website domain to `maisonbotaniqueflowers.com` on 16 October 2026. The product catalog, AED prices, images, copy, and delivery language are provisional. The public should not place orders from this concept. The Sites preview is publicly viewable for review but remains noindex, and the domain is not connected to it yet.

## Run locally

Next.js 16 (App Router, TypeScript). Node 22.18 or newer.

```sh
npm install
cp .env.example .env.local   # leave the Shopify values empty for the sample preview
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
npm run typecheck
```

With the Shopify values empty, the site runs the design preview: the exported catalog in `src/data/collection.json` (images in `public/collection/`) and a cart saved only in the browser. Filling in the Storefront API values switches the whole site to the live Shopify catalog, cart and checkout. Store setup is described step by step in [docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md).

## How the code is organised

| Path | Purpose |
| --- | --- |
| `src/app/(store)/layout.tsx` | Shared store shell: loads the catalog once (ISR, refreshed every 5 minutes or by webhook), header, footer, bag, language. |
| `src/app/(store)/` | Pages: home, `/shop`, `/shop/[handle]`, `/collections`, `/collections/[handle]`, `/occasions`, `/occasions/[occasion]`, `/services`, `/atelier`, `/contact`, `/delivery`, `/faq`, `/privacy`, `/terms`. |
| `src/app/api/enquiry/route.ts`, `src/lib/shopify/forms.ts` | Newsletter, contact and enquiry forms, stored in Shopify (customers + "Website enquiry" metaobjects) through a forms-only Admin token. Without it the forms offer a prefilled email. |
| `src/app/jvc/` | The `/jvc` opening-offer proof, with its own stylesheet. |
| `src/app/api/revalidate/route.ts` | Shopify webhook target; verifies the HMAC signature and refreshes the catalog cache. |
| `src/components/store/` | Store UI: provider (locale, cart, quick-add, toast, offer), header with the offer ribbon and Shop menu, footer, `CollectionBrowser` (occasion tiles, tabs, search, Refine drawer, sort), `ShopSheets` (quick-add sheet with card preview, bag with delivery picker), `LaunchOffer`, `WhatsAppButton`, product cards, forms, page blocks. |
| `src/components/Turntable.tsx` | Pinned home hero; falls back to a static hero when no products are featured. |
| `src/lib/site.ts`, `src/lib/catalog-groups.ts` | Non-catalog content (occasions, services, contact details) and the shop groups (rooms, flowers, formats, budgets) computed from the live catalog. |
| `src/lib/delivery.ts`, `src/lib/whatsapp.ts` | Delivery windows and cutoff (Dubai time), and click-to-chat links and opening hours. |
| `src/lib/shopify/catalog.ts` | Loads every published product and collection from the Storefront API, including the `maison.*` storefront metafields and tags. |
| `src/lib/shopify/cart.ts` | Storefront Cart API: create, add, update, remove, checkout URL. |
| `src/lib/cart/use-shop-cart.ts` | Cart hook used by the UI; Shopify cart when configured, browser-only preview cart otherwise. |
| `src/proxy.ts` | Hydrogen's same-origin Storefront API proxy and Shopify routes; Shopify sets its analytics/checkout cookies through it. |
| `src/lib/analytics/` | One tracking facade (`track.ts`) feeding PostHog and Shopify's analytics bus (`shopify.ts`). |
| `src/instrumentation-client.ts` | PostHog initialisation, relayed through `/mb-relay` (see `next.config.ts`). |
| `src/app/api/webhooks/orders/route.ts` | Order and refund webhooks: records the order lifecycle in PostHog server-side. |
| `catalog/` | The catalog pipeline: Shopify export and hand-off (`catalog/shopify-export/`), image-generation pipeline, review pages. |
| `scripts/match_prices.py`, `scripts/shopify-catalog-sync.mjs` | Prices from the research data (`npm run catalog:prices`), and the push of the catalog into Shopify (`npm run shopify:catalog`). |
| `scripts/build_collection.py` | Rebuilds `src/data/collection.json` and `public/collection/` from the export. |
| `scripts/shopify-auth.mjs` | One-time Admin API authorization for the client transfer store (`npm run shopify:auth`). |

## Shopping flow

A scrolling offer ribbon sits above the header (it opens the opening-offer sign-up). The header has a Shop menu (by occasion, flower, format and budget) and direct links that filter the collection in place (`/#roses`, `/#occasion/birthday`, `/#search`; shareable). The home hero shows three featured pieces, moved with its arrows, and leads into the collection: shop-by-occasion tiles, tabs, search, a Refine drawer (occasion, budget, stem count, with live counts), sorting and a four-across grid loading 24 at a time. Every piece opens the quick-add sheet: choose a size, add any personalisation, write the card with a live preview, sign it or keep it anonymous, and add it to the bag. The bag holds one delivery day and time window for the whole order (Dubai time) and offers WhatsApp ordering.

The bag is a real Shopify cart: Shopify calculates the subtotal; the card text, signature and personalisation travel on each line, and the delivery day and window on the cart, so they appear on the order. "Continue to secure checkout" sends the shopper to Shopify's hosted checkout in their language. Delivery options, tax, shipping, discounts and payment are configured in Shopify. Never place Admin API credentials in `NEXT_PUBLIC_` variables.

### Catalog data

Shopify is the source of truth for products. The catalog in `catalog/shopify-export/` (318 products, 822 variants, images) is pushed with `npm run shopify:catalog`, using prices matched to the research data by `npm run catalog:prices`; the storefront fields (card lines, occasions, flowers, format, stems, display order, hero) come from `src/data/collection.json` (`python3 scripts/build_collection.py`). After the push, edit products in the Shopify admin; the site picks up changes within seconds (webhook) or five minutes. See [docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md), step 5.

Shopify is the selected production commerce direction. The staged implementation and merge gates are recorded in [SHOPIFY_INTEGRATION_PLAN.md](SHOPIFY_INTEGRATION_PLAN.md).

## JVC opening offer proof

`/jvc/` is a separate, noindex design proof for the JVC opening edition: 25% off every product and one scented candle with each of the first 100 qualifying orders. The page uses the storefront’s Cormorant/DM Sans typography, warm plaster, deep olive and floral photography. Final catalog, prices, product imagery, terms and booking are deliberately pending. The matching A5 pamphlet proof and rollout plan remain in the separate local campaign workspace and are not part of this website repository.

## Relation to the original repository

See [REPO_REVIEW.md](REPO_REVIEW.md) for the earlier comparison with the original site.

## Before launch

- Confirm the logo, visual identity, real product inventory, prices, stock rules, and product photography.
- Connect `maisonbotaniqueflowers.com` only when the production store and DNS are ready; then replace the review preview's noindex metadata and set canonical URLs.
- Have a native Arabic editor review all translated storefront copy and checkout language.
- Confirm Dubai delivery zones, scheduling, fees, cutoff times, substitution policy, and customer support details.
- Connect and test the actual Shopify store, payment account, shipping setup, email notifications, tax handling, policies, and end to end orders.
- Replace temporary imagery and remove the preview copy once the real catalog is approved.

## Imagery

Product images are AI-generated brand images from the catalog pipeline (`catalog/image-pipeline/`), not photographs of real stock; 53 still await owner approval (see `catalog/shopify-export/DEVELOPER_HANDOFF.md`). Replace them with commissioned, consistently lit product photographs before launch. The editorial images in `public/assets/` are temporary.
