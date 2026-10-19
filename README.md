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

With the Shopify values empty, the site runs the concept preview: the sample catalog in `src/data/sample-catalog.ts` and a cart saved only in the browser. Filling in the Storefront API values switches the whole site to the live Shopify catalog, cart and checkout. Store setup is described step by step in [docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md).

## How the code is organised

| Path | Purpose |
| --- | --- |
| `src/app/(store)/layout.tsx` | Shared store shell: loads the catalog once (ISR, refreshed every 5 minutes or by webhook), header, footer, bag, language. |
| `src/app/(store)/` | Pages: home, `/shop`, `/shop/[handle]`, `/collections`, `/collections/[handle]`, `/occasions`, `/occasions/[occasion]`, `/services`, `/atelier`, `/contact`, `/delivery`, `/faq`, `/privacy`, `/terms`. |
| `src/app/api/enquiry/route.ts`, `src/lib/shopify/forms.ts` | Newsletter, contact and enquiry forms, stored in Shopify (customers + "Website enquiry" metaobjects) through a forms-only Admin token. Without it the forms offer a prefilled email. |
| `src/app/jvc/` | The `/jvc` opening-offer proof, with its own stylesheet. |
| `src/app/api/revalidate/route.ts` | Shopify webhook target; verifies the HMAC signature and refreshes the catalog cache. |
| `src/components/store/` | Store UI: provider (locale, cart), header, footer, bag drawer, product cards, shop filters, forms, page blocks. |
| `src/components/Turntable.tsx` | Pinned home hero; falls back to a static hero when no products are featured. |
| `src/lib/site.ts` | Non-catalog content: occasions, services, navigation and contact details (email, phone, WhatsApp, Instagram). |
| `src/lib/shopify/catalog.ts` | Loads every published product and collection (paginated, English and Arabic) from the Storefront API. |
| `src/lib/shopify/cart.ts` | Storefront Cart API: create, add, update, remove, checkout URL. |
| `src/lib/cart/use-shop-cart.ts` | Cart hook used by the UI; Shopify cart when configured, browser-only preview cart otherwise. |
| `src/proxy.ts` | Hydrogen's same-origin Storefront API proxy and Shopify routes; Shopify sets its analytics/checkout cookies through it. |
| `src/lib/analytics/` | One tracking facade (`track.ts`) feeding PostHog and Shopify's analytics bus (`shopify.ts`). |
| `src/instrumentation-client.ts` | PostHog initialisation, relayed through `/mb-relay` (see `next.config.ts`). |
| `src/app/api/webhooks/orders/route.ts` | `orders/paid` and `refunds/create` webhook: records purchases and refunds in PostHog server-side. |
| `scripts/shopify-auth.mjs` | One-time Admin API authorization for the client transfer store (`npm run shopify:auth`). |
| `scripts/shopify-seed.mjs` | Loads the sample catalog into the store (`npm run shopify:seed`). |

## Shopping flow

Visitors can scroll through a pinned three-product gallery: each floral image approaches, settles, and moves aside as the next arrangement enters. Motion is tied to scroll with GSAP ScrollTrigger and respects reduced-motion preferences. The hero leads directly into a horizontal, photo-led collection of seven provisional pieces. Visitors can browse by product type or occasion, search in either language, open a piece for its details, select a presentation, add a gift note and preferred date, and review a bag saved in their browser. The checkout preview does not collect payment or create an order.

When Shopify is configured, products, sizes (variants), prices, availability and Arabic text come from the Storefront API, so there is no separate product mapping to maintain. The bag is a real Shopify cart: Shopify calculates the subtotal, and the gift note and preferred date travel with each line as line-item properties that appear on the order. "Continue to secure checkout" sends the shopper to Shopify's hosted checkout in their language. Delivery options, tax, shipping, discounts and payment are configured in Shopify. Never place Admin API credentials in `NEXT_PUBLIC_` variables.

Shopify is the selected production commerce direction. The staged implementation and merge gates are recorded in [SHOPIFY_INTEGRATION_PLAN.md](SHOPIFY_INTEGRATION_PLAN.md).

## JVC opening offer proof

`/jvc/` is a separate, noindex design proof for the JVC opening edition: 25% off every product and one scented candle with each of the first 100 qualifying orders. The page uses the storefront’s Cormorant/DM Sans typography, warm plaster, deep olive and floral photography. Final catalog, prices, product imagery, terms and booking are deliberately pending. The matching A5 pamphlet proof and rollout plan remain in the separate local campaign workspace and are not part of this website repository.

## Relation to the original repository

This branch carries the current bilingual editorial storefront at the repository root. The original Next.js site remains on `main`. See [REPO_REVIEW.md](REPO_REVIEW.md) for a source comparison and a shortlist of ideas to evaluate for the final version.

## Before launch

- Confirm the logo, visual identity, real product inventory, prices, stock rules, and product photography.
- Connect `maisonbotaniqueflowers.com` only when the production store and DNS are ready; then replace the review preview's noindex metadata and set canonical URLs.
- Have a native Arabic editor review all translated storefront copy and checkout language.
- Confirm Dubai delivery zones, scheduling, fees, cutoff times, substitution policy, and customer support details.
- Connect and test the actual Shopify store, payment account, shipping setup, email notifications, tax handling, policies, and end to end orders.
- Replace temporary imagery and remove the preview copy once the real catalog is approved.

## Temporary imagery

The collection uses seven distinct temporary photographs, including imagery repurposed from earlier editorial concepts. They establish the direction for the design review but do not represent approved products. Replace them with commissioned, consistently lit product photographs before launch. A genuine multi-angle or 3D product rotation would require multiple views of each arrangement; the current hero motion translates and scales a single view.
