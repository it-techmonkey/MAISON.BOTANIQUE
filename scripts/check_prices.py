"""Validate every bundled variant against the last approved Shopify price ledger.

If Storefront credentials are configured, also verify current live Shopify prices.
No writes are made to Shopify or local catalogue files.
"""
import csv
import json
import os
from decimal import Decimal
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


def seasonal_prices():
    """Seasonal pieces (src/data/seasonal-products.json) carry the owner's own prices,
    outside the ledger and the 40-60% struck-price rule (owner, 25 Oct 2026)."""
    data = json.loads((ROOT / 'src/data/seasonal-products.json').read_text())
    return {size['sku']: size for product in data['products'] for size in product['sizes']}


def check_prices():
    with (ROOT / 'catalog/shopify-export/variant-prices.csv').open() as ledger:
        rows = list(csv.DictReader(ledger))
    expected = {row['sku']: row for row in rows}
    assert len(expected) == len(rows), 'Duplicate ledger SKUs'
    products = json.loads((ROOT / 'src/data/collection.json').read_text())['products']
    seen = set()
    for product in products:
        assert product['sizes'], f"No sizes: {product['name']}"
        cheapest = min(product['sizes'], key=lambda size: size['price'])
        assert product['price'] == cheapest['price'], f"Incorrect From price: {product['name']}"
        assert product['compareAtPrice'] == cheapest['compareAtPrice'], f"Incorrect From compare-at: {product['name']}"
        for size in product['sizes']:
            sku = size['sku']
            assert sku not in seen, f'Duplicate bundled SKU: {sku}'
            seen.add(sku)
            row = expected[sku]
            assert row['handle'] == product['id'], f'Wrong product for {sku}'
            price = Decimal(str(size['price']))
            compare = Decimal(str(size['compareAtPrice']))
            assert price > 0 and compare > price, f'Invalid prices for {sku}'
            assert price == Decimal(row['price']), f'Selling price mismatch: {sku}'
            assert compare == Decimal(row['compare_at_price']), f'Compare-at mismatch: {sku}'
            # Owner decision 20 Oct: the selling price is 40-60% off the struck-through price
            # (scripts/strikethrough_rule.py). Compare-at prices are whole AED, so allow a point either side.
            assert compare == compare.to_integral_value(), f'Compare-at is not whole AED: {sku}'
            off = (1 - price / compare) * 100
            assert Decimal('39') <= off <= Decimal('61'), f'Strikethrough outside 40-60% off ({off:.1f}%): {sku}'
            assert Decimal(str(product['price'])) + Decimal(str(size['add'])) == price, f'Size increment: {sku}'
    assert seen == set(expected), 'Missing or extra bundled variants'

    env = dict(os.environ)
    local = ROOT / '.env.local'
    if local.exists():
        for line in local.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key, value = line.split('=', 1)
                env.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    domain = env.get('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN', '').strip()
    token = env.get('NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN', '').strip()
    if domain or token:
        import re
        assert token and re.fullmatch(r'[a-z0-9][a-z0-9-]*\.myshopify\.com', domain), 'Incomplete Shopify configuration'
        live, cursor = {}, None
        while True:
            query = '''query Prices($after: String) { products(first: 100, after: $after) {
              pageInfo { hasNextPage endCursor } nodes { handle variants(first: 250) {
                pageInfo { hasNextPage } nodes { sku price { amount } compareAtPrice { amount } }
              } }
            } }'''
            request = Request(f'https://{domain}/api/2026-10/graphql.json',
                              data=json.dumps({'query': query, 'variables': {'after': cursor}}).encode(),
                              headers={'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token})
            with urlopen(request, timeout=30) as response:
                payload = json.load(response)
            assert not payload.get('errors'), 'Shopify price query failed'
            page = payload['data']['products']
            for product in page['nodes']:
                assert not product['variants']['pageInfo']['hasNextPage'], 'Variant pagination required'
                for variant in product['variants']['nodes']:
                    sku = variant['sku']
                    assert sku and sku not in live, 'Missing or duplicate live SKU'
                    live[sku] = variant
            if not page['pageInfo']['hasNextPage']:
                break
            next_cursor = page['pageInfo']['endCursor']
            assert next_cursor and next_cursor != cursor, 'Invalid Shopify pagination'
            cursor = next_cursor
        seasonal = seasonal_prices()
        for sku, size in seasonal.items():
            variant = live.pop(sku, None)
            if variant is None:
                continue  # not published yet
            assert Decimal(variant['price']['amount']) == Decimal(str(size['price'])), f'Live seasonal price: {sku}'
            compare = variant['compareAtPrice'] and Decimal(variant['compareAtPrice']['amount'])
            expected_compare = size['compareAtPrice'] and Decimal(str(size['compareAtPrice']))
            assert (compare or None) == (expected_compare or None), f'Live seasonal compare-at: {sku}'
        assert set(live) == seen, 'Live and bundled variant coverage differs'
        for sku, variant in live.items():
            assert Decimal(variant['price']['amount']) == Decimal(expected[sku]['price']), f'Live selling price: {sku}'
            assert variant['compareAtPrice'], f'Live compare-at missing: {sku}'
            assert Decimal(variant['compareAtPrice']['amount']) == Decimal(expected[sku]['compare_at_price']), f'Live compare-at: {sku}'
        print(f'PASS: {len(seen)} variants match live Shopify and the approved ledger.')
    else:
        print(f'PASS: {len(seen)} variants match the approved ledger. Live Shopify NOT checked: no Storefront credentials.')


if __name__ == '__main__':
    check_prices()
