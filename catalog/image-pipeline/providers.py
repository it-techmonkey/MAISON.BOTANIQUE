"""OpenAI (and Gemini) image calls. Only needs `requests`. Keys come from the environment and are never stored or printed.

OpenAI, per the official docs (checked 18 Oct 2026):
  - Image API: POST /v1/images/generations (JSON) and POST /v1/images/edits (multipart, repeated `image[]` fields,
    up to 16 images of PNG/WebP/JPG under 50 MB). Images come back base64 in data[0].b64_json.
  - Do NOT send `input_fidelity` (GPT Image 2.x always processes inputs at high fidelity).
  - `usage` = input_tokens, input_tokens_details{text_tokens,image_tokens}, output_tokens, total_tokens.
  - Batch API supports /v1/images/generations and /v1/images/edits (50% cheaper). How images are attached inside an edits
    batch is not documented, so batch with images is marked experimental below.
"""
import base64, json, os, time
from pathlib import Path
import requests

OPENAI = "https://api.openai.com/v1"
GEMINI = "https://generativelanguage.googleapis.com"


class ApiError(RuntimeError):
    pass


def _key(name):
    v = os.environ.get(name)
    if not v:
        raise SystemExit(f"Set {name} first, e.g.  export {name}=...   (the key is never saved or printed)")
    return v


def _explain(status, text):
    try:
        msg = json.loads(text).get("error", {}).get("message") or text
    except Exception:
        msg = text
    hint = {401: "The API key was rejected. Check OPENAI_API_KEY.",
            403: "Access denied. GPT Image models need a verified organization: platform.openai.com > Settings > Organization > Verify.",
            404: "Model not found for this key. Check the model name in config.py and your account's access.",
            429: "Rate limit or no credit left. Check billing/credits and your usage tier."}.get(status, "")
    return f"HTTP {status}: {str(msg)[:400]} {hint}".strip()


def _post(url, retries=5, **kw):
    for i in range(retries):
        try:
            r = requests.post(url, timeout=300, **kw)
        except requests.RequestException as e:
            if i == retries - 1: raise ApiError(f"network error: {e}")
            time.sleep(4 * 2 ** i); continue
        if r.status_code in (429, 500, 502, 503, 504) and i < retries - 1:
            wait = float(r.headers.get("retry-after", 0) or 0) or 5 * 2 ** i
            time.sleep(min(wait, 60)); continue
        if not r.ok: raise ApiError(_explain(r.status_code, r.text))
        return r
    raise ApiError("unreachable")


def _mime(path):
    return "image/png" if str(path).lower().endswith(".png") else "image/jpeg"


# ---------------------------------------------------------------- OpenAI
def openai_body(cfg, prompt):
    return {"model": cfg["model"], "prompt": prompt, "size": cfg["size"], "quality": cfg["quality"], "output_format": "png"}


def openai_generate(cfg, prompt, images):
    """One image. Returns (png_bytes, usage_dict). `images` = list of local file paths used as references."""
    h = {"Authorization": f"Bearer {_key('OPENAI_API_KEY')}"}
    if images:
        fhs = [open(i, "rb") for i in images]
        try:
            files = [("image[]", (Path(i).name, fh, _mime(i))) for i, fh in zip(images, fhs)]
            r = _post(f"{OPENAI}/images/edits", headers=h, data=openai_body(cfg, prompt), files=files)
        finally:
            for fh in fhs: fh.close()
    else:
        r = _post(f"{OPENAI}/images/generations", headers=h, json=openai_body(cfg, prompt))
    j = r.json()
    if not j.get("data"): raise ApiError("no image in response: " + r.text[:300])
    return base64.b64decode(j["data"][0]["b64_json"]), j.get("usage")


def openai_batch_submit(cfg, jobs, name):
    """jobs: list of {key, prompt, images}. Text-only jobs -> generations; with images -> edits (EXPERIMENTAL)."""
    def line(j):
        if not j["images"]:
            return {"custom_id": j["key"], "method": "POST", "url": "/v1/images/generations", "body": openai_body(cfg, j["prompt"])}
        body = openai_body(cfg, j["prompt"])
        body["images"] = [{"image_url": f"data:{_mime(i)};base64," + base64.b64encode(open(i, "rb").read()).decode()} for i in j["images"]]
        return {"custom_id": j["key"], "method": "POST", "url": "/v1/images/edits", "body": body}
    ls = [line(j) for j in jobs]
    urls = {l["url"] for l in ls}
    if len(urls) > 1: raise SystemExit("A batch can use only one endpoint: split jobs with and without reference images.")
    h = {"Authorization": f"Bearer {_key('OPENAI_API_KEY')}"}
    data = "\n".join(json.dumps(l) for l in ls).encode()
    f = _post(f"{OPENAI}/files", headers=h, data={"purpose": "batch"}, files={"file": (f"{name}.jsonl", data, "application/jsonl")}).json()
    b = _post(f"{OPENAI}/batches", headers=h, json={"input_file_id": f["id"], "endpoint": urls.pop(), "completion_window": "24h"}).json()
    return b["id"]


