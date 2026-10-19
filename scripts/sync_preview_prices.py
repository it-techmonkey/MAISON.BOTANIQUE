"""Apply the approved Shopify price ledger to the bundled preview, without competitor repricing."""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sync_preview_prices():
    path = ROOT / 'src/data/collection.json'
    data = json.loads(path.read_text())
    by_product = {}
    for row in csv.DictReader((ROOT / 'catalog/shopify-export/variant-prices.csv').open()):
        by_product.setdefault(row['handle'], []).append(row)
    for product in data['products']:
        rows = by_product[product['id']]
        old = product['sizes']
        base = min(float(row['price']) for row in rows)
        sizes = []
        for index, row in enumerate(rows):
            original = next((size for size in old if size.get('sku') == row['sku']), None)
            if original is None and len(old) == len(rows):
                original = old[index]
            size = dict(original or {})
            size.update({
                'id': size.get('id') or re.sub('[^a-z0-9]+', '-', row['sku'].lower()).strip('-'),
                'sku': row['sku'], 'name': size.get('name', row['option']),
                'nameAr': size.get('nameAr', row['option']),
                'detail': size.get('detail', row['option']), 'detailAr': size.get('detailAr', row['option']),
                'price': float(row['price']), 'compareAtPrice': float(row['compare_at_price']),
                'add': round(float(row['price']) - base, 2),
            })
            sizes.append(size)
        cheapest = min(sizes, key=lambda size: size['price'])
        product.update(price=base, compareAtPrice=cheapest['compareAtPrice'], sizes=sizes)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Applied approved prices to {len(data['products'])} products and {sum(len(p['sizes']) for p in data['products'])} sizes.")


if __name__ == '__main__':
    sync_preview_prices()
