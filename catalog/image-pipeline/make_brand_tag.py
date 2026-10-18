"""Create assets/maison-tag.png: the provisional MAISON BOTANIQUE gift-card tag.
Used as a reference image so every generated picture copies the same artwork.
Replace the output file with the approved logo artwork when it exists."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT = Path(__file__).resolve().parent
FONT = ROOT / "assets" / "Cormorant-Garamond-Regular.ttf"
W, H = 900, 600
img = Image.new("RGB", (W, H), (233, 226, 214))
d = ImageDraw.Draw(img)
d.rectangle((60, 60, W - 60, H - 60), fill=(246, 241, 232), outline=(120, 100, 80), width=3)
def tracked(text, font, y, fill, gap):
    w = sum(d.textlength(c, font=font) for c in text) + gap * (len(text) - 1)
    x = (W - w) / 2
    for c in text:
        d.text((x, y), c, font=font, fill=fill); x += d.textlength(c, font=font) + gap
tracked("MAISON", ImageFont.truetype(str(FONT), 64), 190, (40, 52, 44), 14)
tracked("BOTANIQUE", ImageFont.truetype(str(FONT), 92), 270, (30, 44, 36), 12)
(ROOT / "assets").mkdir(exist_ok=True)
img.save(ROOT / "assets" / "maison-tag.png")
print("wrote assets/maison-tag.png")
