#!/usr/bin/env python3
"""Run a full set of jobs with ONE chosen setting (use after the pilot).

  python3 run.py --jobs jobs/all-missing.jsonl --config flare-medium --mode sync            # shows estimate, sends nothing
  python3 run.py --jobs jobs/all-missing.jsonl --config flare-medium --mode sync --yes      # generate now
  python3 run.py --jobs jobs/all-missing.jsonl --config flare-medium --mode batch-submit --yes   # half price, up to 24h
  python3 run.py --jobs jobs/all-missing.jsonl --config flare-medium --mode batch-collect        # fetch results when ready

Safe to re-run: products that already have an image are skipped. Delete a file in out/<config>/ to redo that product.
"""
import argparse, json, sys
from config import CONFIGS, ROOT
import engine as E
import providers as P


def load(path):
    return [json.loads(l) for l in open(path) if l.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", required=True); ap.add_argument("--config", required=True, choices=CONFIGS)
    ap.add_argument("--mode", required=True, choices=["sync", "batch-submit", "batch-collect"])
    ap.add_argument("--limit", type=int, help="only the first N products (handy for a test)")
    ap.add_argument("--workers", type=int, default=3); ap.add_argument("--max-spend", type=float, help="stop when real spend passes this many USD")
    ap.add_argument("--yes", action="store_true", help="confirm spending money")
    a = ap.parse_args()
    cfg = CONFIGS[a.config]; out = ROOT / "out" / a.config; out.mkdir(parents=True, exist_ok=True)
    state = out / "batch.json"; batch = a.mode.startswith("batch")

    if a.mode == "batch-collect":
        st = json.load(open(state)) if state.exists() else {}
        if not st.get("batch_id"): sys.exit("No batch submitted for this config.")
        fn = P.openai_batch_collect if cfg["provider"] == "openai" else P.gemini_batch_collect
        status, ok, bad = fn(st["batch_id"]); print("batch status:", status)
        total = 0.0
        for k, (png, usage) in ok.items():
            (out / f"{k}.png").write_bytes(png); c = E.cost_of(usage, batch=True, cfg=cfg)
            if c is None and cfg.get("batch_price"): c = cfg["batch_price"]
            total += c or 0
            (out / "usage.jsonl").open("a").write(json.dumps({"key": k, "seconds": 0, "usage": usage, "cost": c}) + "\n")
        for k, e in bad.items(): print("FAILED", k, e)
        print(f"saved {len(ok)} images, {len(bad)} failed, real batch cost ${total:.2f} -> {out}"); return

    jobs = load(a.jobs)
    todo = [j for j in jobs if not (out / f"{j['key']}.png").exists()][: a.limit]
    m = E.measured(a.config)
    per = m["avg_cost"] * (0.5 if batch else 1) if m else None
    print(f"{len(todo)} images to generate with {a.config} ({cfg['model']}), {'batch' if batch else 'sync'}.")
    print("estimated cost: " + (f"${per * len(todo):.2f} (from {m['n']} measured images, ${per:.3f} each)" if per else
          "unknown until the pilot measures it (OpenAI does not publish per-image tokens for the 2.5 models)"))
    if not todo: return
    if not a.yes: sys.exit("Add --yes to spend this amount.")
    E.prepare(todo)

    if a.mode == "batch-submit":
        if cfg["provider"] == "openai": print("NOTE: OpenAI batch with reference images is experimental (the image format inside a batch is not documented). Test with --limit 2 first.")
        todo_c = []
        for j in todo:
            prompt, imgs = E.compose(j, cfg); todo_c.append({"key": j["key"], "prompt": prompt, "images": imgs})
        name = f"{a.config}-{ROOT.name}"
        bid = P.openai_batch_submit(cfg, todo_c, name) if cfg["provider"] == "openai" else P.gemini_batch_submit(cfg, todo_c, name)
        json.dump({"batch_id": bid, "keys": [j["key"] for j in todo]}, open(state, "w"))
        print("submitted batch", bid, "(up to 24h). Run --mode batch-collect later."); return

    s = E.run_sync(a.config, todo, workers=a.workers, max_spend=a.max_spend)
    print(f"\nfinished: {s['done']} images, {len(s['failed'])} failed, real cost ${s['cost']:.2f}" + (f"  STOPPED: {s['stopped']}" if s["stopped"] else ""))


if __name__ == "__main__":
    main()
