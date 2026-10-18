#!/usr/bin/env python3
"""One command to run the OpenAI pilot: 12 products x 4 settings, with real cost measurement and a side-by-side sheet.

  export OPENAI_API_KEY=...
  python3 pilot.py            # shows the plan and a rough estimate, sends nothing
  python3 pilot.py --yes      # runs it (about 48 images)

Afterwards open qa/compare-pilot.jpg (rows = products, columns = settings) and qa/pilot-report.md (cost, time, projection).
Re-running skips images that already exist, so an interrupted pilot can simply be started again.
"""
import argparse, json, os, sys
from config import CONFIGS, PILOT_CONFIGS, ROOT
import engine as E
import build_jobs, qa


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--yes", action="store_true", help="confirm spending money")
    ap.add_argument("--configs", help="comma list, default: " + ",".join(PILOT_CONFIGS))
    ap.add_argument("--max-spend", type=float, default=10.0, help="stop when REAL spend passes this many USD (default 10)")
    ap.add_argument("--workers", type=int, default=3, help="parallel requests (the lowest OpenAI tier allows ~20 images/minute)")
    a = ap.parse_args()
    names = a.configs.split(",") if a.configs else PILOT_CONFIGS
    for n in names:
        if n not in CONFIGS: sys.exit(f"unknown config {n}; choose from {', '.join(CONFIGS)}")
    jobs = build_jobs.make_jobs(pilot=True)
    (ROOT / "jobs").mkdir(exist_ok=True)
    (ROOT / "jobs" / "pilot.jsonl").write_text("".join(json.dumps(j, ensure_ascii=False) + "\n" for j in jobs))
    todo = {n: [j for j in jobs if not (ROOT / "out" / n / f"{j['key']}.png").exists()] for n in names}
    total = sum(len(v) for v in todo.values())

    print(f"Pilot: {len(jobs)} products x {len(names)} settings = {total} images still to generate\n")
    for n in names:
        c = CONFIGS[n]
        print(f"  {n:<20} {c['model']:<26} quality={c.get('quality', c.get('image_size'))}  supplier photo: {'yes' if c['supplier_ref'] else 'no'}  ({len(todo[n])} to do)")
    print(f"\nBrand packaging photos found in brand-assets/: {sum(1 for j in jobs if j['brand_paths'])} of the {len(jobs)} pilot products "
          "(Flowers & Chocolate in Box uses Ferrero)")
    print(f"Rough estimate: about ${total * 0.07:.0f} (guess of $0.05-0.09 per image; the pilot measures the real figure). Spend limit: ${a.max_spend:.2f}.")
    if not a.yes:
        print("\nNothing was sent. Run again with --yes to start."); return
    if not os.environ.get("OPENAI_API_KEY"): sys.exit("\nSet your key first:  export OPENAI_API_KEY=...")

    print("\nDownloading the supplier guidance photos (once)...")
    E.prepare(jobs)
    spent, results = 0.0, []
    for n in names:
        if spent >= a.max_spend: print(f"Spend limit reached before {n}; skipping the rest."); break
        print(f"\n=== {n} ===")
        s = E.run_sync(n, todo[n], workers=a.workers, max_spend=a.max_spend - spent)
        spent += s["cost"]; results.append(s)
        if s["stopped"] == "smoke test failed":
            print(f"\nStopped: the first image failed, so nothing else was sent for {n}. Fix the error above and run again."); break

    if not any(r["done"] for r in results):
        for r in results:
            for k, e in r["failed"]: print(f"FAILED {r['config']} {k}: {e}")
        sys.exit("\nNo images were generated, so there is nothing to compare. See the error above.")

    print("\nChecking images and building the comparison sheet...")
    for n in names:
        if (ROOT / "out" / n).exists() and any((ROOT / "out" / n).glob("*.png")): qa.check(n, jobs)
    try: qa.compare(jobs)
    except SystemExit: pass

    lines = ["# Pilot report", "", "| Setting | Model | Quality | Supplier photo | Images | Failed | Avg cost | Avg time | Avg tokens in/out | Projected 278 products (+25% retakes), sync / batch |", "|---|---|---|---|---|---|---|---|---|---|"]
    for n in names:
        m = E.measured(n); c = CONFIGS[n]; s = next((x for x in results if x["config"] == n), {"failed": []})
        if m:
            g = 278 * 1.25
            lines.append(f"| {n} | {c['model']} | {c.get('quality', c.get('image_size'))} | {'yes' if c['supplier_ref'] else 'no'} | {m['n']} | {len(s['failed'])} | ${m['avg_cost']:.3f} | {m['avg_seconds']:.0f}s | {m['avg_in_tokens']:.0f} / {m['avg_out_tokens']:.0f} | ${g * m['avg_cost']:.0f} / ${g * m['avg_cost'] * 0.5:.0f} |")
        else:
            lines.append(f"| {n} | {c['model']} | {c.get('quality', c.get('image_size'))} | {'yes' if c['supplier_ref'] else 'no'} | 0 | {len(s['failed'])} | - | - | - | - |")
    lines += ["", f"Total pilot spend (real, from usage): **${spent:.2f}**", "",
              "Look at `qa/compare-pilot.jpg`. Judge: correct flowers/colours/counts, container, Maison tag spelling, brand packaging, no stray logos or watermarks, "
              "and whether the supplier photo (guidance) improves accuracy without being copied.",
              "Then tell me which setting to use for the other ~266 products."]
    (ROOT / "qa").mkdir(exist_ok=True); (ROOT / "qa" / "pilot-report.md").write_text("\n".join(lines) + "\n")
    print("\n" + "\n".join(lines))
    for s in results:
        for k, e in s["failed"]: print(f"FAILED {s['config']} {k}: {e}")


if __name__ == "__main__":
    main()
