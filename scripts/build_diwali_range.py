#!/usr/bin/env python3
"""Diwali 2026 range: one definition for the storefront preview data and the Shopify draft payloads.

Change a price in PRICES, rerun, and both outputs follow:
  python3 scripts/build_diwali_range.py [--payloads DIR]

Writes the ten records into src/data/seasonal-products.json (the toran and Halloween entries are untouched) and,
with --payloads, one Shopify productSet input per product. It never talks to Shopify.
Compare-at is price / 0.9 rounded, so every struck price shows a calculated "10% off" tag.
"""
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / 'src/data/seasonal-products.json'
DELIVERY = {'from': '2026-11-05', 'to': '2026-11-08'}  # pre-order now, delivered from 5 Nov, before Diwali (Sunday 8 Nov)
TAIL = ('Delivered from 5 November, before Diwali', 'التوصيل من 5 نوفمبر، قبل ديوالي')

# AED, recommended draft prices (owner still deciding). Size name -> price.
PRICES = {
    'the-doorstep-set': {'Signature': 289},
    'the-marigold-welcome': {'Signature': 399, 'Grand': 529},
    'the-marigold-and-mithai-trunk': {'Signature': 369},
    'the-hosts-trunk': {'Signature': 549},
    'marigold-haat-bouquet': {'Signature': 199, 'Grand': 359, 'Luxe': 519},
    'brass-lota-posy': {'Signature': 249},
    'marigold-urli': {'Signature': 179},
    'thoranam-door-arch': {'Signature': 399},
    'entrance-pair': {'Signature': 289, 'Grand': 499},
    'flower-rangoli-tray': {'Signature': 279},
    'marigold-petal-rangoli-tray': {'Signature': 279},
}
# One place for what customers ask first: how big is it. Feeds the size lines on the card, the product page (size_details),
# the Shopify description and variant titles, and dimensions.json for the PDFs. (en, ar) per size, in size order.
DIMENSIONS = {
    'the-doorstep-set': [('4 ft toran', 'إكليل 4 أقدام')],
    'the-marigold-welcome': [('4 ft toran', 'إكليل 4 أقدام'), ('6 ft toran, double the flowers', 'إكليل 6 أقدام وضعف الزهور')],
    'the-marigold-and-mithai-trunk': [('4 ft toran', 'إكليل 4 أقدام')],
    'the-hosts-trunk': [('6 ft toran, for a double door', 'إكليل 6 أقدام لباب مزدوج')],
    'marigold-haat-bouquet': [('15 marigold, 5 rose, 6 chrysanthemum stems', '15 قطيفة و5 ورود و6 أقحوان'),
                              ('30 marigold, 10 rose, 12 chrysanthemum stems', '30 قطيفة و10 ورود و12 أقحوان'),
                              ('45 marigold, 15 rose, 18 chrysanthemum stems', '45 قطيفة و15 ورداً و18 أقحوان')],
    'brass-lota-posy': [('lota about 12 cm', 'لوتا بارتفاع 12 سم تقريباً')],
    'marigold-urli': [('urli about 10 in', 'أورلي بقطر 10 إنش تقريباً')],
    'thoranam-door-arch': [('single door, about 3 ft wide', 'لباب واحد، بعرض 3 أقدام تقريباً')],
    'entrance-pair': [('two garlands, about 4 ft each', 'إكليلان، 4 أقدام تقريباً لكل منهما'), ('two garlands, about 8 ft each', 'إكليلان، 8 أقدام تقريباً لكل منهما')],
    'flower-rangoli-tray': [('35 cm (about 14 in) plate', 'صحن 35 سم (حوالي 14 إنش)')],
    'marigold-petal-rangoli-tray': [('35 cm (about 14 in) plate', 'صحن 35 سم (حوالي 14 إنش)')],
}
SIZE_AR = {'Signature': 'سيغنتشر', 'Grand': 'غراند', 'Luxe': 'لوكس'}
IMG = {'the-doorstep-set': 'b1', 'the-marigold-welcome': 'b2', 'the-marigold-and-mithai-trunk': 'b3', 'the-hosts-trunk': 'b4',
       'marigold-haat-bouquet': 'f1', 'brass-lota-posy': 'f2', 'marigold-urli': 'f3', 'thoranam-door-arch': 'f4',
       'entrance-pair': 'f5', 'flower-rangoli-tray': 'f6', 'marigold-petal-rangoli-tray': 'f6'}

