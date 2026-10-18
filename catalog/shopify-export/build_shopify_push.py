#!/usr/bin/env python3
"""Build the developer hand-off: shopify-push.json (products + master data) from products.json.

  python3 build_shopify_push.py

Also refreshes pricing-worksheet.csv (one row per variant), keeping any Maison prices already entered.
Each product's `input` is a ready Shopify Admin GraphQL `productSet` input (API 2026-10). Images are local files:
upload them with stagedUploadsCreate and put the returned resourceUrl into `originalSource` (see DEVELOPER_HANDOFF.md).
"""
import csv, json, re
from collections import OrderedDict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
API_VERSION = "2026-10"
SIZE_AR = {"Signature": "سيغنتشر", "Grand": "غراند", "Luxe": "لوكس"}

METAFIELDS = [  # namespace maison, owner PRODUCT
    ("reference_id", "single_line_text_field", "Internal reference", "Research reference this product was selected from. Internal only."),
    ("review_flags", "single_line_text_field", "Review flags", "Open checks before publishing (semicolon separated). Internal only."),
    ("answer_summary", "multi_line_text_field", "Answer summary (EN)", "One-paragraph answer for search and AI assistants."),
    ("answer_summary_ar", "multi_line_text_field", "Answer summary (AR)", "Arabic answer summary, machine-drafted."),
    ("faq", "json", "FAQ", "List of {q, a} pairs shown on the product page."),
    ("image_status", "single_line_text_field", "Image status", "Approval state of the product image. Internal only."),
    ("size_note", "multi_line_text_field", "Size note", "What changes between Signature, Grand and Luxe."),
    ("custom_fields", "json", "Customer inputs", "Text the customer must enter at add-to-cart (e.g. letter, age number)."),
]


def money(v):
    return None if v in (None, "", "None") else f"{float(v):.2f}"


def load_prices():
    f = ROOT / "pricing-worksheet.csv"
    if not f.exists(): return {}
    return {r["sku"]: r.get("maison_retail_price_aed", "").strip() for r in csv.DictReader(open(f, encoding="utf-8-sig"))}


def size_note(p):
    m = re.search(r"<p>((?:The design|Only the flowers)[^<]*)</p>", p["body_html"])
    return m.group(1) if m else None


def product_input(p, prices):
    opts = p["options"]
    variants = []
    for v in p["variants"]:
        ov = [{"optionName": o["name"], "name": v[f"option{i + 1}"]} for i, o in enumerate(opts)]
        maison = money(prices.get(v["sku"]))
        var = OrderedDict(optionValues=ov, sku=v["sku"], price=maison or money(v["price"]),
                          compareAtPrice=money(v.get("compare_at_price")), taxable=v.get("taxable", True),
                          inventoryPolicy="DENY", inventoryItem={"requiresShipping": True, "tracked": False})
        img = next((i for i in p["images"] if i.get("variant_option") and i["variant_option"] in ov[0]["name"]), None)
        if img: var["file"] = {"originalSource": img["filename"], "alt": img["alt"], "contentType": "IMAGE"}
        variants.append(var)
    mf = [m for m in p["metafields"]]
    mf += [{"namespace": "maison", "key": "answer_summary_ar", "type": "multi_line_text_field", "value": p["answer_summary"]["ar"]},
           {"namespace": "maison", "key": "faq", "type": "json", "value": json.dumps(p["faq"], ensure_ascii=False)},
           {"namespace": "maison", "key": "image_status", "type": "single_line_text_field", "value": p["image_status"]}]
    if size_note(p): mf.append({"namespace": "maison", "key": "size_note", "type": "multi_line_text_field", "value": size_note(p)})
    if p.get("custom_fields"): mf.append({"namespace": "maison", "key": "custom_fields", "type": "json", "value": json.dumps(p["custom_fields"], ensure_ascii=False)})
    return OrderedDict(
        handle=p["handle"], title=p["title"], descriptionHtml=p["body_html"], vendor=p["vendor"], productType=p["product_type"],
        status="DRAFT", tags=p["tags"], seo=p["seo"],
        productOptions=[{"name": o["name"], "position": i + 1, "values": [{"name": x} for x in o["values"]]} for i, o in enumerate(opts)],
        variants=variants,
        files=[{"originalSource": i["filename"], "alt": i["alt"], "contentType": "IMAGE", "filename": Path(i["filename"]).name} for i in p["images"]],
        metafields=mf)


def ar_values(values):
    out = []
    for x in values:
        name, _, rest = x.partition(" – ")
        out.append({"en": x, "ar": SIZE_AR.get(name, name) + (f" – {rest}" if rest else "")})
    return out


