"""The strikethrough ("compare at") price rule.

Each product shows its selling price as a saving of MIN_OFF to MAX_OFF percent
against a struck-through price (owner decision, 2026-10-20). The percentage is
picked once per product from a hash of its handle, so it looks varied across the
catalogue but never changes between runs, between sizes of one product, or
between the product page and checkout. The selling prices are not touched.
"""

import hashlib

MIN_OFF = 40
MAX_OFF = 60


def percent_off(handle):
    """Whole-number saving (MIN_OFF..MAX_OFF) for a product."""
    digest = int(hashlib.sha256(handle.encode("utf-8")).hexdigest(), 16)
    return MIN_OFF + digest % (MAX_OFF - MIN_OFF + 1)


def strikethrough(price, handle):
    """The struck-through price, in whole dirhams, for a selling price."""
    return round(float(price) / (1 - percent_off(handle) / 100))