# id, no, title, title_ar, line, line_ar, contents, contents_ar, size detail, size detail ar, alt, seo title, seo desc, occasions, flags
P = [
 dict(id='the-doorstep-set', no=338, sku='MB-SE-006', room='gifts', format='gift', stems=None,
  name='The Doorstep Set — Toran, Petals and Diyas', nameAr='طقم عتبة الباب — قطيفة وبتلات وديّات',
  line='Toran, petal rangoli box and brass diyas', lineAr='إكليل قطيفة وصندوق بتلات وديّات نحاسية',
  contents=['4 ft Marigold Toran (fresh marigolds on cotton ties)', 'Fresh petal rangoli box: loose marigold and rose petals in an ivory box', 'Pair of brass diyas with wicks and a small bottle of oil', 'Handwritten card'],
  contentsAr=['إكليل قطيفة طازجة بطول 4 أقدام على أربطة قطنية', 'صندوق بتلات للرانغولي: بتلات قطيفة وورد في صندوق عاجي', 'ديّتان نحاسيتان مع فتائل وزجاجة زيت صغيرة', 'بطاقة بخط اليد'],
  alt='Marigold toran over a doorway with a petal rangoli box and a pair of brass diyas', seoT='The Doorstep Set | Diwali Toran and Diyas', seoD='Fresh marigold toran, petal rangoli box and brass diyas for your Diwali doorway. Order online in Dubai from Maison Botanique.',
  occ=['diwali'], tags=['Gift sets'], flags='own_cost_estimated'),
 dict(id='the-marigold-welcome', no=339, sku='MB-SE-007', room='gifts', format='gift', stems=None,
  name='The Marigold Welcome — Toran and Marigold Arrangement', nameAr='ترحيب القطيفة — زينة الباب مع تنسيق قطيفة وورد',
  line='Toran, marigold and rose arrangement, diyas', lineAr='إكليل قطيفة وتنسيق قطيفة وورد وديّات',
  contents=['Marigold Toran (4 ft Signature, 6 ft Grand)', 'Marigold and rose arrangement in a brass goblet vase (flowers double in Grand)', 'Pair of brass diyas with wicks and oil', 'Handwritten card'],
  contentsAr=['إكليل قطيفة (4 أقدام سيغنتشر، 6 أقدام غراند)', 'تنسيق قطيفة وورد في مزهرية نحاسية (الزهور ضعف في غراند)', 'ديّتان نحاسيتان مع فتائل وزيت', 'بطاقة بخط اليد'],
  alt='Marigold toran above an entrance with a marigold and rose arrangement in a brass vase and two diyas', seoT='The Marigold Welcome | Diwali Toran Set', seoD='Fresh marigold toran with a marigold and rose arrangement and brass diyas. Order Diwali gifts online in Dubai.',
  occ=['diwali'], tags=['Gift sets'], flags='own_cost_estimated'),
 dict(id='the-marigold-and-mithai-trunk', no=340, sku='MB-SE-008', room='gifts', format='gift', stems=None,
  name='The Marigold & Mithai Trunk — Toran with Mithai and Handwoven Trunk', nameAr='صندوق القطيفة والمثاي — زينة الباب مع هدية مختارة',
  line='Toran, mithai box, handwoven trunk and diya holders', lineAr='إكليل قطيفة وصندوق مثاي وصندوق منسوج وحاملا ديّة',
  contents=['4 ft Marigold Toran', 'Conscious Curations wicker trunk', 'Chefat65 mithai box, 12 pc', 'Wooden-block diya tealight holders, pair', 'Fresh marigold posy tied with ivory ribbon', 'Handwritten card'],
  contentsAr=['إكليل قطيفة بطول 4 أقدام', 'صندوق قش من كونشس كيوريشنز', 'علبة مثاي من Chefat65، 12 قطعة', 'حاملا شموع خشبيان للديّات', 'باقة قطيفة صغيرة بشريطة عاجية', 'بطاقة بخط اليد'],
  alt='Handwoven trunk with a marigold toran, a mithai box, wooden diya holders and a small marigold posy', seoT='Marigold & Mithai Trunk | Diwali Gift', seoD='Marigold toran with a handwoven trunk, homemade mithai and diya holders. Diwali gift, order online in Dubai.',
  occ=['diwali'], tags=['Gift sets', 'Conscious Curations'], flags='partner_cost_to_confirm'),
 dict(id='the-hosts-trunk', no=341, sku='MB-SE-009', room='gifts', format='gift', stems=None,
  name='The Host’s Trunk — Toran with Handcrafted Table Gift', nameAr='صندوق المضيف — زينة الباب 6 أقدام مع هدية يدوية الصنع',
  line='6 ft toran with a tray, ceramics, candle and mithai', lineAr='إكليل 6 أقدام مع صينية وخزف وشمعة ومثاي',
  contents=['6 ft Marigold Toran', 'Conscious Curations Sirohi elegant tray', 'Terracotta candle', 'Wooden-block diya tealight holders, pair', 'Blooming Leaves coffee mugs, pair', 'Chefat65 mithai box, 12 pc', 'Handwritten card'],
  contentsAr=['إكليل قطيفة بطول 6 أقدام', 'صينية سيروهي من كونشس كيوريشنز', 'شمعة فخارية', 'حاملا شموع خشبيان للديّات', 'كوبا قهوة من Blooming Leaves', 'علبة مثاي من Chefat65، 12 قطعة', 'بطاقة بخط اليد'],
  alt='Six foot marigold toran with a woven tray, terracotta candle, ceramic mugs and a mithai box', seoT='The Host’s Trunk | Diwali Gift Set', seoD='A 6 ft marigold toran with a handwoven tray, handcrafted ceramics and mithai. Diwali hosting gift in Dubai.',
  occ=['diwali'], tags=['Gift sets', 'Conscious Curations'], flags='partner_cost_to_confirm'),
 dict(id='marigold-haat-bouquet', no=342, sku='MB-SE-010', room='bouquets', format='bouquet', stems=26,
  name='Marigold Haat Bouquet — Hand-Tied Marigold, Rose and Chrysanthemum', nameAr='باقة القطيفة — باقة مربوطة يدويًا',
  line='Hand-tied marigold, cream spray roses, button chrysanthemum', lineAr='قطيفة وورد رذاذ كريمي وأقحوان أبيض مربوطة يدويًا',
  contents=['15 marigold stems, 5 cream spray roses, 6 white button chrysanthemum stems', 'Ivory paper, natural jute twine', 'Handwritten card'],
  contentsAr=['15 غصن قطيفة و5 ورود رذاذ كريمية و6 أغصان أقحوان أبيض', 'ورق عاجي وخيط جوت طبيعي', 'بطاقة بخط اليد'],
  alt='Hand-tied bouquet of orange marigolds, cream spray roses and white button chrysanthemum in ivory paper and jute', seoT='Marigold Haat Bouquet | Diwali Flowers Dubai', seoD='Hand-tied marigold, cream spray roses and button chrysanthemum in ivory paper and jute. Order online in Dubai from Maison Botanique.',
  occ=['diwali'], tags=[], flags='own_cost_estimated;sourcing_unverified'),
 dict(id='brass-lota-posy', no=343, sku='MB-SE-011', room='gifts', format='gift', stems=None,
  name='Brass Lota Posy — Marigold, Roses and Tuberose in a Brass Pot', nameAr='باقة اللوتا النحاسية — قطيفة وورد وتيوبروز',
  line='Marigold, cream roses and tuberose in a brass lota', lineAr='قطيفة وورد كريمي وتيوبروز في لوتا نحاسية',
  contents=['9 marigold stems, 5 cream roses, 5 tuberose stems, a few green leaves', 'Polished brass lota (water pot), about 12 cm, yours to keep', 'Handwritten card'],
  contentsAr=['9 أغصان قطيفة و5 ورود كريمية و5 أغصان تيوبروز وبعض الأوراق', 'لوتا نحاسية لامعة (وعاء ماء) بارتفاع 12 سم تبقى لكم', 'بطاقة بخط اليد'],
  alt='Marigolds, cream roses and tuberose in a polished brass lota', seoT='Brass Lota Posy | Marigold Flowers Dubai', seoD='Marigold, cream roses and tuberose in a brass lota you keep. Order Diwali flowers online in Dubai from Maison Botanique.',
  occ=['diwali'], tags=[], flags='own_cost_estimated;sourcing_unverified'),
 dict(id='marigold-urli', no=344, sku='MB-SE-012', room='gifts', format='gift', stems=None,
  name='Marigold Urli — Floating Marigolds in a Brass Bowl', nameAr='أورلي القطيفة — رؤوس قطيفة عائمة في وعاء نحاسي',
  line='Floating marigold heads and petals in a brass urli', lineAr='رؤوس قطيفة وبتلات عائمة في أورلي نحاسي',
  contents=['Bronze-brass urli, about 10 in, filled with water', 'About 40 floating marigold heads and a scatter of rose petals', 'One tealight to float (optional, no flame is needed)'],
  contentsAr=['أورلي من البرونز والنحاس بقطر 10 إنش مملوء بالماء', 'نحو 40 رأس قطيفة عائمة وبتلات ورد', 'شمعة صغيرة للطفو (اختيارية، لا حاجة للهب)'],
  alt='Marigold heads and rose petals floating in a brass urli bowl', seoT='Marigold Urli | Floating Flowers Diwali Dubai', seoD='Floating marigold heads and petals in a brass urli, no flame needed. Order online in Dubai from Maison Botanique.',
  occ=['diwali'], tags=[], flags='own_cost_estimated;sourcing_unverified'),
 dict(id='thoranam-door-arch', no=345, sku='MB-SE-013', room='gifts', format='gift', stems=None,
  name='Thoranam Door Arch — Fresh Marigold and Mogra Door Swag', nameAr='قوس الباب ثورانام — قطيفة ومغرا وأوراق خضراء',
  line='A layered fresh swag for the top of your door', lineAr='قوس طازج متعدد الطبقات لأعلى الباب',
  contents=['Single door, about 3 ft: three layered swags of strung marigold, white mogra or jasmine and green leaf, with a leaf edge', 'Cotton rope and hooks, ready to hang'],
  contentsAr=['لباب واحد بطول 3 أقدام تقريبًا: ثلاث طبقات من القطيفة والمغرا أو الياسمين الأبيض والأوراق الخضراء', 'حبل قطني وخطافات، جاهز للتعليق'],
  alt='Layered marigold, white mogra and leaf swag hung over a doorway', seoT='Thoranam Door Arch | Fresh Door Flowers Dubai', seoD='A layered fresh door-top swag of marigold, mogra and leaf, ready to hang. Order for Diwali in Dubai from Maison Botanique.',
  occ=['diwali'], tags=['Door decor', 'Toran'], flags='own_cost_estimated;sourcing_unverified;sample_required'),
 dict(id='entrance-pair', no=346, sku='MB-SE-014', room='gifts', format='gift', stems=None,
  name='Entrance Pair — Two Fresh Hanging Door Garlands', nameAr='زوج المدخل — أكاليل عمودية للباب',
  line='Two vertical garlands for either side of the door', lineAr='إكليلان عموديان على جانبي الباب',
  contents=['Two vertical garlands, about 4 ft each: marigold alternating with white jasmine and leaf, a tassel at each end', 'Cotton ties for the door top'],
  contentsAr=['إكليلان عموديان بطول 4 أقدام تقريبًا لكل منهما: قطيفة بالتناوب مع ياسمين أبيض وأوراق وزخرفة في كل طرف', 'أربطة قطنية لأعلى الباب'],
  alt='Two vertical marigold and jasmine garlands hanging on either side of a door', seoT='Entrance Pair | Fresh Door Garlands Dubai', seoD='Two fresh hanging garlands of marigold and jasmine for the sides of your door. Order for Diwali in Dubai.',
  occ=['diwali'], tags=['Door decor', 'Toran'], flags='own_cost_estimated;sourcing_unverified;sample_required'),
 dict(id='flower-rangoli-tray', no=347, sku='MB-SE-015', room='gifts', format='gift', stems=None,
  name='Flower Rangoli Tray (Pookalam) — Fresh Petal Rangoli on a Round Tray', nameAr='صينية رانغولي الزهور (بوكالام)',
  line='A fresh petal rangoli in rings on a round tray', lineAr='رانغولي بتلات طازجة على شكل حلقات في صينية مستديرة',
  contents=['35 cm (about 14 in) round wooden plate, petal rangoli in rings (orange and yellow marigold petals, green leaf edge), a small brass diya at the centre', 'Arrives pre-laid in a lidded box'],
  contentsAr=['صحن خشبي مستدير 35 سم (حوالي 14 إنش) برانغولي من البتلات في حلقات (بتلات قطيفة برتقالية وصفراء وحافة من الأوراق الخضراء) وديّة نحاسية صغيرة في الوسط', 'تصل جاهزة داخل صندوق بغطاء'],
  alt='Round wooden tray with concentric rings of orange and yellow marigold petals and a green leaf edge around a small brass diya', seoT='Flower Rangoli Tray | Pookalam Dubai', seoD='A fresh petal rangoli in rings on a round tray, arrives ready to place. Order for Diwali in Dubai from Maison Botanique.',
  occ=['diwali'], tags=[], flags='own_cost_estimated;sourcing_unverified;sample_required'),
 dict(id='marigold-petal-rangoli-tray', no=348, sku='MB-SE-016', room='gifts', format='gift', stems=None,
  name='Marigold Petal Rangoli Tray — Fresh Marigold Petal Rangoli', nameAr='صينية رانغولي بتلات القطيفة',
  line='A fresh petal rangoli in rings on a round tray', lineAr='رانغولي بتلات طازجة على شكل حلقات في صينية مستديرة',
  contents=['35 cm (about 14 in) round wooden plate, petal rangoli in rings (orange and yellow marigold petals, edge to edge), a small brass diya at the centre', 'Arrives pre-laid in a lidded box'],
  contentsAr=['صحن خشبي مستدير 35 سم (حوالي 14 إنش) برانغولي من البتلات في حلقات (بتلات قطيفة برتقالية وصفراء حتى الحافة) وديّة نحاسية صغيرة في الوسط', 'تصل جاهزة داخل صندوق بغطاء'],
  alt='Round wooden tray with concentric rings of orange and yellow marigold petals edge to edge around a small brass diya', seoT='Marigold Petal Rangoli Tray Dubai', seoD='A fresh petal rangoli in rings on a round tray, arrives ready to place. Order for Diwali in Dubai from Maison Botanique.',
  occ=['diwali'], tags=[], flags='own_cost_estimated;sourcing_unverified;sample_required'),
]
FOR_DAYS = {'the-doorstep-set', 'the-marigold-welcome', 'the-marigold-and-mithai-trunk', 'the-hosts-trunk'}


