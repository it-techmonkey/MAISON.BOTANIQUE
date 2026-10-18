"""Settings in one place: model configurations, token prices, pilot list.

Prices are USD per 1M tokens, read from OpenAI's pricing / model pages on 18 Oct 2026. The three GPT Image 2.x models
share them. Image models bill: text input + image input (every reference image counts) + image output.
Batch is half price. OpenAI does not publish tokens-per-image for the 2.5 models, so the pilot MEASURES real cost from the
`usage` field of each response and uses that for projections.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
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
    # --- Gemini (later, only if OpenAI disappoints) ---
    "nb21-1k":           dict(provider="gemini", model="gemini-nano-banana-2.1", image_size="1K", supplier_ref=True, price=0.0336, batch_price=0.0168),
    "nb21-2k":           dict(provider="gemini", model="gemini-nano-banana-2.1", image_size="2K", supplier_ref=True, price=0.0504, batch_price=0.0252),
}

# The OpenAI pilot: 4 settings x 12 products. Each setting generates 1 image first as a smoke test.
PILOT_CONFIGS = ["flare-medium", "flare-medium-noref", "sunburst-medium", "gpt2-medium"]

# 12 diverse products that have no approved image yet (matched by exact title).
PILOT_TITLES = [
    "Pastel Rose Symphony",          # earlier image mismatched the listing
    "Pink Lilies in a Glass Vase",   # vase
    "Round Box of Red Roses",        # box
    "Red & Pink Roses Basket",       # basket
    "Serene Pink Tulips Bouquet",    # tulips
    "White Orchid Plant",            # potted plant
    "Radiance Sunflower Bouquet",    # sunflowers
    "Lavender Grace Bouquet",        # mixed garden flowers
    "Flowers & Chocolate in Box",    # flowers + Ferrero (brand packaging)
    "Bloom & Teddy Delight",         # flowers + teddy
    "Forever Rose",                  # preserved flower
    "Dry Fruit Luxe Hamper",         # hamper
]
