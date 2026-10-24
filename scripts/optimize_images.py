"""Generate web-sized WebP derivatives of the source PNGs in assets/.

The source PNGs are kept untouched; derivatives go to an optimized/ folder next
to each source, named <slug>-<width>.webp (e.g. "Tote Bag.png" -> tote-bag-400.webp).
Run from anywhere:  python3 scripts/optimize_images.py   (requires Pillow)
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

# Source file (relative to assets/) -> output widths in px. Add new assets here.
JOBS = {
    "home/hero.png": (960, 1600, 2560, 3200),
    "home/showcase.png": (1920, 2560),
    "home/faq.png": (1280, 1920, 2560),
    "Hero/event.png": (960, 1600, 2048),
    "merch/Cap.png": (400, 800),
    "merch/Tumbler.png": (400, 800),
    "merch/Tote Bag.png": (400, 800),
    "merch/Travel Bag.png": (400, 800),
    "merch/synchronize.png": (800, 1600),
    "ava.png": (800, 1130),  # dummy profile photo (/profil/)
    # Article covers (Unsplash, 3:2 crops). Credits in js/article-data.js.
    "articles/traffic-rain-windshield.jpg": (800, 1600),
    "articles/friends-cafe-golden-hour.jpg": (800, 1600),
    "articles/canvas-duffel-bag.jpg": (800, 1600),
    "articles/open-magazine-armchair.jpg": (800, 1600),
    "articles/caps-wooden-shelf.jpg": (800, 1600),
    "articles/coffee-steel-tumblers.jpg": (800, 1600),
}
QUALITY = 80

# Square crops (source → output stem, (left, top, right, bottom) in source px, size px).
CROPS = {
    "ava.png": [("ava-avatar", (330, 110, 770, 550), 256)],  # Passport holder avatar
}

LOGO = ASSETS / "home" / "logo.png"
FAVICON_OUT = ASSETS / "home" / "favicon"
# Output file -> (size px, background). iOS fills transparency with black, so the
# touch icon gets the page's ink colour explicitly.
FAVICONS = {
    "favicon-32.png": (32, None),
    "favicon-192.png": (192, None),
    "apple-touch-icon.png": (180, (11, 10, 9, 255)),
}


def logogram(logo):
    """Crop the gold logogram: the artwork left of the first transparent column gap."""
    alpha = logo.getchannel("A").point(lambda v: 255 if v >= 8 else 0)
    left, top, right, bottom = alpha.getbbox()
    x = left
    while x < right and alpha.crop((x, 0, x + 1, logo.height)).getbbox():
        x += 1
    mark = logo.crop((left, top, x, bottom))
    return mark.crop(mark.getchannel("A").point(lambda v: 255 if v >= 8 else 0).getbbox())


def make_favicons():
    FAVICON_OUT.mkdir(exist_ok=True)
    with Image.open(LOGO) as logo:
        mark = logogram(logo.convert("RGBA"))
    for name, (size, background) in FAVICONS.items():
        inner = round(size * 0.92)
        scale = inner / max(mark.size)
        resized = mark.resize((round(mark.width * scale), round(mark.height * scale)), Image.LANCZOS)
        icon = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
        icon.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
        dest = FAVICON_OUT / name
        icon.save(dest, "PNG", optimize=True)
        print(f"{dest.relative_to(ROOT)}  {size}x{size}")


def main():
    for name, widths in JOBS.items():
        src = ASSETS / name
        out = src.parent / "optimized"
        out.mkdir(exist_ok=True)
        slug = src.stem.lower().replace(" ", "-")
        with Image.open(src) as im:
            im = im.convert("RGB")
            for width in widths:
                height = round(im.height * width / im.width)
                dest = out / f"{slug}-{width}.webp"
                im.resize((width, height), Image.LANCZOS).save(dest, "WEBP", quality=QUALITY, method=6)
                print(f"{dest.relative_to(ROOT)}  {width}x{height}  {dest.stat().st_size // 1024} KB")
    for name, crops in CROPS.items():
        src = ASSETS / name
        with Image.open(src) as im:
            im = im.convert("RGB")
            for stem, box, size in crops:
                dest = src.parent / "optimized" / f"{stem}-{size}.webp"
                im.crop(box).resize((size, size), Image.LANCZOS).save(dest, "WEBP", quality=QUALITY, method=6)
                print(f"{dest.relative_to(ROOT)}  {size}x{size}")
    make_favicons()


if __name__ == "__main__":
    main()
