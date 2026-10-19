#!/usr/bin/env python3
"""Before-and-after page for the pilot: supplier photo (before) next to every generated version (after), with costs.

  python3 report.py      -> qa/pilot-before-after.html
  python3 report.py --jobs jobs/all-missing.jsonl --configs flare-medium --out review-batch-01.html --title "Batch 1"
                         -> a review page for every product in the jobs file that already has an image

Costs come from out/<setting>/usage.jsonl: real token usage for OpenAI, the published per-image price for Gemini.
"""
import argparse, base64, html, io, json
from PIL import Image
from config import CONFIGS, ROOT

TARGET = 295   # images still to generate for the full catalog


def embed(path, size=560):
    """Self-contained page: the image as an inline JPEG (the link still opens the full-size file)."""
    im = Image.open(path).convert("RGB"); im.thumbnail((size, size)); b = io.BytesIO(); im.save(b, "JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def rows(name):
    f = ROOT / "out" / name / "usage.jsonl"
    return {r["key"]: r for r in map(json.loads, f.open())} if f.exists() else {}


def main(jobs_file="jobs/pilot.jsonl", configs=None, out_name="pilot-before-after.html", title="Pilot: before and after"):
    jobs = [json.loads(l) for l in open(ROOT / jobs_file) if l.strip()]
    if configs:   # review mode: only the given settings, only products that already have an image
        names = configs
        jobs = [j for j in jobs if any((ROOT / "out" / n / f"{j['key']}.png").exists() for n in names)]
    else:
        names = [n for n in CONFIGS if any((ROOT / "out" / n / f"{j['key']}.png").exists() for j in jobs)]
        names += sorted(p.name for p in (ROOT / "out").glob("chat-*") if any(p.glob("*.png")))
    usage = {n: rows(n) for n in names}

    def label(n):
        if n.startswith("chat-"): return f"ChatGPT app ({n[5:]})", "your subscription"
        c = CONFIGS[n]; who = "OpenAI" if c["provider"] == "openai" else "Gemini"
        return f"{who} · {c['model']}", "supplier photo as guidance" if c.get("supplier_ref") else "text only"

    summary, grand = [], 0.0
    for n in names:
        u = [usage[n][j["key"]] for j in jobs if j["key"] in usage[n]]
        costs = [r["cost"] for r in u if r.get("cost") is not None]
        total = sum(costs); grand += total
        avg = total / len(costs) if costs else None
        secs = [r["seconds"] for r in u if r.get("seconds")]
        batch = (CONFIGS[n].get("batch_price") or (avg / 2 if avg else None)) if n in CONFIGS else None
        summary.append((n, len(u), total, avg, sum(secs) / len(secs) if secs else None, batch * TARGET if batch else None))

    def money(x, d=3): return "–" if x is None else f"${x:.{d}f}"
    h = [f'<!doctype html><meta charset="utf-8"><title>{html.escape(title)}</title><style>',
         'body{font:14px/1.4 -apple-system,system-ui,sans-serif;margin:24px;color:#222;background:#faf8f5}',
         'table{border-collapse:collapse;margin:12px 0 28px}td,th{border:1px solid #ddd;padding:6px 10px;text-align:left;vertical-align:top;background:#fff}',
         '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:36px}',
         '.cell img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;background:#eee;cursor:zoom-in}.cell small{color:#666}',
         'h2{margin-top:36px;border-top:1px solid #ddd;padding-top:20px}.before{outline:3px solid #c9a227;border-radius:6px}</style>',
         f'<h1>{html.escape(title)}</h1>',
         '<p><b>Before</b> = the supplier listing photo we selected (gold outline; internal reference only, never published). '
         '<b>After</b> = each generated version. Click an image to open it full size.</p>',
         '<h3>Cost per run</h3><table><tr><th>Setting</th><th>Input</th><th>Images</th><th>Cost</th><th>Avg per image</th>'
         f'<th>Avg time</th><th>Projected {TARGET} images (Batch)</th></tr>']
    for n, k, total, avg, sec, proj in summary:
        name, mode = label(n)
        h.append(f"<tr><td>{html.escape(name)}</td><td>{mode}</td><td>{k}</td><td>{money(total)}</td><td>{money(avg)}</td>"
                 f"<td>{'–' if sec is None else f'{sec:.0f}s'}</td><td>{money(proj, 2)}</td></tr>")
    h.append(f"<tr><th colspan=3>Total spend</th><th>{money(grand)}</th><td colspan=3></td></tr></table>")

    for j in jobs:
        tick = (f'<label class=ok><input type=checkbox data-key="{j["key"]}" data-title="{html.escape(j["title"])}"> Approved</label>'
                f'<input class=note data-key="{j["key"]}" placeholder="What to fix (if not approved)">') if configs else ""
        h.append(f"<h2>{j['catalog_number']}. {html.escape(j['title'])}</h2>{tick}<p><small>{html.escape(j['prompt'].split('Contents, as listed: ')[-1].split('. ')[0])}</small></p><div class=grid>")
        ref = ROOT / "refs" / f"{j['key']}.png"
        if ref.exists(): h.append(f'<div class=cell><a href="../refs/{ref.name}"><img class=before src="{embed(ref)}"></a><b>Before</b><br><small>supplier photo</small></div>')
        for n in names:
            f = ROOT / "out" / n / f"{j['key']}.png"
            if not f.exists(): continue
            r = usage[n].get(j["key"], {}); name, mode = label(n)
            extra = f"{money(r.get('cost'))} · {r['seconds']:.0f}s" if r.get("seconds") else money(r.get("cost"))
            h.append(f'<div class=cell><a href="../out/{n}/{f.name}"><img src="{embed(f)}"></a><b>{html.escape(name)}</b><br><small>{mode} · {extra}</small></div>')
        h.append("</div>")
    if configs:
        h.insert(1, '.ok{display:inline-block;margin:0 12px 8px 0;font-weight:600}.note{width:min(520px,90%);padding:4px 8px}'
                    '#bar{position:sticky;top:0;background:#faf8f5;padding:8px 0;border-bottom:1px solid #ddd;z-index:1}</style><style>')
        h.insert(h.index(f'<h1>{html.escape(title)}</h1>') + 1,
                 '<div id=bar><button id=all>Approve all</button> <button id=dl>Download my decisions (CSV)</button> <span id=count></span></div>')
        h.append(r"""<script>
const K='review:'+document.title, st=(()=>{try{return JSON.parse(localStorage.getItem(K))||{}}catch(e){return {}}})();
const save=()=>{try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}; const b=document.querySelectorAll('input[type=checkbox]');
  document.getElementById('count').textContent=[...b].filter(x=>x.checked).length+' of '+b.length+' approved'};
document.querySelectorAll('input[type=checkbox]').forEach(b=>{const s=st[b.dataset.key]||{};b.checked=!!s.ok;b.onchange=()=>{(st[b.dataset.key]=st[b.dataset.key]||{}).ok=b.checked;save()}});
document.querySelectorAll('.note').forEach(n=>{n.value=(st[n.dataset.key]||{}).note||'';n.oninput=()=>{(st[n.dataset.key]=st[n.dataset.key]||{}).note=n.value;save()}});
document.getElementById('all').onclick=()=>{document.querySelectorAll('input[type=checkbox]').forEach(b=>{b.checked=true;(st[b.dataset.key]=st[b.dataset.key]||{}).ok=true});save()};
document.getElementById('dl').onclick=()=>{const rows=[['key','title','approved','note']];document.querySelectorAll('input[type=checkbox]').forEach(b=>{const s=st[b.dataset.key]||{};
  rows.push([b.dataset.key,b.dataset.title,b.checked?'yes':'no',(s.note||'')])});const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=document.title.replace(/\W+/g,'-')+'-decisions.csv';a.click()};
save();</script>""")
    out = ROOT / "qa" / out_name; out.parent.mkdir(exist_ok=True); out.write_text("\n".join(h))
    print("wrote", out, f"({len(jobs)} products, total spend ${grand:.3f})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", default="jobs/pilot.jsonl"); ap.add_argument("--configs", help="comma list; enables review mode")
    ap.add_argument("--out", default="pilot-before-after.html"); ap.add_argument("--title", default="Pilot: before and after")
    a = ap.parse_args()
    main(a.jobs, a.configs.split(",") if a.configs else None, a.out, a.title)
