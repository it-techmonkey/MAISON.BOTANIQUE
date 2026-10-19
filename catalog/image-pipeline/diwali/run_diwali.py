"""Maison x Bikanervala Diwali proposal images.
Generates with blank MAGENTA label panels (out/diwali-raw/), which place_logos.py then replaces with the real lockup files.
Usage: python3 -u diwali/run_diwali.py --jobs diwali/jobs/jobs-lead6.jsonl [--yes] [--max-spend 3]
"""
import argparse, json, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config  # loads API keys (never printed)
import providers as P
from engine import cost_of

ROOT = Path(__file__).resolve().parent.parent
CFG = dict(provider="openai", model="gpt-image-2.5-flare", quality="medium", size="1024x1024")
OUT = ROOT / "out" / "diwali-raw"

STYLE = (" Setting: a smooth warm off-white plaster wall (#F5F2EB) with soft morning window light from the left, on a pale limestone surface. "
         "The background is calm warm off-white: no plants, leaves or foliage behind the product, no green, pink or dark walls. "
         "Palette: ivory, warm paper (#EBE6DC) and soft gold; colour only from the flowers, the sweets and an ivory, blush or oxblood satin ribbon. "
         "Photorealistic premium editorial product photograph, shallow depth of field, square 1:1, product centred with breathing room. "
         "LABEL PLACEHOLDERS: every label described as magenta is a flat, matte, perfectly uniform pure magenta (#FF00FF) rectangle with crisp straight edges, "
         "no texture, no gradient, no border, no text, fully visible and not covered by ribbon or petals. Use magenta nowhere else in the image. "
         "No text, letters, logos, watermarks or brand marks anywhere else. No people.")
RECREATE = ("The attached photograph is our own earlier concept image: recreate it closely, keeping the same composition, camera angle, flowers, sweets "
            "and packaging, and change only what is listed here. ")
GUIDE = "The attached image(s) are our own catalogue photos, for guidance on the flowers, shape and packaging only; create a new photograph. "

def main():
    a = argparse.ArgumentParser(); a.add_argument("--jobs"); a.add_argument("--yes", action="store_true"); a.add_argument("--max-spend", type=float, default=3.0)
    a.add_argument("--only"); x = a.parse_args()
    jobs = [json.loads(l) for l in open(x.jobs) if l.strip()]
    if x.only: jobs = [j for j in jobs if j["key"] in x.only.split(",")]
    OUT.mkdir(parents=True, exist_ok=True)
    todo = [j for j in jobs if not (OUT / f"{j['key']}.png").exists()]
    print(f"{len(todo)} to generate (of {len(jobs)}), about ${0.035*len(todo):.2f} at ~$0.035 each")
    if not x.yes: return
    spent = 0.0
    for j in todo:
        refs = [str((ROOT / r).resolve()) if not r.startswith("/") else r for r in j.get("refs", [])]
        lead = (RECREATE if j.get("mode") == "recreate" else GUIDE) if refs else ""
        prompt = lead + j["prompt"] + STYLE
        t = time.time()
        try:
            png, usage = P.openai_generate(CFG, prompt, refs)
        except Exception as e:
            print(f"  FAILED {j['key']}: {e}"); continue
        c = cost_of(usage) or 0; spent += c
        (OUT / f"{j['key']}.png").write_bytes(png)
        (OUT / "usage.jsonl").open("a").write(json.dumps({"key": j["key"], "seconds": round(time.time()-t,1), "usage": usage, "cost": c}) + "\n")
        print(f"  ok {j['key']} {time.time()-t:.0f}s ${c:.3f} (total ${spent:.2f})", flush=True)
        if spent > x.max_spend: print("spend cap reached, stopping"); break
    print(f"done, spent ${spent:.2f}")

if __name__ == "__main__": main()
