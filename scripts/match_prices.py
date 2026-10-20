"""Set catalog prices from the competitor research data.

Every product in catalog/shopify-export/shopify-push.json carries a
`reference_id`:

  REF-GG-<id>   matched to scraper/output/giftygram.csv by product id
  REF-UAE-<id>  matched to scraper/output/uaeflowers.csv by product id

For each variant this writes the selling price, taken from the research
data (GiftyGram per size; UAEFlowers' Classic, Deluxe and Premium tiers),
and the strikethrough ("compare at") price, set so the selling price is
40-60% below it, fixed per product (see strikethrough_rule.py, rounded to whole dirhams).

Output: catalog/shopify-export/variant-prices.csv, one row per SKU with the
source and how the price was matched. scripts/shopify-catalog-sync.mjs reads it.

Usage: python scripts/match_prices.py
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUSH = ROOT / "catalog" / "shopify-export" / "shopify-push.json"
GIFTYGRAM = ROOT / "scraper" / "output" / "giftygram.csv"
UAEFLOWERS = ROOT / "scraper" / "output" / "uaeflowers.csv"
OUT = ROOT / "catalog" / "shopify-export" / "variant-prices.csv"

# Maison tier -> UAEFlowers upgrade option (the mapping the catalog was built with).
UAE_TIERS = {"signature": "Classic", "grand": "Deluxe", "luxe": "Premium"}
UAE_ORDER = ["Classic", "Deluxe", "Premium"]
from strikethrough_rule import strikethrough  # noqa: E402  (40-60% off, owner decision 2026-10-20)


def money(value):
    try:
        number = float(str(value).replace(",", "").strip())
    except ValueError:
        return None
    return round(number, 2) if number > 0 else None


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def giftygram_variants(row):
    """'Medium (51 roses): 235 (was 650) | Large …: 470' -> [(label, price, compare)]."""
    out = []
    for part in row["variants"].split(" | "):
        match = re.match(r"(.*):\s*([\d.,]+)(?:\s*\(was\s*([\d.,]+)\))?\s*$", part.strip())
        if match:
            out.append((match.group(1).strip(), money(match.group(2)), money(match.group(3))))
    return out


def uae_upgrades(row):
    out = {}
    for part in (row["upgrade_options"] or "").split(" | "):
        if ":" in part:
            label, value = part.rsplit(":", 1)
            out[label.strip()] = money(value)
    return out


def numbers(text):
    return [int(n) for n in re.findall(r"\d+", text or "")]


def tier_of(option_value):
    """'Grand – 101 roses' or 'Pink / Grand' -> 'grand' (any part naming a Maison tier)."""
    for part in re.split(r"[/–-]", option_value):
        word = part.strip().lower()
        if word in UAE_TIERS:
            return word
    return ""


def match_giftygram(variants, row):
    """Pair Maison variants with GiftyGram sizes: by stem/item count when the names carry one, else by position."""
    sizes = giftygram_variants(row)
    if not sizes:
        return None, "giftygram: no prices listed"
    # Collapse per-letter / per-colour duplicates that share a size and price ("51 Red Roses / A").
    unique = []
    for label, price, compare in sizes:
        base = label.split(" / ")[0]
        if not any(u[0] == base for u in unique):
            unique.append((base, price, compare))
    result = []
    if len(unique) == 1:
        # One size at GiftyGram: the Maison options are colours or styles of it.
        return [{"price": unique[0][1], "compare": unique[0][2], "how": f"giftygram single size: {unique[0][0]}"} for _ in variants], None
    for index, variant in enumerate(variants):
        counts = numbers(variant["option"])
        hit = None
        if counts:
            hit = next((s for s in unique if counts[0] in numbers(s[0])), None)
        how = "size count" if hit else "position"
        if not hit:
            hit = unique[index] if index < len(unique) else None
        if not hit:
            return None, f"giftygram: no size for '{variant['option']}'"
        result.append({"price": hit[1], "compare": hit[2], "how": f"giftygram {how}: {hit[0]}"})
    return result, None


def match_uaeflowers(variants, row):
    base_price, base_compare = money(row["price"]), money(row["compare_at_price"])
    upgrades = uae_upgrades(row)
    ratio = (base_compare / base_price) if base_price and base_compare and base_compare > base_price else None
    result = []
    for index, variant in enumerate(variants):
        if len(variants) == 1:
            label, price = "base price", base_price
        else:
            label = UAE_TIERS.get(tier_of(variant["option"])) or (UAE_ORDER[index] if index < len(UAE_ORDER) else None)
            # Colour options repeat the tiers ("Pink / Signature"); the tier sets the price.
            price = upgrades.get(label) if label else None
            if label == "Classic" and not price:
                price = base_price
        if not price:
            return None, f"uaeflowers: no price for '{variant['option']}'"
        if label in ("base price", "Classic") and base_compare and base_compare > price:
            compare = base_compare
        else:
            compare = round(price * ratio) if ratio else None
        result.append({"price": price, "compare": compare, "how": f"uaeflowers {label}"})
    return result, None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--overwrite-from-competitors', action='store_true')
    args = parser.parse_args()
    if not args.overwrite_from_competitors:
        parser.error('Refusing to overwrite Maison prices. Explicit --overwrite-from-competitors is required.')
    push = json.loads(PUSH.read_text(encoding="utf-8"))
    giftygram = {row.get("id") or row.get("﻿id"): row for row in read_csv(GIFTYGRAM)}
    uaeflowers = {row["id"]: row for row in read_csv(UAEFLOWERS)}

    rows, problems = [], []
    for product in push["products"]:
        ref = product["reference_id"]
        variants = [
            {"sku": v["sku"], "option": " / ".join(o["name"] for o in v["optionValues"]), "old": money(v.get("price"))}
            for v in product["input"]["variants"]
        ]
        if ref.startswith("REF-GG-") and ref[7:] in giftygram:
            matched, error = match_giftygram(variants, giftygram[ref[7:]])
            source = "giftygram"
        elif ref.startswith("REF-UAE-") and ref[8:] in uaeflowers:
            matched, error = match_uaeflowers(variants, uaeflowers[ref[8:]])
            source = "uaeflowers"
        else:
            matched, error, source = None, f"no source row for {ref}", ""
        if error:
            problems.append(f"{product['handle']}: {error}")
            continue
        for variant, price in zip(variants, matched):
            compare = strikethrough(price["price"], product["handle"])
            rows.append({
                "handle": product["handle"], "sku": variant["sku"], "option": variant["option"],
                "price": f"{price['price']:.2f}", "compare_at_price": f"{compare:.2f}" if compare else "",
                "previous_price": f"{variant['old']:.2f}" if variant["old"] else "",
                "source": source, "matched_by": price["how"],
            })

    with open(OUT, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    changed = sum(1 for r in rows if r["price"] != r["previous_price"])
    print(f"{len(rows)} variant prices written to {OUT.relative_to(ROOT)}")
    print(f"  giftygram: {sum(r['source'] == 'giftygram' for r in rows)}, uaeflowers: {sum(r['source'] == 'uaeflowers' for r in rows)}")
    print(f"  price changed from the catalog: {changed}; with a strikethrough price: {sum(bool(r['compare_at_price']) for r in rows)}")
    if problems:
        print(f"{len(problems)} products could not be priced:")
        for line in problems:
            print("  -", line)
        sys.exit(1)


if __name__ == "__main__":
    main()
