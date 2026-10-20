# Maison Botanique storefront

English and Arabic flower and gift storefront, built with Next.js 16, React and Shopify.
Start with [current status](docs/CURRENT_STATUS.md), [data ownership](docs/DATA_FLOW.md),
and the [development workflow](docs/WORKFLOW.md). Earlier concept/merge reports are historical.

## Develop

Use Node 22.18 or newer, Python 3 and the committed npm lockfile.

```sh
npm ci --ignore-scripts
cp .env.example .env.local  # only if .env.local does not already exist
npm run dev
```

Leave Shopify credentials empty for the bundled catalogue and browser-only cart. Live commerce requires
[SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md). Never overwrite an existing environment file or copy production
credentials into a review branch.

```sh
npm test
python3 -I -m unittest discover -s tests -p 'test_*.py'
npm run typecheck
npm run build
```

The build validates bundled prices against the recorded 822-variant ledger. Without Storefront credentials
it does not verify live Shopify. Building can fetch Google Fonts.

## Structure

| Path | Maintained purpose |
| --- | --- |
| `src/` | Next.js routes, UI, commerce adapters and styling |
| `src/data/` | Bundled preview catalogue and explicit curated selections |
| `public/collection/` | 480px and 960px storefront derivatives; both intentional |
| `catalog/shopify-export/` | Historical catalogue inputs, export images, recorded prices and sync report |
| `catalog/collection-overrides.json` | Preview ordering/presentation inputs |
| `catalog/design-merge/` | Reviewed selection proposal and unpublished product drafts |
| `catalog/image-pipeline/` | Canonical image tooling; working data and keys are ignored links |
| `scripts/`, `scraper/` | Build/validation/commerce commands and research tooling |
| `shopify-theme/` | Shopify redirect theme and gift-card pages; required |
| `docs/`, `tests/` | Current guidance, historical evidence and verification |

## Images and controlled commands

[Workspace setup](docs/WORKSPACE.md) connects outputs, supplier references, jobs and keys without duplicating
source or calling APIs. Product generation still needs owner approval for spend. Campaign configurations
are in the canonical pipeline. The Bikanervala/Diwali partner proposal files stay on the owner's machine only (not in this public repo).

`shopify:catalog` can overwrite live fields/prices, publish products, alter collections and archive products
absent from its inputs. It is a seeding operation, **not a routine refresh or backup**. Do not run it during
cleanup. Competitor repricing requires an explicit overwrite flag. Read [DATA_FLOW.md](docs/DATA_FLOW.md)
before regenerating or syncing catalogue files.

## Deployment

Production is techmonkeys-projects / maison-botanique on Vercel. Changes to `main` deploy to production and
need the owner's explicit approval. Work on a review branch and PR. Do not use the old laptop `.vercel` link.