def struck(price): return round(price / 0.9)


def sizes_of(p):
    out = []
    for i, (name, price) in enumerate(PRICES[p['id']].items()):
        out.append({'id': name.lower(), 'sku': f"{p['sku']}-{name[:3].upper().replace('SIG', 'SIG').replace('GRA', 'GRD').replace('LUX', 'LUX')}",
                    'name': name, 'nameAr': SIZE_AR[name], 'detail': DIMENSIONS[p['id']][i][0], 'detailAr': DIMENSIONS[p['id']][i][1],
                    'price': price, 'compareAtPrice': struck(price)})
    return out


def store_record(p):
    return {'id': p['id'], 'no': p['no'], 'sku': p['sku'], 'name': p['name'], 'nameAr': p['nameAr'], 'room': p['room'], 'format': p['format'],
            'flowers': ['marigold'], 'occasions': p['occ'], 'line': p['line'], 'lineAr': p['lineAr'],
            'composition': p['contents'] + [TAIL[0]], 'compositionAr': p['contentsAr'] + [TAIL[1]], 'stems': p['stems'],
            'imageAlt': p['alt'], 'option': 'Size', 'sizes': sizes_of(p)}


def mf(key, value, kind='single_line_text_field'):
    return {'namespace': 'maison', 'key': key, 'type': kind, 'value': value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)}


