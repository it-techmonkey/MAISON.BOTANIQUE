# Maison Botanique — private storefront concept

An English and Arabic flower storefront for Dubai. Maison Botanique is the confirmed brand name; the owner corrected the website domain to `maisonbotaniqueflowers.com` on 16 October 2026. The product catalog, AED prices, images, copy, and delivery language are provisional. The public should not place orders from this concept. The Sites preview is publicly viewable for review but remains noindex, and the domain is not connected to it yet.

## Run locally

```sh
npm install
npm run dev
npm run build
```

## Shopping flow

Visitors can scroll through a pinned three-product gallery: each floral image approaches, settles, and moves aside as the next arrangement enters. Motion is tied to scroll with GSAP ScrollTrigger and respects reduced-motion preferences. A scrolling offer bar sits above the header, which links straight to each category and occasion (`#roses`, `#occasion/birthday`; shareable). The hero leads into the collection (`src/components/CollectionPage.jsx`): shop-by-occasion tiles, category tabs, search, a Refine drawer (occasion, budget, stem count, with live counts), sorting and a four-across grid loading 24 at a time. Every piece opens the quick-add sheet, where visitors choose a size, write their card with a live preview, sign it or keep it anonymous, pick a preferred day and add it to a bag saved in their browser. The checkout preview does not collect payment or create an order.

### Collection data

The collection is built from the Shopify export, not hand-written:

```sh
python3 scripts/build_collection.py --images ../image-pipeline/out/flare-medium
```

It reads `catalog/shopify-export/products.json` and `catalog/collection-overrides.json`, then writes `src/data/collection.json` and responsive WebP images to `public/collection/`. Every product with a generated image and a price is included, so the catalogue grows as the image batch runs (re-run the script). The overrides file holds approved renames, card lines, the featured order and the three hero products. Prices are still research placeholders, and occasion tags are generated drafts for owner review. Once the Shopify store is connected, the same fields come from the Storefront API, so the full catalogue never has to ship in the JavaScript bundle.

The Shopify Storefront API adapter in `src/lib/shopify.js` is prepared for a real store. When the business has approved its inventory, map each size to a real `shopifyVariants` product variant ID in `src/data/products.js`. Set the public Storefront token and domain using the names in `.env.example`. Do not place Admin API tokens in browser environment variables. The adapter creates a cart and redirects to Shopify's hosted checkout only when every cart line has a mapped variant. Before enabling that path, replace the sample bag prices with Shopify merchandise prices and verify currency and market settings so the amount displayed on the site agrees with checkout. Delivery options, tax, shipping, and payment are Shopify configuration work before launch.

Shopify is the selected production commerce direction. The staged implementation and merge gates are recorded in [SHOPIFY_INTEGRATION_PLAN.md](SHOPIFY_INTEGRATION_PLAN.md). The current preview has no live Shopify checkout or analytics.

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
