from __future__ import annotations

import shutil
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source-previews"
ASSETS = ROOT / "assets"
PUBLIC = ROOT / "public" / "assets"


ITEM_FILES = [
    "bill-500.png",
    "bill-1000.png",
    "bill-5000.png",
    "contract.png",
    "mirror.png",
    "hallway.png",
    "kitchen.png",
    "tax.png",
    "fine.png",
    "wheel.png",
    "engine.png",
    "car-body.png",
    "fuel-can-20l.png",
]

CHARACTER_FILES = {
    "heroine-concept.png": "heroine.png",
    "car-mode-concept.png": "heroine-car.png",
}


def estimate_background(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    size = max(12, min(h, w) // 40)
    samples = np.concatenate(
        [
            rgb[:size, :size].reshape(-1, 3),
            rgb[:size, -size:].reshape(-1, 3),
            rgb[-size:, :size].reshape(-1, 3),
            rgb[-size:, -size:].reshape(-1, 3),
        ],
        axis=0,
    )
    return np.median(samples, axis=0)


def flood_background(candidate: np.ndarray) -> np.ndarray:
    h, w = candidate.shape
    visited = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(w):
        if candidate[0, x]:
            visited[0, x] = True
            queue.append((0, x))
        if candidate[h - 1, x]:
            visited[h - 1, x] = True
            queue.append((h - 1, x))

    for y in range(h):
        if candidate[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            queue.append((y, 0))
        if candidate[y, w - 1] and not visited[y, w - 1]:
            visited[y, w - 1] = True
            queue.append((y, w - 1))

    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))

    return visited


def dilate(mask: np.ndarray, pixels: int) -> np.ndarray:
    image = Image.fromarray((mask.astype(np.uint8) * 255), "L")
    for _ in range(pixels):
        image = image.filter(ImageFilter.MaxFilter(3))
    return np.array(image) > 0


def crop_to_alpha(image: Image.Image, pad: int) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    return image.crop((left, top, right, bottom))


def fit_max(image: Image.Image, max_dimension: int) -> Image.Image:
    longest = max(image.size)
    if longest <= max_dimension:
        return image
    scale = max_dimension / longest
    size = (round(image.width * scale), round(image.height * scale))
    return image.resize(size, Image.Resampling.LANCZOS)


def prepare_cutout(src: Path, dst: Path, *, tolerance: float, preserve_px: int, pad: int, max_dimension: int) -> None:
    src_image = Image.open(src).convert("RGB")
    rgb = np.asarray(src_image).astype(np.float32)
    bg = estimate_background(rgb)
    dist = np.linalg.norm(rgb - bg, axis=2)
    candidate = dist <= tolerance
    bg_connected = flood_background(candidate)

    core_opaque = ~bg_connected
    opaque = dilate(core_opaque, preserve_px)

    rgba = np.dstack([np.asarray(src_image), (opaque.astype(np.uint8) * 255)])
    out = Image.fromarray(rgba, "RGBA")
    out = crop_to_alpha(out, pad=pad)
    out = fit_max(out, max_dimension=max_dimension)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst)


def copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def create_contact_sheet(files: list[Path], dst: Path) -> None:
    thumb = 180
    label_h = 28
    cols = 5
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * thumb, rows * (thumb + label_h)), (255, 255, 255, 255))
    draw = ImageDraw.Draw(sheet)

    checker = Image.new("RGBA", (thumb, thumb), (255, 255, 255, 255))
    cd = ImageDraw.Draw(checker)
    cell = 18
    for y in range(0, thumb, cell):
        for x in range(0, thumb, cell):
            fill = (220, 220, 220, 255) if ((x // cell + y // cell) % 2) else (248, 248, 248, 255)
            cd.rectangle((x, y, x + cell - 1, y + cell - 1), fill=fill)

    for i, file in enumerate(files):
        col = i % cols
        row = i // cols
        x0 = col * thumb
        y0 = row * (thumb + label_h)
        sheet.alpha_composite(checker, (x0, y0))

        img = Image.open(file).convert("RGBA")
        img.thumbnail((thumb - 20, thumb - 20), Image.Resampling.LANCZOS)
        ix = x0 + (thumb - img.width) // 2
        iy = y0 + (thumb - img.height) // 2
        sheet.alpha_composite(img, (ix, iy))
        draw.text((x0 + 6, y0 + thumb + 6), file.name[:24], fill=(30, 30, 30, 255))

    dst.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(dst)


def main() -> None:
    for name in ITEM_FILES:
        prepare_cutout(
            SOURCE / "items" / name,
            ASSETS / "items" / name,
            tolerance=22,
            preserve_px=3,
            pad=12,
            max_dimension=512,
        )

    for src_name, dst_name in CHARACTER_FILES.items():
        prepare_cutout(
            SOURCE / "concepts" / src_name,
            ASSETS / "characters" / dst_name,
            tolerance=24,
            preserve_px=4,
            pad=18,
            max_dimension=1024,
        )

    copy_file(ASSETS / "backgrounds" / "tomsk-collage-desktop.png", PUBLIC / "backgrounds" / "tomsk-desktop.png")
    copy_file(ASSETS / "backgrounds" / "tomsk-collage-mobile.png", PUBLIC / "backgrounds" / "tomsk-mobile.png")

    for name in ITEM_FILES:
        copy_file(ASSETS / "items" / name, PUBLIC / "items" / name)

    for dst_name in CHARACTER_FILES.values():
        copy_file(ASSETS / "characters" / dst_name, PUBLIC / "characters" / dst_name)

    create_contact_sheet(
        [ASSETS / "items" / name for name in ITEM_FILES]
        + [ASSETS / "characters" / name for name in CHARACTER_FILES.values()],
        ASSETS / "technical-preview" / "prepared-assets-contact-sheet.png",
    )


if __name__ == "__main__":
    main()