def shopify_input(p):
    sizes = sizes_of(p)
    items = ''.join(f'<li>{c}</li>' for c in p['contents'] + [TAIL[0]])
    size_html = ''.join(f"<li>{x['name']} – {x['detail']}</li>" if len(sizes) > 1 else f"<li>{x['detail'][0].upper() + x['detail'][1:]}</li>" for x in sizes)
    body = f"<p><strong>What's included</strong></p><ul>{items}</ul><p><strong>Size</strong></p><ul>{size_html}</ul><p>Diwali pre-order: paid at checkout, delivered on the day you choose from 5 November, before Diwali (Sunday 8 November).</p>"
    sizelist = ', '.join(s['name'] for s in sizes)
    one = len(sizes) == 1
    summary = f"{p['name']} from Maison Botanique: {p['line'].lower()}. {'One size' if one else 'Sizes: ' + sizelist}. Diwali pre-order, delivered from 5 November, before Diwali."
    summaryAr = f"{p['nameAr']} من ميزون بوتانيك. طلب مسبق لديوالي، التوصيل من 5 نوفمبر، قبل ديوالي."
    return {
        'title': p['name'], 'handle': p['id'], 'status': 'DRAFT', 'vendor': 'Maison Botanique', 'productType': 'Diwali',
        'tags': ['season:diwali', 'preorder', 'flower:marigold', 'occasion:diwali', f"format:{p['format']}"] + p['tags'], 'descriptionHtml': body,
        'seo': {'title': p['seoT'][:70], 'description': p['seoD']},
        'productOptions': [{'name': 'Size', 'values': [{'name': f"{s['name']} – {s['detail']}"} for s in sizes]}],
        'variants': [{'optionValues': [{'optionName': 'Size', 'name': f"{s['name']} – {s['detail']}"}], 'sku': s['sku'], 'price': f"{s['price']}.00", 'compareAtPrice': f"{s['compareAtPrice']}.00"} for s in sizes],
        'metafields': [
            mf('card_line', p['line']), mf('card_line_ar', p['lineAr']), mf('composition', p['contents'] + [TAIL[0]], 'list.single_line_text_field'),
            mf('composition_ar', p['contentsAr'] + [TAIL[1]], 'list.single_line_text_field'), mf('sort_order', str(p['no'] - 332), 'number_integer'),
            mf('catalog_number', str(p['no']), 'number_integer'), mf('room', p['room']),
            mf('size_details', [{'name': s['name'], 'nameAr': s['nameAr'], 'detail': s['detail'], 'detailAr': s['detailAr']} for s in sizes], 'json'),
            mf('title_ar', p['nameAr']), mf('description_ar', 'ما يتضمنه\n' + '\n'.join(p['contentsAr'] + [TAIL[1]]) + '\nالمقاس\n' + '\n'.join((f"{x['nameAr']} – {x['detailAr']}" if len(sizes) > 1 else x['detailAr']) for x in sizes), 'multi_line_text_field'),
            mf('answer_summary', summary, 'multi_line_text_field'), mf('answer_summary_ar', summaryAr, 'multi_line_text_field'),
            mf('faq', [{'q': f"What is included in {p['name'].split(' — ')[0]}?", 'a': '; '.join(p['contents'])}], 'json'),
            mf('image_status', 'ai_concept_2026_11_02_pending_real_sample'), mf('review_flags', p['flags']),
        ],
    }


