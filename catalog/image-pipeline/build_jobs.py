#!/usr/bin/env python3
"""Build one generation job per product from ../shopify-export/products.json.

  python3 build_jobs.py --pilot               -> jobs/pilot.jsonl  (12 products)
  python3 build_jobs.py --all --only-missing  -> jobs/all-missing.jsonl  (every product without an approved image)

Each job: key (product handle), prompt, ref_url (one supplier photo for guidance), brand_paths (packaging photos from brand-assets/).
The final prompt text that is sent (with the right image numbering) is assembled in engine.py.
"""
import argparse, hashlib, json, re
from config import ROOT, PRODUCTS, PILOT_TITLES, REF_URLS

SCENES = [
    "a warm plaster wall with soft window light and a pale limestone ledge",
    "a dark deep-green painted wall, moody low-key side light, a dark wood console",
    "a white marble counter with a soft linen backdrop in morning light",
    "an ivory linen-draped table in front of a sun-washed stone wall, dappled leaf shadows",
    "a travertine plinth against a muted sage wall, soft diffused daylight",
    "a pale oak table by a window, sheer curtain light, blush-toned wall",
]

TEMPLATES = {
    "vase": "Arrangement presented in a clear glass vase, full vase and stems visible, camera at eye level.",
    "box": "Flowers arranged inside the box exactly as listed; the whole box visible from a high three-quarter angle, lid or ribbon resting beside it.",
    "basket": "Arrangement in a handled basket, the whole basket and handle visible, three-quarter view.",
    "plant": "A potted plant in its pot, whole plant visible, on a surface, calm minimal styling.",
    "hamper": "A curated gift hamper: all listed items arranged attractively in a basket or tray, whole hamper visible from a high three-quarter angle.",
    "preserved": "Preserved flower presented as a keepsake piece, close and elegant, whole item visible.",
    "gift": "Flowers with the listed gift items arranged together as one gift set; every listed item clearly visible, whole set in frame.",
    "beauty": "Gift set of beauty products with flowers; every listed item clearly visible, branded items shown in their genuine packaging.",
    "bouquet": "Hand-tied bouquet in tissue/paper wrap with a ribbon, whole bouquet visible from a three-quarter view, stems and wrap shown.",
}

BRANDS = json.load(open(ROOT / "brand-assets" / "brands.json")) if (ROOT / "brand-assets" / "brands.json").exists() else {}


def fmt(p):
    t = (p["title"] + " " + p["product_type"]).lower()
    if "beauty" in p["product_type"].lower() or "makeup" in t: return "beauty"
    if re.search(r"forever rose|preserved|infinity", p["title"].lower()): return "preserved"
    if re.search(r"\bplant\b", p["title"].lower()) and "bouquet" not in t: return "plant"
    if "hamper" in t or "basket of fruits" in t or "fruit basket" in t: return "hamper"
    if "vase" in t: return "vase"
    if re.search(r"\bbox\b|hatbox", t): return "box"
    if "basket" in t: return "basket"
    if re.search(r"teddy|chocolate|ferrero|cake|pistache|fruit|dates|balloon", t): return "gift"
    return "bouquet"


def items(p):
    return [re.sub(r"<[^>]+>", "", s).strip() for s in re.findall(r"<li>(.*?)</li>", p["body_html"].split("Choose your size")[0])]


def brand_files(p):
    """Packaging photos (brand-assets/<stem>.png|jpg) for brands named in the product's contents."""
    text = " ".join(items(p)) + " " + p["title"]
    found = []
    for k, b in BRANDS.items():
        if re.search(b["pattern"], text, re.I):
            for ext in (".png", ".jpg", ".jpeg", ".webp"):
                f = ROOT / "brand-assets" / f"{b['file_stem']}{ext}"
                if f.exists(): found.append((k, str(f))); break
    return found


def build_prompt(p):
    spec = re.sub(r"\b(the )?class of 20\d\d", "this year's graduates", "; ".join(items(p)) or p["title"])
    scene = SCENES[int(hashlib.md5(p["handle"].encode()).hexdigest(), 16) % len(SCENES)]
    vis = p.get("visual_spec")
    visual = f"Detailed visual specification: {vis} " if vis else ""
    title = re.sub(r"\b20\d\d\s*", "", p["title"])
    return (
        "Premium editorial product photograph for Maison Botanique, a Dubai luxury floral gifting house. "
        f"Product: {title}. Contents, as listed: {spec}. {visual}"
        "Show exactly the listed items, colours and quantities and nothing extra: do not add other flowers, items or colours, "
        "and do not show more than the listed quantity of any item. Make the arrangement look full, fresh and natural, with believable petals, glass and shadows. "
        f"{TEMPLATES[fmt(p)]} "
        f"Setting: {scene}. Directional soft light, tactile natural textures, deep botanical green, ivory, blush and oxblood palette, shallow depth of field, photorealistic. "
        "Attach the Maison Botanique gift tag to the product. Square 1:1 composition, product centred with breathing room. "
        "Brand products and characters named in the contents appear in their genuine packaging (if a character cannot be rendered, use a close plush). "
        "No other text, no years or dates, no prices, no watermarks, no other logos, no hands or people."
    )


def make_jobs(pilot=False, only_missing=True):
    prods = json.load(open(PRODUCTS))["products"]
    urls = json.load(open(REF_URLS)) if REF_URLS.exists() else {}
    if pilot:
        by = {p["title"]: p for p in prods}
        miss = [t for t in PILOT_TITLES if t not in by]
        if miss: raise SystemExit(f"pilot titles not found in products.json: {miss}")
        sel = [by[t] for t in PILOT_TITLES]
    else:
        sel = [p for p in prods if not (only_missing and p["images"] and p["image_status"] != "withheld_needs_regeneration")]
    jobs = []
    for p in sel:
        ref = (p.get("merged_reference_ids") or [p["reference_id"]])[0]
        bf = brand_files(p)
        jobs.append({"key": p["handle"], "catalog_number": p["catalog_number"], "title": p["title"], "format": fmt(p),
                     "prompt": build_prompt(p), "ref_url": urls.get(ref),
                     "brand_names": [k for k, _ in bf], "brand_paths": [f for _, f in bf]})
    return jobs


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--pilot", action="store_true"); g.add_argument("--all", action="store_true")
    ap.add_argument("--only-missing", action="store_true", help="skip products that already have an approved image")
    a = ap.parse_args()
    jobs = make_jobs(pilot=a.pilot, only_missing=a.only_missing)
    out = ROOT / "jobs" / ("pilot.jsonl" if a.pilot else "all-missing.jsonl" if a.only_missing else "all.jsonl")
    out.parent.mkdir(exist_ok=True)
    out.write_text("".join(json.dumps(j, ensure_ascii=False) + "\n" for j in jobs))
    print(f"{len(jobs)} jobs -> {out}")


if __name__ == "__main__":
    main()
