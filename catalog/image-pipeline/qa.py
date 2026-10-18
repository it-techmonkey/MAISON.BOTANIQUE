#!/usr/bin/env python3
"""Automatic checks + contact sheets for generated images.

  python3 qa.py --config gpt2-medium --jobs jobs/pilot.jsonl     checks + labelled sheets in qa/
  python3 qa.py --compare jobs/pilot.jsonl                       one row per product, one column per config

Automatic checks: file decodes, expected size, not blank/tiny, near-duplicate pictures (perceptual hash),
missing outputs. Product-match checks (colours, counts, spelling of the tag) are still a human look
at the sheets: use the checklist printed at the end.
"""
import argparse, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageStat
from config import CONFIGS, ROOT

T = 360


def dhash(im, n=16):
    g = im.convert("L").resize((n + 1, n)); px = list(g.tobytes()); b = 0
    for r in range(n):
        for c in range(n): b = (b << 1) | (px[r * (n + 1) + c] > px[r * (n + 1) + c + 1])
    return b


def sheet(items, path, cols=5, label=True):
    rows = (len(items) + cols - 1) // cols
    sh = Image.new("RGB", (cols * T, rows * (T + 24)), "white"); d = ImageDraw.Draw(sh)
    for i, (name, f) in enumerate(items):
        x, y = (i % cols) * T, (i // cols) * (T + 24)
        if f: sh.paste(Image.open(f).convert("RGB").resize((T, T)), (x, y + 24))
        d.text((x + 4, y + 6), name[:55], fill="black")
    sh.save(path, quality=85)


def check(config, jobs):
    out = ROOT / "out" / config; (ROOT / "qa").mkdir(exist_ok=True)
    cfg = CONFIGS[config]; keys = {j["key"]: j for j in jobs}
    files = {f.stem: f for f in sorted(out.glob("*.png"))}
    problems, hashes = [], {}
    for k, f in files.items():
        try:
            im = Image.open(f); im.load()
        except Exception as e:
            problems.append((k, f"cannot decode: {e}")); continue
        if f.stat().st_size < 60_000: problems.append((k, f"suspiciously small file ({f.stat().st_size} bytes)"))
        if min(im.size) < 1000: problems.append((k, f"low resolution {im.size}"))
        if im.size[0] != im.size[1]: problems.append((k, f"not square {im.size}"))
        if max(ImageStat.Stat(im.convert('L')).stddev) < 12: problems.append((k, "almost blank / flat image"))
        hashes[k] = dhash(im)
    ks = list(hashes)
    for i in range(len(ks)):
        for j in range(i + 1, len(ks)):
            if bin(hashes[ks[i]] ^ hashes[ks[j]]).count("1") <= 28:
                problems.append((ks[i], f"near-duplicate of {ks[j]}"))
    missing = [k for k in keys if k not in files]
    extra = [k for k in files if k not in keys]
    items = [(f"{keys[k]['catalog_number'] if k in keys else '?'} {k}", files[k]) for k in files]
    for n in range(0, len(items), 20): sheet(items[n:n + 20], ROOT / "qa" / f"{config}-sheet{n // 20 + 1}.jpg")
    print(f"{config}: {len(files)} images, {len(missing)} missing, {len(problems)} automatic problems")
    for k, p in problems: print("  PROBLEM", k, "-", p)
    if missing: print("  MISSING:", ", ".join(missing[:20]), "..." if len(missing) > 20 else "")
    if extra: print("  not in jobs file:", extra[:10])
    json.dump({"config": config, "images": len(files), "missing": missing, "problems": problems}, open(ROOT / "qa" / f"{config}-report.json", "w"), indent=1)
    print("  contact sheets ->", ROOT / "qa")
    print("""
  Human checklist per image (tick against the product listing):
   [ ] correct flower types and colours, nothing extra   [ ] stem count looks right for the price
   [ ] container/format right (vase, box, basket, wrap)   [ ] gift items all present
   [ ] tag reads MAISON BOTANIQUE, spelled exactly        [ ] no other text, logos, characters or watermarks
   [ ] no distorted petals/hands/glass, natural shadows   [ ] looks different from neighbouring products""")


def compare(jobs):
    cfgs = [c for c in CONFIGS if (ROOT / "out" / c).exists() and any((ROOT / "out" / c).glob("*.png"))]
    cfgs += sorted(p.name for p in (ROOT / "out").glob("chat-*") if any(p.glob("*.png")))  # manual ChatGPT-app images (chat_pilot.py)
    if not cfgs: raise SystemExit("No outputs yet.")
    cols = len(cfgs) + 1; S = 280
    sh = Image.new("RGB", (cols * S, (len(jobs) + 1) * (S + 4) + 24), "white"); d = ImageDraw.Draw(sh)
    for c, name in enumerate(["product"] + cfgs): d.text((c * S + 6, 6), name, fill="black")
    for r, j in enumerate(jobs):
        y = 24 + r * (S + 4); d.text((6, y + S // 2), f"{j['catalog_number']} {j['title']}"[:40], fill="black")
        for c, cfg in enumerate(cfgs, 1):
            f = ROOT / "out" / cfg / f"{j['key']}.png"
            if f.exists(): sh.paste(Image.open(f).convert("RGB").resize((S, S)), (c * S, y))
    p = ROOT / "qa" / "compare-pilot.jpg"; sh.save(p, quality=82); print("wrote", p)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--config", choices=CONFIGS); ap.add_argument("--jobs"); ap.add_argument("--compare")
    a = ap.parse_args()
    if a.compare: compare([json.loads(l) for l in open(a.compare) if l.strip()])
    elif a.config and a.jobs: check(a.config, [json.loads(l) for l in open(a.jobs) if l.strip()])
    else: ap.error("use --config X --jobs FILE, or --compare FILE")
