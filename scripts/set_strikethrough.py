"""Recompute only the strikethrough prices in the variant-price ledger.

Reads catalog/shopify-export/variant-prices.csv, keeps every selling price as it
is, and rewrites compare_at_price with the rule in strikethrough_rule.py
(40-60% off, fixed per product). Run scripts/sync_preview_prices.py afterwards
to apply the ledger to the bundled preview catalogue. Shopify is not touched:
the live catalogue only changes when scripts/shopify-catalog-sync.mjs is run.

Usage: python scripts/set_strikethrough.py
"""

import csv
from pathlib import Path

from strikethrough_rule import MAX_OFF, MIN_OFF, percent_off, strikethrough

LEDGER = Path(__file__).resolve().parent.parent / "catalog" / "shopify-export" / "variant-prices.csv"


def main():
    with open(LEDGER, encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = reader.fieldnames
        rows = list(reader)
    for row in rows:
        row["compare_at_price"] = f"{strikethrough(row['price'], row['handle']):.2f}"
    with open(LEDGER, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    shown = sorted({percent_off(row["handle"]) for row in rows})
    print(f"{len(rows)} strikethrough prices written ({MIN_OFF}-{MAX_OFF}% off; {len(shown)} different percentages in use).")


if __name__ == "__main__":
    main()