def openai_batch_collect(batch_id):
    """Returns (status, {key: (png, usage)}, {key: error_text})."""
    h = {"Authorization": f"Bearer {_key('OPENAI_API_KEY')}"}
    b = requests.get(f"{OPENAI}/batches/{batch_id}", headers=h, timeout=60).json()
    st = b.get("status")
    if st not in ("completed", "expired", "cancelled", "failed"): return st, {}, {}
    ok, bad = {}, {}
    for fid in (b.get("output_file_id"), b.get("error_file_id")):
        if not fid: continue
        for ln in requests.get(f"{OPENAI}/files/{fid}/content", headers=h, timeout=300).text.splitlines():
            r = json.loads(ln); body = (r.get("response") or {}).get("body") or {}
            if body.get("data"): ok[r["custom_id"]] = (base64.b64decode(body["data"][0]["b64_json"]), body.get("usage"))
            else: bad[r["custom_id"]] = json.dumps(r.get("error") or body.get("error") or r)[:300]
    return st, ok, bad


# ---------------------------------------------------------------- Gemini (kept for later comparison)
def _gemini_request(cfg, prompt, images):
    parts = [{"text": prompt}] + [{"inlineData": {"mimeType": _mime(i), "data": base64.b64encode(open(i, "rb").read()).decode()}} for i in images]
    return {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "1:1", "imageSize": cfg["image_size"]}}}


def _gemini_image(resp):
    for c in resp.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            d = p.get("inlineData") or p.get("inline_data")
            if d and d.get("data"): return base64.b64decode(d["data"])


def gemini_generate(cfg, prompt, images):
    r = _post(f"{GEMINI}/v1beta/models/{cfg['model']}:generateContent", headers={"x-goog-api-key": _key("GEMINI_API_KEY")},
              json=_gemini_request(cfg, prompt, images))
    img = _gemini_image(r.json())
    if img is None: raise ApiError("no image in response: " + r.text[:300])
    return img, None


def gemini_batch_submit(cfg, jobs, name):
    key = _key("GEMINI_API_KEY")
    data = "\n".join(json.dumps({"key": j["key"], "request": _gemini_request(cfg, j["prompt"], j["images"])}) for j in jobs).encode()
    s = _post(f"{GEMINI}/upload/v1beta/files", headers={
        "x-goog-api-key": key, "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": str(len(data)), "X-Goog-Upload-Header-Content-Type": "application/jsonl",
        "Content-Type": "application/json"}, json={"file": {"display_name": f"{name}.jsonl"}})
    f = _post(s.headers["x-goog-upload-url"], headers={"Content-Length": str(len(data)), "X-Goog-Upload-Offset": "0",
              "X-Goog-Upload-Command": "upload, finalize"}, data=data).json()
    b = _post(f"{GEMINI}/v1beta/models/{cfg['model']}:batchGenerateContent", headers={"x-goog-api-key": key},
              json={"batch": {"display_name": name, "input_config": {"file_name": f["file"]["name"]}}}).json()
    return b["name"]


def gemini_batch_collect(batch_name):
    key = _key("GEMINI_API_KEY")
    b = requests.get(f"{GEMINI}/v1beta/{batch_name}", headers={"x-goog-api-key": key}, timeout=60).json()
    st = (b.get("metadata") or {}).get("state") or b.get("state") or ""
    if st != "JOB_STATE_SUCCEEDED": return st, {}, {}
    out = b.get("response") or b.get("dest") or {}
    fn = out.get("responsesFile") or out.get("fileName"); lines = []
    if fn:
        txt = requests.get(f"{GEMINI}/download/v1beta/{fn}:download?alt=media", headers={"x-goog-api-key": key}, timeout=600).text
        lines = [json.loads(x) for x in txt.splitlines() if x.strip()]
    else:
        for r in (out.get("inlinedResponses", {}) or {}).get("inlinedResponses", out.get("inlinedResponses", [])):
            lines.append({"key": (r.get("metadata") or {}).get("key"), **r})
    ok, bad = {}, {}
    for r in lines:
        img = _gemini_image(r.get("response") or {})
        if img: ok[r.get("key")] = (img, None)
        else: bad[r.get("key")] = json.dumps(r.get("error") or r)[:300]
    return st, ok, bad
