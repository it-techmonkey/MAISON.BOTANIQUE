# Product scraper

Scrapes every product from two flower shops into JSON and CSV. Each site has its own script and output files.

| Site | How | Logo check |
|---|---|---|
| giftygram.ae | Shopify public JSON (`/products.json`, `/collections/*/products.json`) | No (their photos have no logos) |
| uaeflowers.com | Every product URL in `sitemap.xml`; data read from the page's embedded `__NEXT_DATA__` | Yes, each image is checked by Claude |

Out-of-stock and unpriced products are left out of the UAE Flowers output.

## Setup

```bash
cd scraper
npm install
```

## Run

```bash
node giftygram.mjs                 # ~5 min
node uaeflowers.mjs                # ~25 min for pages, plus the logo check
```

`uaeflowers.mjs` options:

- `--limit N` only scrape the first N sitemap URLs (for a quick test)
- `--skip-logos` skip the logo check
- `--fresh` re-download product pages (by default pages are cached in `output/.cache/`, so re-runs are fast)

### Logo check

Set an Anthropic API key before running `uaeflowers.mjs`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...        # PowerShell: $env:ANTHROPIC_API_KEY = "sk-ant-..."
```

Each image gets `has_logo` (true/false), `brands` (readable brand names), `placement` and `confidence`.
Results are cached by image URL in `output/.cache/logo-checks.json`, so an interrupted run resumes where it stopped and failed images are retried.
The model defaults to `claude-opus-5-5`; set `LOGO_MODEL=claude-haiku-5-5` for a much cheaper run.

## Output (`output/`)

- `giftygram.json`, `giftygram.csv`: name, price range, compare-at price, variants, collections, tags, description, image URLs
- `uaeflowers.json`, `uaeflowers.csv`: name, price, compare-at price, size options (Classic/Deluxe/Premium…), stock, rating, description, care/delivery text, image URLs, per-image logo flags, `any_image_has_logo`
- `uaeflowers_images.csv`: one row per image with its logo result, for filtering
