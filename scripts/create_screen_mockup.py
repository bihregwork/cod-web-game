from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "assets"
REFERENCE_VISUAL = ROOT / "docs" / "references" / "visual"
OUT = ROOT / "assets" / "technical-preview" / "screen-mockup-desktop.png"

FONT_REGULAR = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")
HUD_YELLOW = (249, 194, 48, 255)
HUD_YELLOW_LIGHT = (255, 221, 91, 255)
HUD_DARK = (35, 42, 55, 255)
HUD_ICON_GREY = (96, 106, 121, 255)

SPRITE_SCALE_FACTOR = 0.85
HEROINE_BASE_HEIGHT = 386
HEROINE_SCREEN_HEIGHT = round(HEROINE_BASE_HEIGHT * SPRITE_SCALE_FACTOR)
HEROINE_CAR_BASE_HEIGHT = 386
HEROINE_CAR_SCREEN_HEIGHT = round(HEROINE_CAR_BASE_HEIGHT * SPRITE_SCALE_FACTOR)
WALLET_SCALE_FACTOR = 0.90
HEROINE_WALLET_POLYGON = [
    (188, 286),
    (358, 178),
    (455, 138),
    (625, 124),
    (668, 178),
    (660, 268),
    (525, 508),
    (322, 463),
    (200, 405),
]
HEROINE_CAR_WALLET_POLYGON = [
    (410, 285),
    (528, 224),
    (705, 96),
    (905, 88),
    (940, 170),
    (918, 276),
    (725, 422),
    (475, 366),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    w, h = image.size
    tw, th = size
    scale = max(tw / w, th / h)
    resized = image.resize((round(w * scale), round(h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - tw) // 2
    top = (resized.height - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def fit(image: Image.Image, *, width: int | None = None, height: int | None = None) -> Image.Image:
    if width is None and height is None:
        return image
    if height is None:
        scale = width / image.width
    else:
        scale = height / image.height
    size = (round(image.width * scale), round(image.height * scale))
    return image.resize(size, Image.Resampling.LANCZOS)


def paste_center(canvas: Image.Image, image: Image.Image, center: tuple[int, int]) -> None:
    x = center[0] - image.width // 2
    y = center[1] - image.height // 2
    canvas.alpha_composite(image, (x, y))


def polygon_alpha_mask(size: tuple[int, int], polygon: list[tuple[int, int]]) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    return mask


def shrink_wallet_region(
    image: Image.Image,
    polygon: list[tuple[int, int]],
    scale: float = WALLET_SCALE_FACTOR,
    cleanup_polygon: list[tuple[int, int]] | None = None,
) -> Image.Image:
    source = image.convert("RGBA")
    polygon_mask = polygon_alpha_mask(source.size, polygon)

    alpha = source.getchannel("A")
    wallet_mask = Image.new("L", source.size, 0)
    polygon_pixels = polygon_mask.load()
    alpha_pixels = alpha.load()
    wallet_pixels = wallet_mask.load()

    for y in range(source.height):
        for x in range(source.width):
            if polygon_pixels[x, y] == 0 or alpha_pixels[x, y] == 0:
                continue
            wallet_pixels[x, y] = 255

    wallet_mask = wallet_mask.filter(ImageFilter.MedianFilter(3))
    bbox = wallet_mask.getbbox()
    if not bbox:
        return source

    wallet_layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    wallet_layer.paste(source, (0, 0), wallet_mask)
    wallet_crop = wallet_layer.crop(bbox)
    wallet_crop = wallet_crop.resize(
        (round(wallet_crop.width * scale), round(wallet_crop.height * scale)),
        Image.Resampling.LANCZOS,
    )

    result = source.copy()
    result_pixels = result.load()
    cleanup_mask = polygon_alpha_mask(source.size, cleanup_polygon or polygon)
    cleanup_mask = cleanup_mask.filter(ImageFilter.MaxFilter(9))
    mask_pixels = cleanup_mask.load()
    for y in range(source.height):
        for x in range(source.width):
            if mask_pixels[x, y] > 0:
                result_pixels[x, y] = (0, 0, 0, 0)

    center_x = (bbox[0] + bbox[2]) // 2
    center_y = (bbox[1] + bbox[3]) // 2
    result.alpha_composite(wallet_crop, (center_x - wallet_crop.width // 2, center_y - wallet_crop.height // 2))
    return result


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill, outline=None, width=1, radius=8) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, size: int, fill, *, bold=False, anchor=None) -> None:
    draw.text(xy, text, font=font(size, bold), fill=fill, anchor=anchor)


def draw_heart(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill) -> None:
    r = size // 4
    draw.ellipse((x + r, y, x + r * 3, y + r * 2), fill=fill)
    draw.ellipse((x + r * 3, y, x + r * 5, y + r * 2), fill=fill)
    points = [(x + r, y + r), (x + r * 5, y + r), (x + size // 2, y + size)]
    draw.polygon(points, fill=fill)


def paste_mask_icon(
    canvas: Image.Image,
    mask: Image.Image,
    box: tuple[int, int, int, int],
    *,
    color=HUD_YELLOW,
    outline=HUD_DARK,
    outline_width: int = 1,
) -> None:
    icon_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    x1, y1, x2, y2 = box
    x = x1 + (x2 - x1 - mask.width) // 2
    y = y1 + (y2 - y1 - mask.height) // 2
    outline_filter = ImageFilter.MaxFilter(3 if outline_width <= 1 else outline_width * 2 + 1)
    outline_mask = mask.filter(outline_filter)
    soft_outline = outline_mask.filter(ImageFilter.GaussianBlur(0.35))
    icon_layer.paste(Image.new("RGBA", mask.size, outline), (x, y), soft_outline)
    icon_layer.paste(Image.new("RGBA", mask.size, color), (x, y), mask)
    canvas.alpha_composite(icon_layer)


def restart_icon_mask(size: int) -> Image.Image:
    source = Image.open(REFERENCE_VISUAL / "Рестарт.png").convert("RGBA")
    gray = source.convert("L")
    mask = gray.point(lambda p: 255 if p < 80 else 0, mode="L")
    bbox = mask.getbbox()
    if bbox:
        mask = mask.crop(bbox)
    mask.thumbnail((size, size), Image.Resampling.LANCZOS)
    return mask


def trophy_icon(size: int) -> Image.Image:
    source = Image.open(REFERENCE_VISUAL / "Кубок.png").convert("RGBA")
    bbox = source.getbbox()
    if bbox:
        source = source.crop(bbox)
    source.thumbnail((size, size), Image.Resampling.LANCZOS)

    tinted = Image.new("RGBA", source.size, (0, 0, 0, 0))
    pixels = source.load()
    out = tinted.load()
    for y in range(source.height):
        for x in range(source.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            lum = int(r * 0.299 + g * 0.587 + b * 0.114)
            if lum < 55:
                out[x, y] = HUD_DARK[:3] + (a,)
            elif r > 238 and g > 238 and b > 238:
                out[x, y] = (255, 255, 255, a)
            elif lum < 115:
                out[x, y] = (70, 87, 99, a)
            elif lum < 185:
                out[x, y] = HUD_YELLOW[:3] + (a,)
            else:
                out[x, y] = HUD_YELLOW_LIGHT[:3] + (a,)
    return tinted


def restart_symbol_icon(size: int) -> Image.Image:
    source = Image.open(REFERENCE_VISUAL / "Рестарт2.jpeg").convert("RGB")
    mask = Image.new("L", source.size, 0)
    pixels = source.load()
    mask_pixels = mask.load()

    for y in range(source.height):
        for x in range(source.width):
            r, g, b = pixels[x, y]
            high = max(r, g, b)
            low = min(r, g, b)
            chroma = high - low
            luminance = int(r * 0.299 + g * 0.587 + b * 0.114)
            is_yellow_arrow = r > 115 and g > 85 and b < 120 and chroma > 45
            is_black_contour = luminance < 92
            if is_yellow_arrow or is_black_contour:
                mask_pixels[x, y] = 255

    mask = mask.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.MaxFilter(3))
    bbox = mask.getbbox()
    if bbox:
        source = source.crop(bbox)
        mask = mask.crop(bbox)

    icon = Image.new("RGBA", source.size, (0, 0, 0, 0))
    icon.paste(source.convert("RGBA"), (0, 0), mask)
    content_size = round(size * 0.95)
    icon.thumbnail((content_size, content_size), Image.Resampling.LANCZOS)

    bbox = icon.getchannel("A").getbbox()
    if bbox:
        icon = icon.crop(bbox)

    centered = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    centered.alpha_composite(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    return centered


def draw_pause_icon(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    x1, y1, x2, y2 = box
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    for offset in (-7, 7):
        bar = (cx + offset - 4, cy - 14, cx + offset + 4, cy + 14)
        draw.rounded_rectangle(bar, radius=3, fill=HUD_ICON_GREY)
        inner = (bar[0] + 1, bar[1] + 1, bar[2] - 1, bar[3] - 1)
        draw.rounded_rectangle(inner, radius=2, fill=HUD_YELLOW)
        draw.line((inner[0] + 1, inner[1] + 2, inner[2] - 1, inner[1] + 2), fill=HUD_YELLOW_LIGHT, width=1)


def draw_icon_button(canvas: Image.Image, draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], kind: str) -> None:
    rounded(draw, box, (255, 255, 255, 205), (115, 124, 138, 210), 2, 7)
    if kind == "pause":
        draw_pause_icon(draw, box)
    elif kind == "restart":
        icon = restart_symbol_icon(36)
        canvas.alpha_composite(icon, (box[0] + (box[2] - box[0] - icon.width) // 2, box[1] + (box[3] - box[1] - icon.height) // 2))
    elif kind == "leaderboard":
        icon = trophy_icon(33)
        canvas.alpha_composite(icon, (box[0] + (box[2] - box[0] - icon.width) // 2, box[1] + (box[3] - box[1] - icon.height) // 2))


def draw_slot(canvas: Image.Image, draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], asset: Image.Image | None) -> None:
    fill = (255, 255, 255, 205) if asset else (229, 232, 238, 135)
    outline = (234, 185, 54, 255) if asset else (115, 124, 138, 210)
    rounded(draw, box, fill, outline, 2, 7)
    if asset:
        icon = asset.copy()
        icon.thumbnail((box[2] - box[0] - 10, box[3] - box[1] - 10), Image.Resampling.LANCZOS)
        canvas.alpha_composite(icon, (box[0] + (box[2] - box[0] - icon.width) // 2, box[1] + (box[3] - box[1] - icon.height) // 2))


def main() -> None:
    width, height = 1440, 810
    bg = Image.open(PUBLIC / "backgrounds" / "tomsk-desktop.png").convert("RGBA")
    canvas = cover(bg, (width, height)).convert("RGBA")
    overlay = Image.new("RGBA", (width, height), (255, 255, 255, 64))
    canvas.alpha_composite(overlay)

    draw = ImageDraw.Draw(canvas)

    # HUD left
    rounded(draw, (24, 24, 414, 128), (255, 255, 255, 224), (255, 221, 91, 235), 2, 8)
    left_label_x = 44
    left_value_x = 140
    draw_text(draw, (left_label_x, 38), "Очки", 24, (30, 37, 50, 255), bold=True)
    draw_text(draw, (left_value_x, 28), "245 500", 34, (30, 37, 50, 255), bold=True)
    draw_text(draw, (left_label_x, 88), "Жизни", 24, (30, 37, 50, 255), bold=True)
    hearts_x = left_value_x - 8
    for i in range(3):
        draw_heart(draw, hearts_x + i * 38, 84, 30, (222, 48, 68, 255))
    draw_icon_button(canvas, draw, (254, 76, 298, 120), "pause")
    draw_icon_button(canvas, draw, (308, 76, 352, 120), "restart")
    draw_icon_button(canvas, draw, (362, 76, 406, 120), "leaderboard")

    # Machine HUD
    machine_hud_x = 1034
    rounded(draw, (machine_hud_x, 24, 1424, 128), (255, 255, 255, 224), (255, 221, 91, 235), 2, 8)
    draw_text(draw, (machine_hud_x + 20, 38), "Машина", 24, (30, 37, 50, 255), bold=True)
    draw_text(draw, (machine_hud_x + 136, 43), "Собери машину", 16, (90, 98, 112, 255), bold=True)
    items = PUBLIC / "items"
    wheel = Image.open(items / "wheel.png").convert("RGBA")
    engine = Image.open(items / "engine.png").convert("RGBA")
    body = Image.open(items / "car-body.png").convert("RGBA")
    fuel = Image.open(items / "fuel-can-20l.png").convert("RGBA")
    tiny_fuel = fuel.copy()
    tiny_fuel.thumbnail((24, 30), Image.Resampling.LANCZOS)
    canvas.alpha_composite(tiny_fuel, (machine_hud_x + 276, 36))
    draw_text(draw, (machine_hud_x + 306, 38), "40/60 л", 18, (30, 37, 50, 255), bold=True)
    x = machine_hud_x + 20
    for i in range(4):
        draw_slot(canvas, draw, (x + i * 52, 76, x + i * 52 + 44, 120), wheel if i < 2 else None)
    draw_slot(canvas, draw, (machine_hud_x + 236, 76, machine_hud_x + 280, 120), engine)
    draw_slot(canvas, draw, (machine_hud_x + 290, 76, machine_hud_x + 356, 120), None)

    # Falling objects
    falling = [
        ("bill-5000.png", (530, 160), 116),
        ("contract.png", (720, 190), 92),
        ("tax.png", (1050, 250), 82),
        ("wheel.png", (1190, 318), 76),
        ("kitchen.png", (310, 270), 120),
        ("fuel-can-20l.png", (850, 330), 82),
        ("bill-1000.png", (430, 390), 100),
    ]
    for name, center, target in falling:
        asset = Image.open(items / name).convert("RGBA")
        asset.thumbnail((target, target), Image.Resampling.LANCZOS)
        paste_center(canvas, asset, center)

    # Bottom subtle ground shadow
    shadow_scale = SPRITE_SCALE_FACTOR / 0.85
    shadow_width = round(440 * shadow_scale)
    shadow_height = round(40 * shadow_scale)
    shadow = Image.new("RGBA", (shadow_width, shadow_height), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((10, 6, shadow_width - 10, shadow_height - 4), fill=(73, 57, 130, 62))
    shadow = shadow.filter(ImageFilter.GaussianBlur(4))
    canvas.alpha_composite(shadow, (720 - shadow.width // 2, 758))

    # Heroine
    heroine = Image.open(PUBLIC / "characters" / "heroine.png").convert("RGBA")
    heroine = fit(heroine, height=HEROINE_SCREEN_HEIGHT)
    heroine_left = 720 - heroine.width // 2
    heroine_top = height - heroine.height - 18
    canvas.alpha_composite(heroine, (heroine_left, heroine_top))

    # Pop-up and wallet highlight
    wallet_center = (
        heroine_left + round(198 * SPRITE_SCALE_FACTOR),
        heroine_top + round(116 * SPRITE_SCALE_FACTOR),
    )
    rounded(draw, (wallet_center[0] + 32, wallet_center[1] - 22, wallet_center[0] + 140, wallet_center[1] + 18), (255, 244, 168, 236), (236, 177, 31, 255), 2, 8)
    draw_text(draw, (wallet_center[0] + 86, wallet_center[1] - 2), "+5000", 25, (48, 91, 43, 255), bold=True, anchor="mm")
    draw.ellipse((wallet_center[0] - 28, wallet_center[1] - 28, wallet_center[0] + 28, wallet_center[1] + 28), outline=(255, 215, 72, 210), width=5)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT, quality=95)


if __name__ == "__main__":
    main()
