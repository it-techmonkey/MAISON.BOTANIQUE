"""Settings in one place: model configurations, token prices, pilot list.

Prices are USD per 1M tokens, read from OpenAI's pricing / model pages on 18 Oct 2026. The three GPT Image 2.x models
share them. Image models bill: text input + image input (every reference image counts) + image output.
Batch is half price. OpenAI does not publish tokens-per-image for the 2.5 models, so the pilot MEASURES real cost from the
`usage` field of each response and uses that for projections.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# API keys: read from image-pipeline/api-keys.txt (git-ignored) unless already set in the environment. Never printed.
if (ROOT / "api-keys.txt").exists():
    for line in (ROOT / "api-keys.txt").read_text().splitlines():
        k, sep, v = line.strip().partition("=")
        if sep and not k.startswith("#") and v.strip() and not os.environ.get(k.strip()):
            os.environ[k.strip()] = v.strip().strip('"').strip("'")
PRODUCTS = ROOT.parent / "shopify-export" / "products.json"
BRAND_TAG = ROOT / "assets" / "maison-tag.png"
REF_URLS = ROOT / "data" / "ref-urls.json"        # reference_id -> one supplier photo URL (guidance image)
REFS_DIR = ROOT / "refs"                          # downloaded supplier photos (local only, never commit)

TOKEN_PRICE = {"text_in": 5.0, "image_in": 8.0, "image_out": 30.0}   # USD per 1M tokens, standard
BATCH_FACTOR = 0.5

SIZE = "1024x1024"

# supplier_ref: also send one supplier photo per product as a guidance image (owner decision, 18 Oct 2026).
CONFIGS = {
    # --- OpenAI (pilot) ---
    "flare-medium":      dict(provider="openai", model="gpt-image-2.5-flare",    quality="medium", size=SIZE, supplier_ref=True),
    "flare-medium-noref": dict(provider="openai", model="gpt-image-2.5-flare",    quality="medium", size=SIZE, supplier_ref=False),
    "sunburst-medium":   dict(provider="openai", model="gpt-image-2.5-sunburst", quality="medium", size=SIZE, supplier_ref=True),
    "gpt2-medium":       dict(provider="openai", model="gpt-image-2",            quality="medium", size=SIZE, supplier_ref=True),
    "sunburst-high":     dict(provider="openai", model="gpt-image-2.5-sunburst", quality="high",   size=SIZE, supplier_ref=True),
    # The model ChatGPT itself uses. Text-only, like the Oct 16-17 concepts the owner liked (made without supplier pixels).
    # brand_tag=False makes the job text-only, so it uses /images/generations (documented Batch path, half price).
    "chatgpt-medium-text": dict(provider="openai", model="chatgpt-image-latest", quality="medium", size=SIZE, supplier_ref=False, brand_tag=False,
                                token_price={"image_out": 32.0}),
    "flare-medium-text":   dict(provider="openai", model="gpt-image-2.5-flare",  quality="medium", size=SIZE, supplier_ref=False, brand_tag=False),
    # --- Gemini (later, only if OpenAI disappoints) ---
    "nb21-1k":           dict(provider="gemini", model="gemini-nano-banana-2.1", image_size="1K", supplier_ref=True, price=0.0336, batch_price=0.0168),
    "nb21-1k-text":      dict(provider="gemini", model="gemini-nano-banana-2.1", image_size="1K", supplier_ref=False, brand_tag=False, price=0.0336, batch_price=0.0168),
    # --- Cheaper candidates (prices from OpenAI / Google pricing pages, 18 Oct 2026) ---
    "mini-medium":       dict(provider="openai", model="gpt-image-1-mini", quality="medium", size=SIZE, supplier_ref=True,
                              token_price={"text_in": 2.0, "image_in": 2.5, "image_out": 8.0}),
    "nb2lite-1k":        dict(provider="gemini", model="gemini-3.1-flash-lite-image", image_size="1K", supplier_ref=True, price=0.0336, batch_price=0.0168),
    "nb21-2k":           dict(provider="gemini", model="gemini-nano-banana-2.1", image_size="2K", supplier_ref=True, price=0.0504, batch_price=0.0252),
    # --- Campaign and site images (hand-written jobs, see the maison-image-generation skill) ---
    # Same model as products, separate out/ folders so they never mix with product images.
    # Portrait/landscape sizes are not yet confirmed for gpt-image-2.5-flare: the smoke test (1 image) catches a rejected size.
    "campaign-square":    dict(provider="openai", model="gpt-image-2.5-flare", quality="medium", size="1024x1024", supplier_ref=True),
    "campaign-portrait":  dict(provider="openai", model="gpt-image-2.5-flare", quality="medium", size="1024x1536", supplier_ref=True),
    "campaign-landscape": dict(provider="openai", model="gpt-image-2.5-flare", quality="medium", size="1536x1024", supplier_ref=True),
}

# The three-way pilot (python3 pilot.py --products 5): OpenAI API and Gemini API, each text-only and with the supplier
# photo as guidance. The third option, the ChatGPT app, is done by hand with chat_pilot.py. Each setting makes 1 image first as a smoke test.
PILOT_CONFIGS = ["chatgpt-medium-text", "flare-medium", "nb21-1k-text", "nb21-1k"]

# 12 diverse products that have no approved image yet (matched by exact title).
PILOT_TITLES = [
    # The first 5 are the short pilot (python3 pilot.py --products 5).
    "Pastel Rose Symphony",          # earlier image mismatched the listing
    "Pink Lilies in a Glass Vase",   # vase
    "Flowers & Chocolate in Box",    # flowers + Ferrero (brand packaging)
    "Bloom & Teddy Delight",         # flowers + teddy
    "Dry Fruit Luxe Hamper",         # hamper
    "Round Box of Red Roses",        # box
    "Red & Pink Roses Basket",       # basket
    "Serene Pink Tulips Bouquet",    # tulips
    "White Orchid Plant",            # potted plant
    "Radiance Sunflower Bouquet",    # sunflowers
    "Lavender Grace Bouquet",        # mixed garden flowers
    "Forever Rose",                  # preserved flower
]
