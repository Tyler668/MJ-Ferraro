"""Convert the raw Google Drive dump (HEIC + JPEG, many without extensions)
into web-ready JPEGs: images/full (<=2000px) and images/thumb (<=720px).
Writes tools/manifest.json with source name, slug, size and average colour."""
import json, re, sys, unicodedata
from pathlib import Path
from PIL import Image, ImageOps
import pillow_heif
pillow_heif.register_heif_opener()

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_source" / "Peg_s Paintings"
FULL = ROOT / "images" / "full"; THUMB = ROOT / "images" / "thumb"
FULL.mkdir(parents=True, exist_ok=True); THUMB.mkdir(parents=True, exist_ok=True)

def slugify(name):
    name = re.sub(r"\.jpe?g$", "", name, flags=re.I)
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    name = name.replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

# Exact duplicate of "Dauphin Island Sunset" 24x36 in the Drive dump.
SKIP = {"dauphin-island-sunset-acrylic-on-24x36-canvas"}
# Trim photo edges that aren't part of the painting: (left, top, right, bottom) fractions.
CROPS = {"walking-on-top-of-the-world-16x20-acrylic-on-canvas": (0, 0, 1, 0.915)}

out = []; seen = set()
for f in sorted(SRC.iterdir()):
    slug = slugify(f.name)
    base, n = slug, 2
    while slug in seen: slug = f"{base}-{n}"; n += 1
    seen.add(slug)
    if slug in SKIP: continue
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    if slug in CROPS:
        l, t, r, b = CROPS[slug]; W, H = im.size
        im = im.crop((int(l * W), int(t * H), int(r * W), int(b * H)))
    w, h = im.size
    for folder, cap, q in ((FULL, 2000, 86), (THUMB, 720, 80)):
        c = im.copy(); c.thumbnail((cap, cap), Image.LANCZOS)
        c.save(folder / f"{slug}.jpg", "JPEG", quality=q, optimize=True, progressive=True)
    avg = im.resize((1, 1), Image.BOX).getpixel((0, 0))
    t = im.copy(); t.thumbnail((720, 720))
    out.append({"source": f.name, "slug": slug, "w": t.width, "h": t.height,
                "origW": w, "origH": h, "color": "#%02x%02x%02x" % avg})
    print(slug, w, h)
import palette  # noqa: E402  (writes js/image-meta.js)
palette.build()
(ROOT / "tools" / "manifest.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
