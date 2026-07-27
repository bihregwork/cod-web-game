from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

import create_screen_mockup as ui


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "assets"
OUT = ROOT / "assets" / "technical-preview" / "screen-mockup-car-mode-desktop.png"
CAR_MODE_MATCHED_WALLET_HEIGHT = 258


def draw_left_hud(canvas: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    ui.rounded(draw, (24, 24, 414, 128), (255, 255, 255, 224), (255, 221, 91, 235), 2, 8)
    left_label_x = 44
    left_value_x = 140
    ui.draw_text(draw, (left_label_x, 38), "Очки", 24, (30, 37, 50, 255), bold=True)
    ui.draw_text(draw, (left_value_x, 28), "245 500", 34, (30, 37, 50, 255), bold=True)
    ui.draw_text(draw, (left_label_x, 88), "Жизни", 24, (30, 37, 50, 255), bold=True)
    hearts_x = left_value_x - 8
    for i in range(3):
        ui.draw_heart(draw, hearts_x + i * 38, 84, 30, (222, 48, 68, 255))
    ui.draw_icon_button(canvas, draw, (254, 76, 298, 120), "pause")
    ui.draw_icon_button(canvas, draw, (308, 76, 352, 120), "restart")
    ui.draw_icon_button(canvas, draw, (362, 76, 406, 120), "leaderboard")


def draw_car_mode_hud(canvas: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    items = PUBLIC / "items"
    wheel = Image.open(items / "wheel.png").convert("RGBA")
    engine = Image.open(items / "engine.png").convert("RGBA")
    body = Image.open(items / "car-body.png").convert("RGBA")
    fuel = Image.open(items / "fuel-can-20l.png").convert("RGBA")

    machine_hud_x = 1034
    ui.rounded(draw, (machine_hud_x - 4, 20, 1428, 132), (255, 221, 91, 70), None, 1, 10)
    ui.rounded(draw, (machine_hud_x, 24, 1424, 128), (255, 250, 225, 235), (249, 194, 48, 255), 3, 8)
    ui.draw_text(draw, (machine_hud_x + 20, 38), "Машина", 24, (30, 37, 50, 255), bold=True)
    ui.draw_text(draw, (machine_hud_x + 136, 43), "Car Mode", 16, (49, 122, 62, 255), bold=True)

    tiny_fuel = fuel.copy()
    tiny_fuel.thumbnail((24, 30), Image.Resampling.LANCZOS)
    canvas.alpha_composite(tiny_fuel, (machine_hud_x + 276, 36))
    ui.draw_text(draw, (machine_hud_x + 306, 38), "38/60 л", 18, (30, 37, 50, 255), bold=True)

    x = machine_hud_x + 20
    for i in range(4):
        ui.draw_slot(canvas, draw, (x + i * 52, 76, x + i * 52 + 44, 120), wheel)
    ui.draw_slot(canvas, draw, (machine_hud_x + 236, 76, machine_hud_x + 280, 120), engine)
    ui.draw_slot(canvas, draw, (machine_hud_x + 290, 76, machine_hud_x + 356, 120), body)


def draw_falling_objects(canvas: Image.Image) -> None:
    items = PUBLIC / "items"
    falling = [
        ("bill-5000.png", (530, 160), 116),
        ("contract.png", (720, 190), 92),
        ("tax.png", (1050, 250), 82),
        ("fine.png", (1188, 320), 82),
        ("kitchen.png", (310, 270), 120),
        ("fuel-can-20l.png", (850, 330), 82),
        ("bill-1000.png", (430, 390), 100),
    ]
    for name, center, target in falling:
        asset = Image.open(items / name).convert("RGBA")
        asset.thumbnail((target, target), Image.Resampling.LANCZOS)
        ui.paste_center(canvas, asset, center)


def draw_car_mode_character(canvas: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    width, height = canvas.size
    car = Image.open(PUBLIC / "characters" / "heroine-car.png").convert("RGBA")
    car = ui.fit(car, height=CAR_MODE_MATCHED_WALLET_HEIGHT)
    car_left = width // 2 - car.width // 2
    car_top = height - car.height - 18

    shadow = Image.new("RGBA", (round(car.width * 1.05), 44), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((10, 8, shadow.width - 10, 38), fill=(73, 57, 130, 64))
    shadow = shadow.filter(ImageFilter.GaussianBlur(5))
    canvas.alpha_composite(shadow, (width // 2 - shadow.width // 2, height - 58))

    canvas.alpha_composite(car, (car_left, car_top))

    scale = car.height / Image.open(PUBLIC / "characters" / "heroine-car.png").height
    wallet_center = (
        car_left + round(612 * scale),
        car_top + round(270 * scale),
    )
    ui.rounded(draw, (wallet_center[0] + 34, wallet_center[1] - 22, wallet_center[0] + 142, wallet_center[1] + 18), (255, 244, 168, 236), (236, 177, 31, 255), 2, 8)
    ui.draw_text(draw, (wallet_center[0] + 88, wallet_center[1] - 2), "+5000", 25, (48, 91, 43, 255), bold=True, anchor="mm")
    draw.ellipse((wallet_center[0] - 30, wallet_center[1] - 30, wallet_center[0] + 30, wallet_center[1] + 30), outline=(255, 215, 72, 215), width=5)


def main() -> None:
    width, height = 1440, 810
    bg = Image.open(PUBLIC / "backgrounds" / "tomsk-desktop.png").convert("RGBA")
    canvas = ui.cover(bg, (width, height)).convert("RGBA")
    canvas.alpha_composite(Image.new("RGBA", (width, height), (255, 255, 255, 64)))

    draw = ImageDraw.Draw(canvas)
    draw_left_hud(canvas, draw)
    draw_car_mode_hud(canvas, draw)
    draw_falling_objects(canvas)
    draw_car_mode_character(canvas, draw)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT, quality=95)


if __name__ == "__main__":
    main()
