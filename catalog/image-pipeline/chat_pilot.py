#!/usr/bin/env python3
"""Option 3 of the pilot: the ChatGPT app (subscription), done by hand and timed.

  python3 chat_pilot.py --account a        # first ChatGPT account
  python3 chat_pilot.py --account b        # second account (optional)
  python3 chat_pilot.py --report           # time per image and projection for the full run

For each pilot product it copies the prompt to the clipboard. Paste it into a NEW ChatGPT chat (no image attached),
download the result to ~/Downloads, then press Enter here: the newest image in ~/Downloads is moved to
out/chat-<account>/<product>.png and the minutes from "prompt copied" to "Enter" are logged. Your time is the real
cost of this option, so the clock includes waiting, downloading and retries. Type 's' to skip, 'r' to log a refusal or
a "limit reached" message. Nothing here talks to ChatGPT; OpenAI's terms do not allow automating the ChatGPT app.
"""
import argparse, json, shutil, subprocess, sys, time
from pathlib import Path
import build_jobs, engine as E
from config import CONFIGS, ROOT

LOG = ROOT / "qa" / "chat-timing.jsonl"
DL = Path.home() / "Downloads"
TARGET = 295          # images still to generate for the full catalog
IMG = {".png", ".jpg", ".jpeg", ".webp"}


def newest_image(after):
    files = [f for f in DL.iterdir() if f.suffix.lower() in IMG and f.stat().st_mtime > after]
    return max(files, key=lambda f: f.stat().st_mtime) if files else None


def run(account, n):
    out = ROOT / "out" / f"chat-{account}"; out.mkdir(parents=True, exist_ok=True); LOG.parent.mkdir(exist_ok=True)
    jobs = build_jobs.make_jobs(pilot=True)[:n]
    for i, j in enumerate(jobs, 1):
        dest = out / f"{j['key']}.png"
        if dest.exists(): print(f"{i}. {j['title']}: already done"); continue
        prompt, _ = E.compose(j, CONFIGS["chatgpt-medium-text"])      # same text-only prompt as the API option
        subprocess.run("pbcopy", input=prompt.encode(), check=True)
        t0 = time.time()
        a = input(f"\n{i}/{len(jobs)} {j['title']}\n  Prompt copied. Paste into a new chat, download the image, then press Enter "
                  "(s = skip, r = refused / limit reached): ").strip().lower()
        mins = (time.time() - t0) / 60
        if a == "s": continue
        rec = {"account": account, "key": j["key"], "minutes": round(mins, 2), "ok": a != "r", "at": time.strftime("%Y-%m-%d %H:%M")}
        if a != "r":
            f = newest_image(t0)
            if not f: print("  No new image found in ~/Downloads; not logged. Run again to retry this one."); continue
            from PIL import Image
            Image.open(f).convert("RGB").save(dest); f.unlink()
            print(f"  saved {dest.relative_to(ROOT)} ({mins:.1f} min)")
        with open(LOG, "a") as fh: fh.write(json.dumps(rec) + "\n")
    report()


def report():
    if not LOG.exists(): sys.exit("No chat timings logged yet.")
    recs = [json.loads(l) for l in open(LOG) if l.strip()]
    ok = [r for r in recs if r["ok"]]
    if not ok: sys.exit("No successful chat images logged yet.")
    avg = sum(r["minutes"] for r in ok) / len(ok)
    hours = TARGET * 1.25 * avg / 60               # +25% retakes, same allowance as the API projection
    lines = ["", "## Option 3: ChatGPT app (by hand)", "",
             f"Images: {len(ok)} ok, {len(recs) - len(ok)} refused or limit reached. Average hands-on time: **{avg:.1f} min per image**.",
             f"Projected for {TARGET} images (+25% retakes): **{hours:.0f} hours of your time**, plus any waiting when the app's image limit "
             "is reached (OpenAI does not publish the Plus limit; check Settings > Usage). Cash cost: the existing subscription."]
    print("\n".join(lines))
    rep = ROOT / "qa" / "pilot-report.md"
    if rep.exists():
        body = rep.read_text().split("\n## Option 3")[0].rstrip("\n")
        rep.write_text(body + "\n" + "\n".join(lines) + "\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--account", help="a short label for the ChatGPT account, e.g. a or b")
    ap.add_argument("--products", type=int, default=5)
    ap.add_argument("--report", action="store_true")
    x = ap.parse_args()
    if x.report: report()
    elif x.account: run(x.account, x.products)
    else: ap.error("use --account a, or --report")
