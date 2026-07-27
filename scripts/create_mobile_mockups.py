from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

import create_screen_mockup as ui


ROOT = Path(__file__).resolve().parents[1]
APPROVED = ROOT / "assets" / "approved"
OUT_DIR = ROOT / "assets" / "technical-preview"

WIDTH = 720
HEIGHT = 1280
MOBILE_TOP_HUD_X = 10
MOBILE_TOP_HUD_WIDTH = 350
MOBILE_MACHINE_HUD_WIDTH = 335
MOBILE_MACHINE_HUD_X = WIDTH - MOBILE_MACHINE_HUD_WIDTH - 10
MOBILE_HUD_HEIGHT = 102
MOBILE_TOP_HUD_Y = 18
MOBILE_MACHINE_HUD_Y = MOBILE_TOP_HUD_Y

TEXT_SCORE = "\u041e\u0447\u043a\u0438"
TEXT_LIVES = "\u0416\u0438\u0437\u043d\u0438"
TEXT_MACHINE = "\u041c\u0430\u0448\u0438\u043d\u0430"
TEXT_COLLECT = "\u0421\u043e\u0431\u0435\u0440\u0438 \u043c\u0430\u0448\u0438\u043d\u0443"
TEXT_FUEL_40 = "40/60 \u043b"
TEXT_FUEL_38 = "38/60 \u043b"


def make_canvas() -> Image.Image:
    bg = Image.open(APPROVED / "backgrounds" / "tomsk-mobile.png").convert("RGBA")
    canvas = ui.cover(bg, (WIDTH, HEIGHT)).convert("RGBA")
    canvas = ImageEnhance.Color(canvas).enhance(0.86)
    canvas = ImageEnhance.Contrast(canvas).enhance(0.82)
    canvas = ImageEnhance.Brightness(canvas).enhance(0.94)
    canvas.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 28)))
    return canvas


