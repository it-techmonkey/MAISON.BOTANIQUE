"""Core: compose the request for a product, call the provider, save the image, record the real cost."""
import io, json, threading, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import requests
from PIL import Image
import providers as P
from config import CONFIGS, BRAND_TAG, REFS_DIR, ROOT, TOKEN_PRICE, BATCH_FACTOR


def cost_of(usage, batch=False, cfg=None):
    """Real cost in USD from the API's usage block (None if the provider gave none)."""
    if not usage: return None
    price = {**TOKEN_PRICE, **((cfg or {}).get("token_price") or {})}
    d = usage.get("input_tokens_details") or {}
    img_in = d.get("image_tokens", 0)
    txt_in = d.get("text_tokens", max(usage.get("input_tokens", 0) - img_in, 0))
    c = (txt_in * price["text_in"] + img_in * price["image_in"] + usage.get("output_tokens", 0) * price["image_out"]) / 1e6
    return c * (BATCH_FACTOR if batch else 1)


def ensure_ref(job):
    """Download the one supplier photo (guidance only) and shrink it to <=1024px to keep input tokens low."""
    url = job.get("ref_url")
    if not url: return None
    REFS_DIR.mkdir(exist_ok=True)
    f = REFS_DIR / f"{job['key']}.png"
    if f.exists(): return str(f)
    try:
        r = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"}); r.raise_for_status()
        im = Image.open(io.BytesIO(r.content)).convert("RGB"); im.thumbnail((1024, 1024)); im.save(f)
        return str(f)
    except Exception as e:
        print(f"  note: could not fetch the supplier photo for {job['key']} ({e}); using text only")
        return None


def compose(job, cfg):
    """-> (prompt, [image paths]). Order: supplier photo, brand packaging photos, Maison tag (last)."""
    imgs, notes = [], []
    if cfg.get("supplier_ref") and job.get("ref_path"):
        imgs.append(job["ref_path"])
        notes.append("Image 1 is a photo of a similar product, for guidance only: copy its flower types, colours, proportions, fullness, shape, container and "
                     "gift items, but create a completely NEW photograph with a new composition, camera angle, background, lighting and Maison-style wrapping. "
                     "Never reproduce any logo, watermark, badge, printed ribbon, label, sticker, text, staff clothing, background or props from it.")
    for name, path in zip(job.get("brand_names", []), job.get("brand_paths", [])):
        imgs.append(path)
        notes.append(f"Image {len(imgs)} shows the genuine packaging of {name}: reproduce its logo, colours and lettering exactly, unaltered.")
    if cfg.get("brand_tag", True):
        imgs.append(str(BRAND_TAG))
        notes.append(f"Image {len(imgs)} (the last one) is the Maison Botanique gift tag: copy its lettering and layout exactly.")
    if not imgs:  # pure text (the Oct 16-17 method): the model draws the tag itself
        return job["prompt"] + " The gift tag is a small ivory card reading MAISON BOTANIQUE in an elegant serif, spelled exactly.", imgs
    return job["prompt"] + " REFERENCE IMAGES: " + " ".join(notes), imgs


def generate(cfg, job):
    prompt, imgs = compose(job, cfg)
    if cfg["provider"] == "openai": return P.openai_generate(cfg, prompt, imgs)
    return P.gemini_generate(cfg, prompt, imgs)


def prepare(jobs):
    """Download supplier photos once (cached)."""
    for j in jobs: j["ref_path"] = ensure_ref(j)
    return jobs


def run_sync(name, jobs, workers=3, max_spend=None, smoke=True, log=print):
    """Generate every job that has no file yet. Returns a summary dict. Stops if real spend passes max_spend."""
    cfg = CONFIGS[name]; out = ROOT / "out" / name; out.mkdir(parents=True, exist_ok=True)
    ledger = out / "usage.jsonl"; lock = threading.Lock()
    todo = [j for j in jobs if not (out / f"{j['key']}.png").exists()]
    st = {"config": name, "done": 0, "failed": [], "cost": 0.0, "seconds": [], "skipped": len(jobs) - len(todo), "stopped": None}

    def one(j):
        if st["stopped"]: return
        t = time.time()
        try:
            png, usage = generate(cfg, j)
        except Exception as e:
            with lock: st["failed"].append((j["key"], str(e)))
            log(f"  FAILED {j['key']}: {e}"); return
        sec = time.time() - t; c = cost_of(usage, cfg=cfg)
        if c is None and cfg.get("price"): c = cfg["price"]   # Gemini: published per-image price (input tokens are under $0.001)
        (out / f"{j['key']}.png").write_bytes(png)
        with lock:
            st["done"] += 1; st["seconds"].append(sec); st["cost"] += c or 0
            ledger.open("a").write(json.dumps({"key": j["key"], "seconds": round(sec, 1), "usage": usage, "cost": c}) + "\n")
            if max_spend is not None and st["cost"] > max_spend: st["stopped"] = f"spend limit ${max_spend:.2f} reached"
        log(f"  ok     {j['key']}  {sec:.0f}s  " + (f"${c:.3f}" if c is not None else "(no usage reported)"))

    if todo and smoke:                     # one image first: catches a wrong key / model name / request format cheaply
        one(todo[0]); todo = todo[1:]
        if st["failed"]: st["stopped"] = "smoke test failed"; return st
    with ThreadPoolExecutor(workers) as ex: list(ex.map(one, todo))
    return st


def measured(name):
    """Average real cost and time per image from out/<name>/usage.jsonl, or None."""
    f = ROOT / "out" / name / "usage.jsonl"
    if not f.exists(): return None
    rows = [json.loads(l) for l in f.open()]
    costs = [r["cost"] for r in rows if r.get("cost") is not None]
    if not costs: return None
    return {"n": len(costs), "avg_cost": sum(costs) / len(costs), "avg_seconds": sum(r["seconds"] for r in rows) / len(rows),
            "avg_out_tokens": sum((r["usage"] or {}).get("output_tokens", 0) for r in rows) / len(rows),
            "avg_in_tokens": sum((r["usage"] or {}).get("input_tokens", 0) for r in rows) / len(rows)}