def inline(v):
    if isinstance(v, dict): return '{ ' + ', '.join(f'{json.dumps(k)}: {inline(x)}' for k, x in v.items()) + ' }'
    if isinstance(v, list): return '[' + ', '.join(inline(x) for x in v) + ']'
    return json.dumps(v, ensure_ascii=False)


def block(rec):
    lines = []
    for k, v in rec.items():
        if k == 'sizes': lines.append('      "sizes": [\n' + ',\n'.join('        ' + inline(z) for z in v) + '\n      ]')
        else: lines.append(f'      {json.dumps(k)}: {inline(v)}')
    return '    {\n' + ',\n'.join(lines) + '\n    }'


def patch(text):
    """Edit the file as text so the existing entries keep their formatting; reruns replace our ten entries."""
    ids = [p['id'] for p in P]
    head, tail = text.split('  "products": [\n', 1)
    body = tail.rsplit('\n  ]\n}', 1)[0]
    entries = [e for e in body.split(',\n    {\n') if True]
    entries = [e if e.startswith('    {') else '    {\n' + e for e in entries]
    keep = [e for e in entries if not any(f'"id": "{i}",' in e.split('\n')[1] for i in ids)]
    keep = [e if e.rstrip().endswith('}') else e.rstrip() + '\n    }' for e in keep]
    out = ',\n'.join(keep + [block(store_record(p)) for p in P])
    import re
    head = re.sub(r'"diwali": \[[^\]]*\]', '"diwali": ' + json.dumps(['marigold-toran'] + ids), head)
    head = re.sub(r'(    "marigold-toran": \{[^\n]*\})(,?)\n  \}', lambda m: m.group(1) + ',\n' + ',\n'.join(f'    "{i}": {inline(DELIVERY)}' for i in ids if f'"{i}":' not in head) + '\n  }' if any(f'"{i}":' not in head for i in ids) else m.group(0), head)
    return head + '  "products": [\n' + out + '\n  ]\n}\n'


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--payloads', type=pathlib.Path)
    ap.add_argument('--dimensions', type=pathlib.Path, help='write dimensions.json for the PDFs')
    args = ap.parse_args()
    DATA.write_text(patch(DATA.read_text()))
    json.loads(DATA.read_text())  # fail loudly if the edit broke the file
    if args.payloads:
        args.payloads.mkdir(parents=True, exist_ok=True)
        for p in P:
            (args.payloads / f"{p['sku']}-{p['id']}.json").write_text(json.dumps({'product': shopify_input(p)}, ensure_ascii=False, indent=1))
    if args.dimensions:
        args.dimensions.write_text(json.dumps({p['id']: [{'size': z['name'], 'en': z['detail'], 'ar': z['detailAr']} for z in sizes_of(p)] for p in P}, ensure_ascii=False, indent=1))
    for p in P:
        print(p['sku'], p['id'], [(s['sku'], s['price'], s['compareAtPrice']) for s in sizes_of(p)])
