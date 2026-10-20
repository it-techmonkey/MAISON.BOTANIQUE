# Catalogue ownership and generation

| Information | Authority |
| --- | --- |
| Live products, prices, availability and published content | Shopify |
| Live product presentation fields | Shopify tags and `maison.*` metafields |
| Website-only curation | Explicit configuration, including Gifts for her and Most loved JSON |
| Export JSON, variant ledger and sync report | Recorded import/export artifacts; not a current live mirror |
| Preview catalogue | Generated `src/data/collection.json`, checked in for credential-free review |
| Preview presentation inputs | `catalog/collection-overrides.json` and export records |
| Supplier references, generation history, customer/sales records | Restricted workspace storage |

## Preview generation

Export products + collection overrides + approved images → `scripts/build_collection.py` → preview JSON
and `public/collection/*-{480,960}.webp`. The builder then reapplies `variant-prices.csv` through
`sync_preview_prices.py`.

```sh
# From the repository root after local pipeline setup. Writes generated local files only.
python3 -I scripts/build_collection.py --images catalog/image-pipeline/out/flare-medium
```

Review the diff. This uses the recorded export, not a fresh Shopify download. Do not overwrite newer live
edits through regeneration. Both image sizes are required. The price checker validates the recorded ledger;
if Storefront credentials exist, it also makes a read-only live comparison. A ledger pass does not establish
final owner-approved prices. Preserve `price-recommendations-52.csv` until the discrepancy is resolved.

## Import preparation and live writes

`catalog/shopify-export/build_shopify_push.py` rewrites the push bundle and pricing worksheet. It still
describes DRAFT products; the current sync explicitly sets ACTIVE and publishes to Headless. That mismatch
is a controlled migration concern, not permission to regenerate or republish.

`scripts/shopify-catalog-sync.mjs` reads the push bundle, variant ledger and preview catalogue. It can update
content/prices/metafields/translations, publish products/collections and archive other products absent from
its input. Its default is a seed operation, not an incremental update preserving every later live edit.
It has not been run during cleanup.

Before approved live updates: obtain a fresh live backup, review the exact proposed differences and scope,
and use a separately reviewed safe update path. Enforcing those rules in the importer is a separate functional
task. Competitor repricing remains explicitly opt-in.

## Asset lifecycle

Supplier reference → original + usage record → owner review → approved export master → storefront derivatives.
Retain handle, prompt/job, configuration, usage and approval evidence. Never upload local supplier references,
keys, customer workbooks or the recovery snapshot.
