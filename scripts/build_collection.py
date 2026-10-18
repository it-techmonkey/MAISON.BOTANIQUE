#!/usr/bin/env python3
"""Build the storefront collection data and images from the Shopify export.

  python3 scripts/build_collection.py --images ../image-pipeline/out/flare-medium

Reads catalog/shopify-export/products.json and catalog/collection-overrides.json.
Every product that has a generated image (<handle>.png) and a price is included.
Writes src/data/collection.json and public/collection/<handle>-480.webp / -960.webp.

This is the local stand-in for the Shopify Storefront API. When the store is connected,
the same fields come from products, variants and metafields instead.
"""
import argparse, html, json, re, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / "catalog" / "shopify-export" / "products.json"
OVERRIDES = ROOT / "catalog" / "collection-overrides.json"
OUT_JSON = ROOT / "src" / "data" / "collection.json"
OUT_IMG = ROOT / "public" / "collection"
WIDTHS = (480, 960)

# Shopify product_type -> customer-facing room (see the catalog blueprint).
ROOMS = {
    "Rose bouquets": "roses",
    "Named-flower bouquets": "bouquets", "Garden & mixed bouquets": "bouquets",
    "Vase arrangements": "vases", "Boxes & baskets": "vases",
    "Flowers & treats": "gifts", "Chocolate gifts": "gifts", "Teddy & celebration gifts": "gifts",
    "Flower gift bundles": "gifts", "Cakes & desserts": "gifts",
    "Grand gestures": "grand",
    "Beauty & makeup gifts": "beauty",
    "Hampers, fruit & dates": "hampers", "Preserved & plants": "hampers",
}
TIERS = ["Signature", "Grand", "Luxe"]
TIERS_AR = {"Signature": "سيغنتشر", "Grand": "غراند", "Luxe": "لوكس"}


def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def lists(body):
    return [[text(x) for x in re.findall(r"<li>(.*?)</li>", ul, re.S)] for ul in re.findall(r"<ul>(.*?)</ul>", body or "", re.S)]


def size_list(body):
    """The 'Choose your size' list: [(name, detail)] in English or Arabic."""
    uls = re.findall(r"<ul>(.*?)</ul>", body or "", re.S)
    if len(uls) < 2:
        return []
    return [(text(n), text(d)) for n, d in re.findall(r"<li><strong>(.*?)</strong>\s*[–-]\s*(.*?)</li>", uls[1], re.S)]


def short(s):
    return re.split(r"[:–]", s)[0].strip().rstrip(".").replace(" of the Signature set", "")


def roses_ar(s):
    return re.sub(r"(\d+) (?:fresh )?roses.*", r"\1 وردة", s)


def sizes_for(p):
    """At most three sizes, always named Signature / Grand / Luxe (owner decision)."""
    variants = [v for v in p["variants"] if v.get("price")][:3]
    if not variants:
        return []
    base = float(variants[0]["price"])
    en_sizes = size_list(p["body_html"])
    ar_sizes = size_list(p["translations"]["ar"].get("body_html", ""))
    if len(variants) == 1 and variants[0]["option1"] == "Default Title":
        return [{"id": "signature", "name": "Signature", "nameAr": TIERS_AR["Signature"], "detail": "as pictured", "detailAr": "كما في الصورة", "add": 0}]
    out = []
    for i, v in enumerate(variants):
        opt = v["option1"]
        if " – " in opt:
            detail = opt.split(" – ", 1)[1]
        elif opt in TIERS:
            detail = short(en_sizes[i][1]) if i < len(en_sizes) else ""
        else:
            detail = opt  # e.g. "51 roses"
        if re.match(r"\d+ (fresh )?roses", detail):
            detail_ar = roses_ar(detail)
        elif detail and i < len(ar_sizes):
            detail_ar = short(ar_sizes[i][1])
        else:
            detail_ar = ""
        name = TIERS[i]
        out.append({"id": name.lower(), "name": name, "nameAr": TIERS_AR[name], "detail": detail, "detailAr": detail_ar,
                    "add": round(float(v["price"]) - base)})
    return out


def stems_of(sizes, comp):
    for s in [sizes[0]["detail"]] + comp[:1]:
        m = re.match(r"(\d+)\b", s or "")
        if m:
            return int(m.group(1))
    return None


def line_of(sizes, comp):
    first = sizes[0]["detail"] if re.match(r"\d", sizes[0]["detail"] or "") else (comp[0] if comp else "")
    extra = next((c for c in comp[1:] if re.search(r"wrap|paper|vase|box|basket|bag|bear|balloon|chocolate|ribbon", c, re.I)), "")
    brands = r"Ferrero|Rocher|Lindt|Godiva|Kinder|Patchi|Raffaello|Toblerone"
    extra = " ".join(w if re.match(brands, w) else w.lower() for w in extra.split())
    line = first + (f", {extra}" if extra and extra.lower() not in first.lower() else "")
    return line[:70]


