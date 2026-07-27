import { describe, expect, it } from "vitest";

import { DESIGN_SIZE, HUD_LAYOUT, SPRITE_LAYOUT, walletHitboxForSprite } from "../../src/game/data/layout";
import type { Rect } from "../../src/game/engine/collision";

describe("approved screen layout", () => {
  it("keeps accepted desktop HUD edge offsets after resize", () => {
    const { score, machine } = HUD_LAYOUT.desktop;
    const rightOffset = DESIGN_SIZE.desktop.width - (machine.x + machine.width);

    expect(score.width).toBe(365);
    expect(machine.width).toBe(365);
    expect(score.x).toBe(24);
    expect(rightOffset).toBe(16);
    expect(score.height).toBe(104);
    expect(machine.height).toBe(104);
  });

  it("keeps accepted mobile HUD spacing", () => {
    const { score, machine } = HUD_LAYOUT.mobile;
    const gap = machine.x - (score.x + score.width);
    const rightOffset = DESIGN_SIZE.mobile.width - (machine.x + machine.width);

    expect(score.width).toBe(350);
    expect(machine.width).toBe(335);
    expect(score.x).toBe(10);
    expect(rightOffset).toBe(10);
    expect(gap).toBe(15);
    expect(score.height).toBe(102);
    expect(machine.height).toBe(102);
  });

  it("places wallet hitboxes inside character sprites", () => {
    const sprite: Rect = { x: 500, y: 430, width: 220, height: 328 };

    for (const mode of ["heroine", "car"] as const) {
      const hitbox = walletHitboxForSprite(sprite, mode);
      expect(hitbox.x).toBeGreaterThanOrEqual(sprite.x);
      expect(hitbox.y).toBeGreaterThanOrEqual(sprite.y);
      expect(hitbox.x + hitbox.width).toBeLessThanOrEqual(sprite.x + sprite.width);
      expect(hitbox.y + hitbox.height).toBeLessThanOrEqual(sprite.y + sprite.height);
    }
  });

  it("keeps heroine and car mode at the same accepted sprite height", () => {
    expect(SPRITE_LAYOUT.desktop.heroine.height).toBe(SPRITE_LAYOUT.desktop.car.height);
    expect(SPRITE_LAYOUT.mobile.heroine.height).toBe(SPRITE_LAYOUT.mobile.car.height);
  });
});
