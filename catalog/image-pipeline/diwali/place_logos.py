"""Replace the flat magenta label placeholders in out/diwali-raw/*.png with the real co-branded files.
Picks the asset by the label's shape: square -> box label, ~3:2 -> tag, wide -> horizontal lockup.
Warped to the label's corners, shaded with the placeholder's own light. Output: out/diwali-final/.
Usage: python3 diwali/place_logos.py [key ...]
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from scipy.spatial import ConvexHull

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "assets"
ASSETS = {"square": A / "collab-box-label.png", "tag": A / "collab-tag.png", "wide": A / "collab-lockup-horizontal.png"}
RATIOS = {"square": 1.0, "tag": 1.5, "wide": 2400 / 700}
SS = 3
GRADIENT_TAGS = {"rose-lily-gift"}
NATURAL_PURPLE = {"welcome-orchid", "colour-cashew", "festival-fan"}   # real purple or lilac petals: never neutralise globally

def pad_to(img, r):
    w, h = img.size; bg = img.getpixel((2, 2))
    if w / h < r: W, H = round(h * r), h
    else: W, H = w, round(w / r)
    c = Image.new("RGB", (W, H), bg); c.paste(img, ((W - w) // 2, (H - h) // 2)); return c  # supersampling for clean edges

def magenta(arr):
    r, g, b = [arr[..., i].astype(int) for i in range(3)]
    return (r - g > 70) & (b - g > 70) & (r > 110) & (b > 110) & (abs(r - b) < 90)

def corners(ys, xs):
    s, d = xs + ys, xs - ys
    pts = [(xs[s.argmin()], ys[s.argmin()]), (xs[d.argmax()], ys[d.argmax()]),
           (xs[s.argmax()], ys[s.argmax()]), (xs[d.argmin()], ys[d.argmin()])]  # TL, TR, BR, BL
    c = np.mean(pts, axis=0)
    return [tuple(c + (np.array(p) - c) * 1.0 + np.sign(np.array(p) - c) * 2.5) for p in pts]  # grow ~1px to cover fringe

def coeffs(dst, src):
    """PIL PERSPECTIVE coefficients mapping output (dst quad) -> input (src rect)."""
    m, v = [], []
    for (x, y), (u, w) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); v.append(u)
        m.append([0, 0, 0, x, y, 1, -w * x, -w * y]); v.append(w)
    return np.linalg.solve(np.array(m, float), np.array(v, float)).tolist()

def quad_area(q):
    x = np.array([p[0] for p in q]); y = np.array([p[1] for p in q])
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))

def pca_rect(ys, xs):
    pts = np.stack([xs, ys], 1).astype(float); c = pts.mean(0)
    _, _, vt = np.linalg.svd(pts - c, full_matrices=False); u, v = vt[0], vt[1]
    if u[0] < 0: u = -u
    if v[1] < 0: v = -v
    a, b = (pts - c) @ u, (pts - c) @ v
    a0, a1, b0, b1 = a.min() - 1.5, a.max() + 1.5, b.min() - 1.5, b.max() + 1.5
    q = [c + a0 * u + b0 * v, c + a1 * u + b0 * v, c + a1 * u + b1 * v, c + a0 * u + b1 * v]
    return upright(q)

def upright(q):
    """Order 4 corners TL, TR, BR, BL so the logo reads upright: cyclic order around the centre,
    starting on the more horizontal pair of edges, with the top edge first."""
    c = np.mean(q, axis=0)
    q = sorted(q, key=lambda p: np.arctan2(p[1] - c[1], p[0] - c[0]))   # clockwise in image coordinates
    best = None
    for s0 in range(4):
        r = q[s0:] + q[:s0]
        top, bot = (r[0], r[1]), (r[3], r[2])
        horiz = abs(r[1][0] - r[0][0]) - abs(r[1][1] - r[0][1])
        if r[1][0] <= r[0][0]: continue                    # TL must be left of TR
        if (top[0][1] + top[1][1]) > (bot[0][1] + bot[1][1]): continue   # top edge above bottom edge
        if best is None or horiz > best[0]: best = (horiz, r)
    r = best[1] if best else q
    return [tuple(map(float, p)) for p in r]

def max_quad(hv):
    """Largest-area quadrilateral on the hull vertices = the label's four corners, even under perspective."""
    hv = [tuple(map(float, v)) for v in hv]
    if len(hv) > 40: hv = hv[::len(hv) // 40 + 1]
    best, bq = -1, None; n = len(hv)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                for l in range(k + 1, n):
                    q = [hv[i], hv[j], hv[k], hv[l]]; ar = quad_area(q)
                    if ar > best: best, bq = ar, q
    c = np.mean(bq, axis=0)
    bq = [tuple(c + (np.array(p) - c) + np.sign(np.array(p) - c) * 1.5) for p in bq]
    return upright(bq)

def side(p, q): return float(np.hypot(p[0] - q[0], p[1] - q[1]))

def place(key, src_dir, out_dir):
    im = Image.open(src_dir / f"{key}.png").convert("RGB"); arr = np.array(im)
    mask = magenta(arr)
    if key in GRADIENT_TAGS:   # the model shaded this placeholder from hot pink to magenta
        r_, g_, b_ = [arr[..., i].astype(int) for i in range(3)]
        mask |= (g_ < 50) & (r_ > 180) & (b_ > 90)
    core, n = ndimage.label(ndimage.binary_opening(mask, iterations=2))   # opening cuts thin bridges between touching labels
    dist, (iy, ix) = ndimage.distance_transform_edt(core == 0, return_indices=True)
    lab = np.where(mask & (dist <= 4), core[iy, ix], 0)
    out = im.copy(); W, H = im.size; report = []; accepted = np.zeros(mask.shape, bool)
    bright = np.maximum(arr[..., 0], arr[..., 2]).astype(float) / 255.0
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(xs) < 120: continue
        pts = np.stack([xs, ys], 1); hull = ConvexHull(pts); fill = len(xs) / max(hull.volume, 1)
        inner = ndimage.binary_erosion(lab == i, iterations=2)
        gmed = np.median(arr[..., 1][inner]) if inner.any() else 255
        pure = gmed < 20 and (fill >= 0.85 or (len(xs) >= 2500 and fill >= 0.3))
        lit = fill >= 0.9 and len(xs) >= 1500          # brightly lit label: green channel lifts, shape stays clean
        if not (pure or lit):
            continue   # small irregular blobs are purple or pink petals, not placeholders
        accepted[lab == i] = True
        q = max_quad(pts[hull.vertices])
        w = (side(q[0], q[1]) + side(q[3], q[2])) / 2; h = (side(q[0], q[3]) + side(q[1], q[2])) / 2
        r = w / max(h, 1)
        if fill >= 0.85 and (min(w, h) < 20 or not 0.22 < w / max(h, 1) < 4.5):   # a label seen edge-on: paint it plain ivory, no logo
            o = np.array(out); comp = ndimage.binary_dilation(lab == i, iterations=2)
            o[comp] = (np.array([238, 232, 220]) * np.clip(bright[comp] / np.percentile(bright[lab == i], 90), .7, 1.03)[:, None]).astype(np.uint8)
            out = Image.fromarray(o); report.append("edge-on"); continue
        kind = min(RATIOS, key=lambda k: abs(np.log(r / RATIOS[k])))
        asset = pad_to(Image.open(ASSETS[kind]).convert("RGB"), r)   # never stretch a logo: pad to the label's shape
        # shading from the placeholder's own brightness, smoothed
        comp = (lab == i)
        b = bright.copy(); ref = np.percentile(b[comp], 90)
        shade = np.clip(b / max(ref, 1e-3), 0.55, 1.05); shade[~comp] = np.median(shade[comp])
        shade = ndimage.gaussian_filter(shade, 2)
        # warp at supersampled size
        big = (W * SS, H * SS); qb = [(x * SS, y * SS) for x, y in q]
        aw, ah = asset.size; src = [(0, 0), (aw, 0), (aw, ah), (0, ah)]
        try: cf = coeffs(qb, src)
        except np.linalg.LinAlgError:
            q = pca_rect(ys, xs); qb = [(x * SS, y * SS) for x, y in q]; cf = coeffs(qb, src)
        warped = asset.transform(big, Image.PERSPECTIVE, cf, Image.BICUBIC).resize((W, H), Image.LANCZOS)
        alpha = Image.new("L", asset.size, 255).transform(big, Image.PERSPECTIVE, cf, Image.BICUBIC).resize((W, H), Image.LANCZOS)
        wa = np.array(warped).astype(float) * shade[..., None]
        vis = ndimage.gaussian_filter(ndimage.binary_dilation(lab == i, iterations=2).astype(float), 0.8)
        al = (np.array(alpha).astype(float) / 255.0 * np.clip(vis * 1.4, 0, 1))[..., None]
        o = np.array(out).astype(float)
        out = Image.fromarray(np.clip(o * (1 - al) + wa * al, 0, 255).astype(np.uint8))
        report.append(f"{kind} {w:.0f}x{h:.0f}")
    # magenta cast left at the label edges: neutralise the hue in a thin ring (keeps texture, removes the pink-purple fringe)
    if key in NATURAL_PURPLE:   # purple petals are in `mask` too: only touch what surrounds accepted labels
        ring = ndimage.binary_dilation(accepted, iterations=5); near = ring
    else:
        near = ndimage.binary_dilation(mask, iterations=15)   # spill only ever sits close to a placeholder
        ring = near
    o = np.array(out).astype(int); r, g, b = o[..., 0], o[..., 1], o[..., 2]
    cast = ring & (r - g > 18) & (b - g > 18) & (abs(r - b) < 45)
    o[..., 1] = np.where(cast, (r + b) // 2 - 4, g); o[..., 2] = np.where(cast, np.minimum(b, g + (r - g) // 3 + 6), b)
    o[..., 2] = np.where(cast, np.minimum(o[..., 2], r - 6), o[..., 2])
    out = Image.fromarray(np.clip(o, 0, 255).astype(np.uint8))
    # last pass: stray specks of pure placeholder magenta (petals are never this pure) blend into their surroundings
    o = np.array(out).astype(int); r, g, b = o[..., 0], o[..., 1], o[..., 2]
    speck = ndimage.binary_dilation((r > 190) & (b > 190) & (g < 90) & (abs(r - b) < 40), iterations=2) & (r - g > 40) & (b - g > 40)
    if speck.any():
        med = np.array(Image.fromarray(o.astype(np.uint8)).filter(ImageFilter.MedianFilter(9))).astype(int)
        o[speck] = med[speck]; mg = speck & (o[..., 0] - o[..., 1] > 40) & (o[..., 2] - o[..., 1] > 40)
        o[..., 1] = np.where(mg, (o[..., 0] + o[..., 2]) // 2 - 6, o[..., 1]); o[..., 2] = np.where(mg, np.minimum(o[..., 2], o[..., 0] - 8), o[..., 2])
        out = Image.fromarray(np.clip(o, 0, 255).astype(np.uint8))
    if key not in NATURAL_PURPLE:   # strong magenta slivers (lid edges seen side-on) become warm ivory card edges
        o = np.array(out).astype(int); r, g, b = o[..., 0], o[..., 1], o[..., 2]
        sl = ndimage.binary_dilation((b - g > 60) & (r - g > 60) & (abs(r - b) < 90), iterations=1) & (r - g > 25) & (b - g > 15) & near
        lum = np.clip((r + b) // 2 + 10, 0, 245)
        o[sl] = np.stack([lum, (lum * 0.9).astype(int), (lum * 0.8).astype(int)], -1)[sl]
        out = Image.fromarray(np.clip(o, 0, 255).astype(np.uint8))
    out_dir.mkdir(parents=True, exist_ok=True); out.save(out_dir / f"{key}.png")
    print(f"{key}: {len(report)} labels -> {', '.join(report)}; leftover magenta px {int((magenta(np.array(out)) & ndimage.binary_dilation(accepted, iterations=3)).sum())}")

if __name__ == "__main__":
    src, dst = ROOT / "out" / "diwali-raw", ROOT / "out" / "diwali-final"
    keys = sys.argv[1:] or [p.stem for p in sorted(src.glob("*.png"))]
    for k in keys: place(k, src, dst)
