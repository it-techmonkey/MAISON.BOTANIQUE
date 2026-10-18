# Maison Botanique image pipeline

Generates one branded hero photo per product from `../shopify-export/products.json`, measures the real cost, and lets you compare settings side by side.
Needs Python 3 with `requests` and `Pillow` (both already installed here). You only provide an OpenAI API key.

## 0. One-time checks
1. Create an API key at platform.openai.com and make sure the account has credit.
2. GPT Image models need a **verified organization** (platform.openai.com > Settings > Organization > Verify). Without it you get a 403 error.
3. In the terminal:  `export OPENAI_API_KEY=sk-...`   (kept only in that terminal; the code never saves or prints it)
4. Optional but strongly recommended: put real packaging photos in `brand-assets/` (see its README) so Ferrero, Lindt, L'Oréal, etc. are drawn exactly.

## 1. The pilot (about 48 images, roughly $3-6)
```bash
python3 pilot.py          # prints the plan and a rough estimate. Sends nothing.
python3 pilot.py --yes    # runs it
```
It tests 4 OpenAI settings on 12 varied products:

| Setting | What it is |
|---|---|
| `flare-medium` | gpt-image-2.5-flare ("fast, everyday"), supplier photo as guidance |
| `flare-medium-noref` | same, but no supplier photo (shows whether the guidance photo helps) |
| `sunburst-medium` | gpt-image-2.5-sunburst ("most capable, editing precision"), supplier photo as guidance |
| `gpt2-medium` | gpt-image-2 (the older model), supplier photo as guidance |

Safety built in: each setting first makes ONE image as a smoke test (a wrong key, model name or setting stops everything after one call), it
stops if real spend passes `--max-spend` (default $10), and a re-run skips images that already exist.

Then look at:
- `qa/compare-pilot.jpg`: rows = products, columns = settings (the main thing to judge)
- `qa/pilot-report.md`: real cost per image, time, tokens, and the projected cost for all products
- `qa/<setting>-sheet1.jpg`: larger contact sheets

Each image is also in `out/<setting>/<product>.png`. Want to try another setting (e.g. `sunburst-high`)? `python3 pilot.py --yes --configs sunburst-high`.

## 2. After you choose a setting (the other ~266 products)
```bash
python3 build_jobs.py --all --only-missing                                   # jobs/all-missing.jsonl
python3 run.py --jobs jobs/all-missing.jsonl --config <setting> --mode sync              # shows the estimate, sends nothing
python3 run.py --jobs jobs/all-missing.jsonl --config <setting> --mode sync --yes --max-spend 40
```
Half-price option: `--mode batch-submit --yes`, then later `--mode batch-collect` (results within 24 hours). OpenAI batch with reference images is
experimental (OpenAI does not document the image format inside a batch): try `--limit 2` first. Do the full run in groups with `--limit 40`
if you want to review as you go. Redo one product: delete its file in `out/<setting>/` and run again.

`python3 estimate_cost.py` shows projected totals from what the pilot measured. `python3 qa.py --config <setting> --jobs jobs/all-missing.jsonl` re-runs the checks.

## How each image is built
Prompt = the product's confirmed contents + detailed visual notes + a rotating Maison scene + the rule "show exactly the listed items".
Reference images sent with it, in this order: (1) one supplier photo for guidance only, with instructions to make a new photograph and never copy
logos, watermarks or backgrounds; (2) packaging photos from `brand-assets/` for any brand in the contents; (3) the Maison tag (`assets/maison-tag.png`,
a placeholder until the approved logo exists). Square 1024x1024 PNG. OpenAI bills text input, every reference image, and the image output.

## Files
`pilot.py` the one-command pilot · `run.py` full batches · `engine.py` core logic and cost · `providers.py` OpenAI/Gemini calls ·
`build_jobs.py` prompts · `config.py` models and prices · `qa.py` checks and sheets · `estimate_cost.py` projections · `data/ref-urls.json` guidance photo links
