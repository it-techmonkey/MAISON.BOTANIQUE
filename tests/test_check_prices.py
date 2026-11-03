import csv
import importlib.util
import io
import json
import unittest
from collections import defaultdict
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('check_prices', ROOT / 'scripts/check_prices.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()


def storefront_rows():
    products = defaultdict(list)
    with (ROOT / 'catalog/shopify-export/variant-prices.csv').open() as ledger:
        for row in csv.DictReader(ledger):
            products[row['handle']].append({
                'sku': row['sku'],
                'price': {'amount': row['price']},
                'compareAtPrice': {'amount': row['compare_at_price']},
            })
    for product in json.loads((ROOT / 'src/data/seasonal-products.json').read_text())['products']:
        for size in product['sizes']:
            products[product['id']].append({
                'sku': size['sku'],
                'price': {'amount': str(size['price'])},
                'compareAtPrice': {'amount': str(size['compareAtPrice'])} if size['compareAtPrice'] else None,
            })
    return [{'handle': handle, 'variants': {'pageInfo': {'hasNextPage': False}, 'nodes': variants}}
            for handle, variants in products.items()]


def fake_urlopen(products):
    def respond(request, timeout):
        assert timeout == 30
        cursor = json.loads(request.data)['variables']['after']
        start = int(cursor) if cursor else 0
        end = min(start + 100, len(products))
        payload = {'data': {'products': {
            'pageInfo': {'hasNextPage': end < len(products), 'endCursor': str(end)},
            'nodes': products[start:end],
        }}}
        return FakeResponse(json.dumps(payload).encode())
    return respond


class SeasonalLivePrices(unittest.TestCase):
    def run_checker(self, products):
        with patch.dict(checker.os.environ, {
            'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN': 'test.myshopify.com',
            'NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN': 'test-token',
        }), patch.object(checker, 'urlopen', side_effect=fake_urlopen(products)):
            checker.check_prices()

    def test_live_ledger_plus_seven_seasonal_variants_passes(self):
        products = storefront_rows()
        self.assertEqual(sum(len(product['variants']['nodes']) for product in products if product['handle'] in {
            'pumpkin-and-pralines', 'the-pumpkin-basket', 'jack-o-bloom', 'the-midnight-pumpkin', 'marigold-toran',
        }), 7)
        self.run_checker(products)

    def test_changed_seasonal_price_and_unknown_sku_fail(self):
        products = storefront_rows()
        toran = next(product for product in products if product['handle'] == 'marigold-toran')
        toran['variants']['nodes'][0]['price']['amount'] = '98'
        with self.assertRaisesRegex(AssertionError, 'Live seasonal price'):
            self.run_checker(products)

        products = storefront_rows()
        pumpkin = next(product for product in products if product['handle'] == 'pumpkin-and-pralines')
        pumpkin['variants']['nodes'][0]['compareAtPrice']['amount'] = '401'
        with self.assertRaisesRegex(AssertionError, 'Live seasonal compare-at'):
            self.run_checker(products)

        products = storefront_rows()
        products[0]['variants']['nodes'].append({'sku': 'UNKNOWN-SEASONAL', 'price': {'amount': '1'}, 'compareAtPrice': None})
        with self.assertRaisesRegex(AssertionError, 'coverage differs'):
            self.run_checker(products)


if __name__ == '__main__':
    unittest.main()
