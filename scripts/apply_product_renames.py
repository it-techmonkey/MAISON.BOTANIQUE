"""Apply catalog/shopify-export/product-renames.json to the catalogue data and images.

Every product gets a new brand-style name, Arabic name and URL handle (owner
decision, 2026-10-20). This rewrites, for each product:

  - catalog/shopify-export/shopify-push.json and products.json (title, handle,
    SEO, FAQ, image alt and file names, Arabic fields)
  - catalog/collection-overrides.json and src/data/collection.json (the preview
    catalogue: name, nameAr, id, image paths, alt)
  - the handle lists (most-loved, gifts-for-her, the approved image batch) and
    the handle column of the price ledgers
  - the image files in public/collection and catalog/shopify-export/images

Local files only. Shopify is not touched: the live catalogue changes only when
scripts/shopify-rename-products.mjs is run with --apply. Safe to run again: a
file that already carries the new handles is left as it is.

Usage: python scripts/apply_product_renames.py
"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENAMES = json.loads((ROOT / "catalog/shopify-export/product-renames.json").read_text(encoding="utf-8"))
BY_OLD = {r["oldHandle"]: r for r in RENAMES}
BY_NEW = {r["handle"]: r for r in RENAMES}

# An old handle on its own, or followed by an image suffix such as -1.webp or -480.webp.
HANDLE_RE = re.compile(
    r"(?<![A-Za-z0-9-])(" + "|".join(re.escape(h) for h in sorted(BY_OLD, key=len, reverse=True)) + r")(?=-\d+\.webp|(?![A-Za-z0-9-]))"
)


def sub_handles(text):
    return HANDLE_RE.sub(lambda m: BY_OLD[m.group(1)]["handle"], text)


def deep(value, replace):
    if isinstance(value, str):
        return replace(value)
    if isinstance(value, list):
        return [deep(item, replace) for item in value]
    if isinstance(value, dict):
        return {key: deep(item, replace) for key, item in value.items()}
    return value


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def write_json(path, data, indent=2, ascii_only=False):
    (ROOT / path).write_text(json.dumps(data, ensure_ascii=ascii_only, indent=indent) + "\n", encoding="utf-8")


def cut(text, limit):
    """Shortens at a word boundary with an ellipsis, as the SEO titles were."""
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(" ,&-—") + "…"


def retitle(old_names, entry):
    """A replacer for one product's own subtree: old names to new, old handle to new."""
    pairs = sorted({(old, new) for old, new in old_names if old}, key=lambda pair: len(pair[0]), reverse=True)

    def replace(text):
        for old, new in pairs:
            text = text.replace(old, new)
        return text.replace(entry["oldHandle"], entry["handle"]) if entry["oldHandle"] in text else text

    return replace


def rename_push(path, handle_key="handle", has_input=True):
    data = read_json(path)
    count = 0
    for index, product in enumerate(data["products"]):
        entry = BY_OLD.get(product.get("handle"))
        if not entry:
            continue
        title = product["input"]["title"] if has_input else product["title"]
        arabic = (product.get("translations") or {}).get("ar", {}).get("title", "")
        replace = retitle([(title, entry["title"]), (arabic, entry["titleAr"]), (entry["oldTitle"], entry["title"]),
                           (entry["oldTitleAr"], entry["titleAr"])], entry)
        product = deep(product, replace)
        if has_input:
            product["handle"] = product["input"]["handle"] = entry["handle"]
            product["input"]["title"] = entry["title"]
            product["input"]["seo"]["title"] = f"{cut(entry['title'], 43)} | Maison Botanique"
        else:
            product["handle"] = entry["handle"]
            product["title"] = entry["title"]
            if isinstance(product.get("seo"), dict):
                product["seo"]["title"] = f"{cut(entry['title'], 43)} | Maison Botanique"
        ar = (product.get("translations") or {}).get("ar")
        if isinstance(ar, dict):
            ar["title"] = entry["titleAr"]
            seo = ar.get("seo_title")
            if seo is not None:
                ar["seo_title"] = f"{cut(entry['titleAr'], 45)} | ميزون بوتانيك"
        data["products"][index] = product
        count += 1
    for key in ("master_data", "meta"):  # SKU master, collection membership and the known-issues list carry handles
        if key in data:
            data[key] = deep(data[key], sub_handles)
    write_json(path, data, indent=1)
    print(f"{path}: {count} products")


