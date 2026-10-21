<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project workflow

Read [README.md](README.md), [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md), [docs/DATA_FLOW.md](docs/DATA_FLOW.md) and [docs/WORKFLOW.md](docs/WORKFLOW.md). In the full workspace also read the parent AGENTS.md. Work on review branches from fresh origin/main; main deploys production and requires separate explicit approval. Do not run catalogue seeding, paid image generation, or live settings changes as part of cleanup. Never commit local credentials, working media, customer records or recovery snapshots.

## Area → tests

If you change an area, run its tests and update them in the same branch. Unit and data tests run with `npm test`; buying-flow tests run with `npm run test:e2e` (set `E2E_BASE_URL` to a preview, or `npm run build` first to test locally). Tests tagged `@live` also run hourly against production (`.github/workflows/live-check.yml`).

| Area (main files) | Unit / data tests | Buying-flow tests (`tests/e2e/`) |
| --- | --- | --- |
| Browse, tabs, Refine, search (`CollectionBrowser.tsx`, `catalog-groups.ts`) | `design-merge.test.mjs` (budget bands, groups) | `browse.spec.ts` |
| Product page, sizes, add to bag (`ProductPurchase.tsx`, `ShopSheets.tsx` `PurchaseOptions`, `use-shop-cart.ts`) | `catalogue.test.mjs` | `product.spec.ts` |
| Delivery day and time (`delivery.ts`, `ShopSheets.tsx` pickers, `use-today.ts`) | `delivery.test.mjs` | `delivery.spec.ts` |
| Bag → Shopify checkout (`ShopSheets.tsx` `Bag`, `shopify/cart.ts`) | — | `checkout.spec.ts` |
| Prices, struck prices, % off tag (`discount.ts`, `SaleTag.tsx`, `Money.tsx`) | `pricing-whatsapp.test.mjs`, `catalogue.test.mjs` | `product.spec.ts` |
| Welcome offer (`LaunchOffer.tsx`, `enquiry.ts`, `shopify/welcome-offer.ts`) | `design-merge.test.mjs` | `offer.spec.ts` (never submits) |
| Arabic / RTL (`StoreProvider.tsx`, all `ar` copy) | — | `arabic.spec.ts` |
| WhatsApp links (`whatsapp.ts`, `WhatsAppButton.tsx`) | `pricing-whatsapp.test.mjs` | `whatsapp.spec.ts` |
| Phone layout, any CSS (`src/styles/`) | — | `mobile.spec.ts` |
| Catalogue data (`src/data/collection.json`, `scripts/build_collection.py`) | `catalogue.test.mjs` | — |
| Delivery-fee wording (footer, FAQ, delivery, residences) | `catalogue.test.mjs` | — |

The buying-flow tests never enter contact, address, discount or payment details and never submit a form. On a preview without Shopify or WhatsApp settings they note "not exercised" instead of failing; with `E2E_EXPECT_LIVE=1` (the hourly check) that becomes a failure.
