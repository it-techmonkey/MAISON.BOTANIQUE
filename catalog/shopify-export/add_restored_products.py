#!/usr/bin/env python3
"""Restore 10 near-duplicate concepts as their own draft products (owner decision, 18 Oct 2026).

  python3 add_restored_products.py          -> adds them to products.json (skips any already present)

Each entry follows the same schema as the other products: Signature / Grand / Luxe where only the flowers
multiply (gift items stay the same), competitor placeholder prices (Classic / Deluxe / Premium), proposed SKUs,
SEO, answer summary, FAQ and a machine-drafted Arabic translation that needs native review.
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PRODUCTS = ROOT / "products.json"

# title, title_ar, reference_id, catalog_number, twin title (category/tags), flower items [(n, en, ar)], fixed items [(en, ar)],
# placeholder prices (Classic, Deluxe, Premium), extra flags, visual note
NEW = [
    ("40 Pink Roses Bouquet", "باقة 40 وردة وردية", "REF-UAE-67e5402b1503451d1d759713", 22, "Romantic Pink Rose Bouquet",
     [(40, "pink roses", "وردة وردية")], [("Elegant paper wrapping", "تغليف ورقي أنيق"), ("Hand-tied with a pink ribbon", "مربوطة يدويًا بشريط وردي")],
     (399, 778, 1177), [], "Hand-tied bouquet of 40 pink roses in soft blush paper with a pink ribbon."),
    ("Anniversary Red Roses Bouquet", "باقة ورود حمراء للذكرى السنوية", "REF-UAE-68a6d78cad0c82001f428ec1", 33, "20 Red Roses Love For You",
     [(20, "red roses", "وردة حمراء")], [("Green fillers", "حشوات خضراء"), ("Paper wrapping with a 'Happy Anniversary' card", "تغليف ورقي مع بطاقة \"ذكرى سنوية سعيدة\"")],
     (289, 564, 853), [], "20 red roses with green fillers in elegant paper, a 'Happy Anniversary' message card standing in the flowers."),
    ("Bouquet of Pink Lilies & Roses", "باقة زنابق وورود وردية", "REF-UAE-67e540001503451d1d757750", 99, "Bouquet of Roses and Lilies",
     [(3, "pink lilies", "زنبقات وردية"), (10, "pink roses", "ورود وردية")], [("Fillers", "حشوات"), ("Brown paper wrapping with a ribbon", "تغليف بورق بني مع شريط")],
     (249, 486, 735), [], "3 pink lilies and 10 pink roses with fillers, wrapped in brown kraft paper and tied with a ribbon."),
    ("Purple Orchids Bouquet", "باقة أوركيد بنفسجي", "REF-UAE-67e53f8a1503451d1d753fe3", 90, "Majestic Orchids Bouquet",
     [(20, "purple orchids", "أوركيد بنفسجي")], [("Soft paper wrapping with a ribbon", "تغليف ورقي ناعم مع شريط")],
     (279, 544, 823), [], "20 purple dendrobium orchid stems in soft paper wrapping with a delicate ribbon."),
    ("Premium Pink Tulips Bouquet", "باقة توليب وردي فاخرة", "REF-UAE-67e53fe21503451d1d75642c", 96, "Serene Pink Tulips Bouquet",
     [(20, "pink tulips", "توليب وردي")], [("Pastel wrapping paper", "ورق تغليف بألوان الباستيل"), ("Soft ribbon", "شريط ناعم")],
     (325, 634, 959), [], "20 pink tulips in pastel wrapping paper with a soft ribbon."),
    ("Pink Roses in Box", "ورود وردية في صندوق", "REF-UAE-67e53ff01503451d1d756e49", 167, "Blush Pink Roses in Box",
     [(30, "pink roses", "وردة وردية")], [("Lush green fillers", "حشوات خضراء غنية"), ("White round box", "صندوق دائري أبيض")],
     (325, 634, 959), [], "30 pink roses with lush greenery in a white round box."),
    ("Pink Roses Hatbox", "صندوق قبعة بالورود الوردية", "REF-UAE-67e53fd31503451d1d755beb", 188, "Box of Pink Roses",
     [(60, "pink roses", "وردة وردية")], [("Round white hatbox", "صندوق قبعة دائري أبيض")],
     (745, 1453, 2198), [], "60 pink roses arranged as a dome in a round white hatbox."),
    ("Pink Phalaenopsis Orchid Plant", "نبتة أوركيد فالينوبسيس وردية", "REF-UAE-67e53fe21503451d1d7563e8", 217, "Pink Orchid Plant (4)",
     [(4, "pink phalaenopsis orchid stems", "سيقان أوركيد فالينوبسيس وردية")], [("Elegant pot", "أصيص أنيق")],
     (935, 1825, 2759), [], "Potted plant with 4 stems of pink phalaenopsis orchids in an elegant pot."),
    ("Blushing Bouquet of 20 Pink & Red Roses", "باقة 20 وردة وردية وحمراء", "REF-UAE-67e5402b1503451d1d75969e", 41, "Timeless Red & Pink Roses",
     [(10, "red roses", "وردات حمراء"), (10, "pink roses", "وردات وردية")], [("Green and baby's breath fillers", "حشوات خضراء وجبسوفيلا"), ("Paper wrapping with a pink ribbon", "تغليف ورقي مع شريط وردي")],
     (289, 564, 853), [], "10 red and 10 pink roses with green and baby's breath fillers, paper wrapping and pink ribbons."),
    ("Prestige Raksha Bandhan Gift", "هدية راكشا باندان الفاخرة", "REF-UAE-6a731ebdd618af001f5ca468", 32, "Red Royale Bouquet",
     [(10, "red roses", "وردات حمراء"), (5, "red spray roses", "ورود رذاذ حمراء"), (3, "red button chrysanthemums", "أقحوان أزرار أحمر")],
     [("Eucalyptus leaves", "أوراق الأوكالبتوس"), ("Red wrapping with a black ribbon", "تغليف أحمر مع شريط أسود"), ("1/2 kg Kaju Katli", "نصف كيلو كاجو كاتلي"), ("A Rakhi", "راخي")],
     (375, 731, 1106), ["seasonal_occasion_listing_keep"], "Red roses, spray roses and button chrysanthemums with eucalyptus in red paper and a black ribbon, beside a box of Kaju Katli and a Rakhi."),
]

TIERS = [("Signature", "سيغنتشر", 1, "SIG"), ("Grand", "غراند", 2, "GRD"), ("Luxe", "لوكس", 3, "LUX")]


def slug(t):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t.lower().replace("&", "and"))).strip("-")


def ul(items):
    return "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def build(n, data, template, sku_no):
    title, title_ar, ref, cat, _twin, flowers, fixed, prices, flags, visual = n
    prefix = template["variants"][0]["sku"].split("-")[1]
    sku = f"MB-{prefix}-{sku_no:03d}"
    fl = lambda k: ", ".join(f"{q * k} {en}" for q, en, _ in flowers)
    fl_ar = lambda k: "، ".join(f"{q * k} {ar}" for q, _, ar in flowers)
    contents = [f"{q} {en}" for q, en, _ in flowers] + [en for en, _ in fixed]
    contents_ar = [f"{q} {ar}" for q, _, ar in flowers] + [ar for _, ar in fixed]
    one_flower = len(flowers) == 1
    opt = [f"{name} – {fl(k)}" if one_flower else name for name, _, k, _ in TIERS]
    gifts = [en for en, _ in fixed if re.search(r"kaju|rakhi|card|pot|box|hatbox", en, re.I)]
    g = [x[0].lower() + x[1:] for x in gifts]
    keep_note = (f"Only the flowers change; {' and '.join([', '.join(g[:-1]), g[-1]] if len(g) > 1 else g)} stay{'s' if len(g) == 1 else ''} the same." if gifts
                 else "The design, wrapping and fillers stay the same; only the quantity changes.")
    sizes = [f"<strong>{name}</strong> – {'as pictured' if k == 1 else ('double' if k == 2 else 'triple') + ' the flowers'}: {fl(k)}" for name, _, k, _ in TIERS]
    sizes_ar = [f"<strong>{ar}</strong> – {'كما في الصورة' if k == 1 else ('ضعف الزهور' if k == 2 else 'ثلاثة أضعاف الزهور')}: {fl_ar(k)}" for _, ar, k, _ in TIERS]
    body = (f"<p><strong>What's included</strong></p>{ul(contents)}<p><strong>Choose your size</strong></p>{ul(sizes)}"
            f"<p>{keep_note} The photo shows the Signature size.</p>")
    body_ar = (f"<p><strong>ما يتضمنه</strong></p>{ul(contents_ar)}<p><strong>اختر حجمك</strong></p>{ul(sizes_ar)}"
               "<p>تتغير الزهور فقط، ويبقى باقي التصميم كما هو. الصورة تعرض حجم سيغنتشر.</p>")
    summary = f"{title} from Maison Botanique includes {', '.join(c[0].lower() + c[1:] for c in contents)}. Available in Signature ({fl(1)}), Grand ({fl(2)}) and Luxe ({fl(3)})."
    rflags = ["price_is_placeholder_competitor_reference", "restored_from_duplicate_group"] + flags
    variants = [{"option1": o, "sku": f"{sku}-{code}", "price": f"{p:.2f}", "compare_at_price": None, "requires_shipping": True,
                 "taxable": True, "inventory_management": None, "inventory_policy": "deny", "weight": None, "barcode": None}
                for o, (_, _, _, code), p in zip(opt, TIERS, prices)]
    handle = slug(title)
    return {
        "reference_id": ref, "catalog_number": cat, "title": title, "handle": handle, "vendor": "Maison Botanique",
        "product_type": template["product_type"], "status": "draft", "published": False,
        "tags": template["tags"], "collections": template["collections"], "body_html": body,
        "seo": {"title": f"{title} | Maison Botanique Dubai"[:70],
                "description": f"{title}: {', '.join(contents[:2])}. Order online in Dubai from Maison Botanique."[:160]},
        "options": [{"name": "Size", "values": opt, "name_ar": "الحجم"}], "variants": variants,
        "images": [], "image_status": "not_generated_yet",
        "translations": {"ar": {"title": title_ar, "body_html": body_ar, "status": "machine_drafted_needs_native_review",
                                "seo": {"title": f"{title_ar} | ميزون بوتانيك دبي",
                                        "description": f"{title_ar}: {'، '.join(contents_ar[:2])}. اطلب أونلاين في دبي من ميزون بوتانيك."}}},
        "review_flags": rflags,
        "metafields": [{"namespace": "maison", "key": "reference_id", "type": "single_line_text_field", "value": ref},
                       {"namespace": "maison", "key": "review_flags", "type": "single_line_text_field", "value": ";".join(rflags)},
                       {"namespace": "maison", "key": "answer_summary", "type": "multi_line_text_field", "value": summary}],
        "body_html_original": None, "visual_spec": visual, "owner_to_confirm": "", "description_status": "restored_from_source_listing",
        "image_prompt": None, "legacy_variants_removed": None,
        "answer_summary": {"en": summary, "ar": f"{title_ar} من ميزون بوتانيك تشمل {'، '.join(contents_ar)}. متوفرة بأحجام سيغنتشر وغراند ولوكس."},
        "faq": [{"q": f"What is included in {title}?", "a": "; ".join(contents)},
                {"q": f"What sizes does {title} come in?", "a": f"Signature – {fl(1)}; Grand – {fl(2)}; Luxe – {fl(3)}. {keep_note}"}],
    }


def main():
    data = json.loads(PRODUCTS.read_text())
    P = data["products"]
    by_title = {p["title"]: p for p in P}
    have = {p["reference_id"] for p in P}
    next_no = {}
    for p in P:
        for v in p["variants"]:
            parts = v["sku"].split("-")
            if len(parts) > 2 and parts[2].isdigit():
                next_no[parts[1]] = max(next_no.get(parts[1], 0), int(parts[2]))
    added = 0
    for n in NEW:
        if n[2] in have: continue
        t = by_title[n[4]]
        pre = t["variants"][0]["sku"].split("-")[1]
        next_no[pre] += 1
        P.append(build(n, data, t, next_no[pre])); added += 1
    P.sort(key=lambda p: p["catalog_number"])
    handles = [p["handle"] for p in P]
    assert len(handles) == len(set(handles)), "duplicate handle"
    data["meta"]["count"] = len(P)
    data["meta"]["restored_note"] = ("10 near-duplicate concepts restored as their own products on owner decision 18 Oct 2026 "
                                     "(review flag restored_from_duplicate_group). 6 exact duplicates stay merged.")
    PRODUCTS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"added {added}; products now {len(P)}")


if __name__ == "__main__":
    main()