def main():
    P = json.load(open(ROOT / "products.json"))["products"]
    prices = load_prices()

    # pricing worksheet: one row per variant, keeping any Maison price already entered
    rows = [{"reference_id": p["reference_id"], "title": p["title"], "category": p["product_type"],
             "variant": " / ".join(v[f"option{i + 1}"] for i in range(len(p["options"]))), "sku": v["sku"],
             "placeholder_price_aed_competitor_reference": money(v["price"]) or "", "maison_retail_price_aed": prices.get(v["sku"], "")}
            for p in P for v in p["variants"]]
    with open(ROOT / "pricing-worksheet.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)

    collections = OrderedDict()
    for p in P:
        for c in p["collections"]:
            collections.setdefault(c, []).append(p["handle"])
    tags = sorted({t for p in P for t in p["tags"]})
    missing_price = sorted({p["handle"] for p in P for v in p["variants"] if not (money(prices.get(v["sku"])) or money(v["price"]))})
    has_maison = sum(1 for r in rows if r["maison_retail_price_aed"])
    sku_issues = sorted({v["sku"] for p in P for v in p["variants"] if not re.fullmatch(r"MB-[A-Z]{2}-\d{3}-.+", v["sku"])})

    out = OrderedDict()
    out["meta"] = OrderedDict(
        brand="Maison Botanique", currency="AED", market="AE", locales=["en", "ar"], shopify_admin_api_version=API_VERSION,
        generated=str(date.today()), source="shopify-export/products.json",
        counts={"products": len(P), "variants_skus": len(rows), "image_files": sum(len(p["images"]) for p in P),
                "collections": len(collections), "skus_with_maison_price": has_maison},
        rules=["Create every product as DRAFT. Do not publish until the owner approves prices and images.",
               "Prices: a variant uses maison_retail_price_aed from pricing-worksheet.csv when filled; otherwise the competitor placeholder is used. "
               f"Placeholders are NOT Maison prices ({len(rows) - has_maison} of {len(rows)} SKUs still on placeholders).",
               "Images are AI-generated brand images (see image_status). originalSource holds a local path: upload each file with "
               "stagedUploadsCreate and replace it with the returned resourceUrl before calling productSet.",
               "Metafields in namespace 'maison' marked Internal only must not be rendered on the storefront.",
               "Arabic translations are machine-drafted and need native review; register them with translationsRegister (locale 'ar').",
               "Do not add competitor names, URLs or photos to the store."],
        known_issues={"products_without_any_price": missing_price,
                      "skus_without_product_number": sku_issues,
                      "images_pending_owner_approval": sorted(p["handle"] for p in P if p["image_status"] != "approved_by_owner_2026-10-18"
                                                              or any(i.get("status") for i in p["images"]))})
    out["master_data"] = OrderedDict(
        metafield_definitions=[{"ownerType": "PRODUCT", "namespace": "maison", "key": k, "type": t, "name": n, "description": d}
                               for k, t, n, d in METAFIELDS],
        collections=[{"handle": re.sub(r"[^a-z0-9]+", "-", c.lower().replace("&", "and")).strip("-"), "title": c,
                      "type": "custom", "product_handles": hs} for c, hs in collections.items()],
        product_types=sorted({p["product_type"] for p in P}),
        tags=tags,
        options={"Size": {"name_ar": "الحجم", "tiers": {"Signature": "as pictured", "Grand": "double the flowers", "Luxe": "triple the flowers"},
                          "rule": "Only the flowers multiply; vases, boxes, teddies, chocolates and other gift items stay the same."}},
        sku_format="MB-<category code>-<3-digit product number>-<SIG|GRD|LUX or option code>",
        category_codes={p["variants"][0]["sku"].split("-")[1]: p["product_type"] for p in P},
        sku_master=[{"sku": r["sku"], "product_handle": next(p["handle"] for p in P if p["reference_id"] == r["reference_id"]),
                     "variant": r["variant"], "category": r["category"],
                     "placeholder_price_aed": r["placeholder_price_aed_competitor_reference"] or None,
                     "maison_price_aed": r["maison_retail_price_aed"] or None} for r in rows],
        store_seo_files=["site-seo/organization-schema.json", "site-seo/llms.txt", "site-seo/faq-store-draft.md"])
    out["products"] = [OrderedDict(
        handle=p["handle"], catalog_number=p["catalog_number"], reference_id=p["reference_id"],
        collections=p["collections"], publish_ready=False,
        review={"flags": p["review_flags"], "image_status": p["image_status"], "description_status": p.get("description_status"),
                "owner_to_confirm": p.get("owner_to_confirm") or None},
        input=product_input(p, prices),
        translations={"ar": {"title": p["translations"]["ar"]["title"], "body_html": p["translations"]["ar"]["body_html"],
                             "seo_title": p["translations"]["ar"]["seo"]["title"], "seo_description": p["translations"]["ar"]["seo"]["description"],
                             "option_name": p["options"][0].get("name_ar"), "option_values": ar_values(p["options"][0]["values"]),
                             "image_alts": [i.get("alt_ar") for i in p["images"]], "status": p["translations"]["ar"].get("status")}})
        for p in P]
    (ROOT / "shopify-push.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"shopify-push.json: {len(P)} products, {len(rows)} SKUs, {out['meta']['counts']['image_files']} images, {len(collections)} collections")
    print(f"pricing-worksheet.csv: {len(rows)} rows ({has_maison} with a Maison price)")
    print("known issues:", {k: len(v) for k, v in out["meta"]["known_issues"].items()})


if __name__ == "__main__":
    main()