def occasions_of(p, comp):
    """Draft occasion tags from the title, tags and contents. Owner review pending."""
    # Title and tags only: the contents list mentions wrap colours ("white wrapping paper").
    t = (p["title"] + " " + " ".join(p["tags"])).lower()
    title = p["title"].lower()
    occ = []
    bridal = re.search(r"bridal|wedding", t)
    if "birthday" in t or (not bridal and re.search(r"pink|peach|pastel|yellow|sunflower|mix|rainbow|summer|lil(y|ies)", t)):
        occ.append("birthday")
    tags = {x.lower() for x in p["tags"]}
    if re.search(r"love|romance|valentine|heart|kiss|anniversary|adore|red ros|crimson|burgundy|teddy|chocolate", t) or {"red", "rose"} <= tags:
        occ.append("love")
    if not bridal and re.search(r"white|yellow|sunflower|lisianthus|orchid|tulip|hydrangea|pastel|thank", t):
        occ.append("thanks")
    if re.search(r"sunflower|yellow|tulip|orchid|get well", t):
        occ.append("get-well")
    if re.search(r"baby boy|baby girl|new baby|newborn", t) or ("baby" in title and "baby rose" not in title) or re.search(r"\bblue\b.*(white|pastel)|pastel", t):
        occ.append("new-baby")
    if re.search(r"graduat|congrat|celebration|orchid|sunflower|grand gesture|\b100\b|\b101\b", t):
        occ.append("congratulations")
    if bridal:
        occ.append("wedding")
    if re.search(r"sorry|white ros|white flowers|white lil", t):
        occ.append("sorry")
    if not bridal and "graduat" not in t:
        occ.append("just-because")
    return occ


def write_images(src, handle):
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    im = None
    for w in WIDTHS:
        dest = OUT_IMG / f"{handle}-{w}.webp"
        if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
            continue
        im = im or Image.open(src).convert("RGB")
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(dest, "WEBP", quality=78, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", required=True, help="folder with <handle>.png product images")
    a = ap.parse_args()
    images = Path(a.images)
    products = json.load(open(EXPORT))["products"]
    ov = json.load(open(OVERRIDES))
    over = ov.get("products", {})

    out, skipped = [], []
    for p in products:
        h = p["handle"]
        src = images / f"{h}.png"
        if not src.exists():
            continue
        sizes = sizes_for(p)
        if not sizes:
            skipped.append((h, "no price")); continue
        write_images(src, h)
        o = over.get(h, {})
        ar = p["translations"]["ar"]
        en_lists, ar_lists = lists(p["body_html"]), lists(ar.get("body_html", ""))
        comp, comp_ar = (en_lists[0] if en_lists else []), (ar_lists[0] if ar_lists else [])
        custom = (p.get("custom_fields") or [None])[0]
        out.append({
            "id": h,
            "no": p["catalog_number"],
            "name": o.get("name", p["title"]),
            "nameAr": o.get("nameAr", ar.get("title") or p["title"]),
            "room": o.get("room") or ROOMS.get(p["product_type"], "bouquets"),
            "price": round(float(next(v for v in p["variants"] if v.get("price"))["price"])),
            "sizes": sizes,
            "line": o.get("line") or line_of(sizes, comp),
            "lineAr": o.get("lineAr") or " · ".join(comp_ar[:2]),
            "composition": comp,
            "compositionAr": comp_ar,
            "feature": o.get("feature", ""),
            "stems": o.get("stems", stems_of(sizes, comp)),
            "occasions": o.get("occasions") or occasions_of(p, comp),
            "order": o.get("order", 100 + p["catalog_number"]),
            "custom": ({"label": custom["name"], "kind": "letter" if "letter" in custom["name"].lower() else "age" if "age" in custom["name"].lower() else "text"} if custom else None),
            "image": f"/collection/{h}-960.webp",
            "imageSmall": f"/collection/{h}-480.webp",
            "alt": p["images"][0]["alt"] if p.get("images") else p["title"],
        })
    out.sort(key=lambda x: x["order"])
    OUT_JSON.write_text(json.dumps({"hero": ov.get("hero", []), "products": out}, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(out)} products -> {OUT_JSON.relative_to(ROOT)}")
    for h, why in skipped:
        print(f"  skipped {h}: {why}", file=sys.stderr)


if __name__ == "__main__":
    main()
