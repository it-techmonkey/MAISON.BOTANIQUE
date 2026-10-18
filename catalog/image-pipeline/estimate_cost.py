#!/usr/bin/env python3
"""Cost projection from what the pilot actually measured:  python3 estimate_cost.py --n 278 --retake 0.25"""
import argparse
from config import CONFIGS
import engine as E

ap = argparse.ArgumentParser(); ap.add_argument("--n", type=int, default=278); ap.add_argument("--retake", type=float, default=0.25)
a = ap.parse_args(); g = round(a.n * (1 + a.retake))
print(f"{a.n} products, {a.retake:.0%} retakes = {g} generations (real measured cost per image from the pilot)\n")
print(f"{'config':<20}{'images measured':>16}{'$/image':>9}{'sec/image':>10}{'sync total':>12}{'batch total':>12}")
for k in CONFIGS:
    m = E.measured(k)
    if m: print(f"{k:<20}{m['n']:>16}{m['avg_cost']:>9.3f}{m['avg_seconds']:>10.0f}{g * m['avg_cost']:>12.2f}{g * m['avg_cost'] * 0.5:>12.2f}")
print("\nNothing listed? Run the pilot first: python3 pilot.py --yes")