def draw_top_hud(canvas: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    x1 = MOBILE_TOP_HUD_X
    y1 = MOBILE_TOP_HUD_Y
    x2 = x1 + MOBILE_TOP_HUD_WIDTH
    y2 = y1 + MOBILE_HUD_HEIGHT
    ui.rounded(draw, (x1, y1, x2, y2), (255, 255, 255, 232), (255, 221, 91, 240), 2, 8)
    ui.draw_text(draw, (x1 + 18, y1 + 18), TEXT_SCORE, 24, (30, 37, 50, 255), bold=True)
    ui.draw_text(draw, (x1 + 112, y1 + 8), "245 500", 34, (30, 37, 50, 255), bold=True)
    ui.draw_text(draw, (x1 + 18, y1 + 66), TEXT_LIVES, 24, (30, 37, 50, 255), bold=True)

    for i in range(3):
        ui.draw_heart(draw, x1 + 104 + i * 31, y1 + 65, 28, (222, 48, 68, 255))

    button_y = y1 + 59
    ui.draw_icon_button(canvas, draw, (x1 + 220, button_y, x1 + 256, button_y + 36), "pause")
    ui.draw_icon_button(canvas, draw, (x1 + 264, button_y, x1 + 300, button_y + 36), "restart")
    ui.draw_icon_button(canvas, draw, (x1 + 308, button_y, x1 + 344, button_y + 36), "leaderboard")


def draw_machine_hud(canvas: Image.Image, draw: ImageDraw.ImageDraw, *, active: bool) -> None:
    items = APPROVED / "items"
    wheel = Image.open(items / "wheel.png").convert("RGBA")
    engine = Image.open(items / "engine.png").convert("RGBA")
    body = Image.open(items / "car-body.png").convert("RGBA")
    fuel = Image.open(items / "fuel-can-20l.png").convert("RGBA")

    if active:
        ui.rounded(
            draw,
            (MOBILE_MACHINE_HUD_X - 4, MOBILE_MACHINE_HUD_Y - 4, MOBILE_MACHINE_HUD_X + MOBILE_MACHINE_HUD_WIDTH + 4, MOBILE_MACHINE_HUD_Y + MOBILE_HUD_HEIGHT + 4),
            (255, 221, 91, 68),
            None,
            1,
            10,
        )
        fill = (255, 250, 225, 236)
        outline = ui.HUD_YELLOW
        outline_width = 3
        status = "Car Mode"
        status_fill = (49, 122, 62, 255)
        fuel_label = TEXT_FUEL_38
    else:
        fill = (255, 255, 255, 226)
        outline = (255, 221, 91, 235)
        outline_width = 2
        status = TEXT_COLLECT
        status_fill = (90, 98, 112, 255)
        fuel_label = TEXT_FUEL_40

    x1 = MOBILE_MACHINE_HUD_X
    y1 = MOBILE_MACHINE_HUD_Y
    x2 = x1 + MOBILE_MACHINE_HUD_WIDTH
    y2 = y1 + MOBILE_HUD_HEIGHT
    ui.rounded(draw, (x1, y1, x2, y2), fill, outline, outline_width, 8)
    ui.draw_text(draw, (x1 + 18, y1 + 15), TEXT_MACHINE, 22, (30, 37, 50, 255), bold=True)
    ui.draw_text(draw, (x1 + 118, y1 + 18), status, 14 if not active else 14, status_fill, bold=True)

    tiny_fuel = fuel.copy()
    tiny_fuel.thumbnail((22, 28), Image.Resampling.LANCZOS)
    canvas.alpha_composite(tiny_fuel, (x1 + 246, y1 + 14))
    ui.draw_text(draw, (x1 + 274, y1 + 18), fuel_label, 15, (30, 37, 50, 255), bold=True)

    x = x1 + 18
    y = y1 + 58
    gap = 6
    size = 33
    for i in range(4):
        asset = wheel if active or i < 2 else None
        ui.draw_slot(canvas, draw, (x + i * (size + gap), y, x + i * (size + gap) + size, y + size), asset)
    ui.draw_slot(canvas, draw, (x + 4 * (size + gap) + 14, y, x + 4 * (size + gap) + 14 + size, y + size), engine)
    ui.draw_slot(canvas, draw, (x + 5 * (size + gap) + 14, y, x + 5 * (size + gap) + 14 + size + 12, y + size), body if active else None)


def paste_center(canvas: Image.Image, image: Image.Image, center: tuple[int, int]) -> None:
    ui.paste_center(canvas, image, center)


def draw_falling_objects(canvas: Image.Image, *, car_mode: bool) -> None:
    items = APPROVED / "items"
    falling = [
        ("bill-5000.png", (264, 318), 82),
        ("contract.png", (470, 360), 76),
        ("tax.png", (620, 428), 74),
        ("kitchen.png", (138, 444), 104),
        ("fuel-can-20l.png", (530, 520), 82),
        ("bill-1000.png", (260, 588), 78),
    ]
    if car_mode:
        falling.append(("fine.png", (618, 620), 78))
    else:
        falling.append(("wheel.png", (620, 624), 74))

    for name, center, target in falling:
        asset = Image.open(items / name).convert("RGBA")
        asset.thumbnail((target, target), Image.Resampling.LANCZOS)
        paste_center(canvas, asset, center)


def draw_score_popup(draw: ImageDraw.ImageDraw, wallet_center: tuple[int, int]) -> None:
    x, y = wallet_center
    ui.rounded(draw, (x + 44, y - 24, x + 154, y + 18), (255, 244, 168, 238), (236, 177, 31, 255), 2, 8)
    ui.draw_text(draw, (x + 99, y - 3), "+5000", 27, (48, 91, 43, 255), bold=True, anchor="mm")
    draw.ellipse((x - 30, y - 30, x + 30, y + 30), outline=(255, 215, 72, 218), width=5)


def draw_heroine(canvas: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    heroine = Image.open(APPROVED / "characters" / "heroine.png").convert("RGBA")
    heroine = ui.fit(heroine, height=396)
    left = WIDTH // 2 - heroine.width // 2
    top = HEIGHT - heroine.height - 30

    shadow = Image.new("RGBA", (360, 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((18, 8, 342, 34), fill=(73, 57, 130, 62))
    shadow = shadow.filter(ImageFilter.GaussianBlur(4))
    canvas.alpha_composite(shadow, (WIDTH // 2 - shadow.width // 2, HEIGHT - 58))

    canvas.alpha_composite(heroine, (left, top))
    scale = heroine.height / 1024
    wallet_center = (left + round(445 * scale), top + round(320 * scale))
    draw_score_popup(draw, wallet_center)


def draw_car_mode_character(canvas: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    car = Image.open(APPROVED / "characters" / "heroine-car.png").convert("RGBA")
    car = ui.fit(car, height=304)
    left = WIDTH // 2 - car.width // 2
    top = HEIGHT - car.height - 42

    shadow = Image.new("RGBA", (round(car.width * 1.08), 42), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((10, 8, shadow.width - 10, 36), fill=(73, 57, 130, 66))
    shadow = shadow.filter(ImageFilter.GaussianBlur(5))
    canvas.alpha_composite(shadow, (WIDTH // 2 - shadow.width // 2, HEIGHT - 60))

    canvas.alpha_composite(car, (left, top))
    scale = car.height / 790
    wallet_center = (left + round(665 * scale), top + round(270 * scale))
    draw_score_popup(draw, wallet_center)


def build_playing() -> Image.Image:
    canvas = make_canvas()
    draw = ImageDraw.Draw(canvas)
    draw_top_hud(canvas, draw)
    draw_machine_hud(canvas, draw, active=False)
    draw_falling_objects(canvas, car_mode=False)
    draw_heroine(canvas, draw)
    return canvas


def build_car_mode() -> Image.Image:
    canvas = make_canvas()
    draw = ImageDraw.Draw(canvas)
    draw_top_hud(canvas, draw)
    draw_machine_hud(canvas, draw, active=True)
    draw_falling_objects(canvas, car_mode=True)
    draw_car_mode_character(canvas, draw)
    return canvas


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_playing().convert("RGB").save(OUT_DIR / "screen-mockup-mobile.png", quality=95)
    build_car_mode().convert("RGB").save(OUT_DIR / "screen-mockup-car-mode-mobile.png", quality=95)


if __name__ == "__main__":
    main()