def rename_overrides():
    path = "catalog/collection-overrides.json"
    data = read_json(path)
    products = {}
    for handle, value in data["products"].items():
        products[BY_OLD[handle]["handle"] if handle in BY_OLD else handle] = value
    for entry in RENAMES:  # every product carries its new names, so a rebuild never falls back to the old ones
        record = products.setdefault(entry["handle"], {})
        record["name"], record["nameAr"] = entry["title"], entry["titleAr"]
    data["hero"] = [BY_OLD[h]["handle"] if h in BY_OLD else h for h in data["hero"]]
    # The file is hand-formatted: one product per line.
    dump = lambda value: json.dumps(value, ensure_ascii=False)  # noqa: E731
    lines = [f"  {dump(key)}: {dump(value)}" for key, value in data.items() if key not in ("hero", "products")]
    lines.insert(1, f'  "hero": {dump(data["hero"])}')
    body = ",\n".join(f"    {dump(key)}: {dump(value)}" for key, value in products.items())
    lines.append(f'  "products": {{\n{body}\n  }}')
    (ROOT / path).write_text("{\n" + ",\n".join(lines) + "\n}\n", encoding="utf-8")
    print(f"{path}: {len(RENAMES)} products")


def rename_collection():
    path = "src/data/collection.json"
    data = read_json(path)
    count = 0
    for product in data["products"]:
        entry = BY_OLD.get(product["id"])
        if not entry:
            continue
        old_name, old_ar = product["name"], product["nameAr"]
        replace = retitle([(old_name, entry["title"]), (old_ar, entry["titleAr"])], entry)
        for key in ("alt", "image", "imageSmall"):
            if key in product:
                product[key] = replace(product[key])
        product["id"], product["name"], product["nameAr"] = entry["handle"], entry["title"], entry["titleAr"]
        count += 1
    data["hero"] = [BY_OLD[h]["handle"] if h in BY_OLD else h for h in data["hero"]]
    write_json(path, data)
    print(f"{path}: {count} products")


def rename_handle_lists():
    path = "src/data/most-loved.json"
    data = read_json(path)
    data["ids"] = [BY_OLD[h]["handle"] if h in BY_OLD else h for h in data["ids"]]
    write_json(path, data, ascii_only=True)
    path = "src/data/gifts-for-her.json"
    write_json(path, [BY_OLD[h]["handle"] if h in BY_OLD else h for h in read_json(path)], ascii_only=True)
    path = "catalog/design-merge/gifts-for-her-proposal.json"
    by_title = {r["oldTitle"]: r["title"] for r in RENAMES}
    data = read_json(path)
    data["productNames"] = [by_title.get(name, name) for name in data["productNames"]]
    write_json(path, data, ascii_only=True)
    path = ROOT / "catalog/image-pipeline/approved-batch-01.txt"
    text = path.read_text(encoding="utf-8")
    path.write_text(sub_handles(text), encoding="utf-8")
    print("handle lists updated")


def rename_csv(path):
    with open(ROOT / path, encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fields, rows = reader.fieldnames, list(reader)
    column = next((name for name in fields if name.lower() in ("handle", "product_handle")), None)
    if not column:
        print(f"{path}: no handle column, skipped")
        return
    for row in rows:
        row[column] = BY_OLD[row[column]]["handle"] if row[column] in BY_OLD else row[column]
    with open(ROOT / path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"{path}: {len(rows)} rows")


def rename_text_files():
    """Plain text, CSV, JSON-key and source files that mention a handle."""
    for path in ("src/components/store/LaunchOffer.tsx", "catalog/image-pipeline/approved-batch-02.txt",
                 "catalog/image-pipeline/data/card-text.json", "catalog/shopify-export/price-recommendations-52.csv",
                 "docs/pricing/price-study-2026-10.csv", "catalog/design-merge/gifts-for-her-proposal.json"):
        file = ROOT / path
        text = file.read_text(encoding="utf-8")
        renamed = sub_handles(text)
        if renamed != text:
            file.write_text(renamed, encoding="utf-8", newline="")
            print(f"{path}: handles updated")


def rename_images():
    moved = 0
    for folder in ("public/collection", "catalog/shopify-export/images"):
        for file in sorted((ROOT / folder).iterdir()):
            renamed = sub_handles(file.name)
            if renamed != file.name:
                file.rename(file.with_name(renamed))
                moved += 1
    print(f"images: {moved} files renamed")


def main():
    rename_push("catalog/shopify-export/shopify-push.json")
    rename_push("catalog/shopify-export/products.json", has_input=False)
    rename_overrides()
    rename_collection()
    rename_handle_lists()
    rename_csv("catalog/shopify-export/variant-prices.csv")
    rename_text_files()
    rename_images()


if __name__ == "__main__":
    main()
