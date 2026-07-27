import type { Rect } from "../engine/collision";

export type ScreenKind = "desktop" | "mobile";
export type CharacterMode = "heroine" | "car";

export type DesignSize = {
  width: number;
  height: number;
};

export type HudBlockLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SpriteLayout = {
  centerX: number;
  bottom: number;
  height: number;
};

export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DESIGN_SIZE: Record<ScreenKind, DesignSize> = {
  desktop: { width: 1440, height: 810 },
  mobile: { width: 720, height: 1280 },
};

export const HUD_LAYOUT: Record<ScreenKind, { score: HudBlockLayout; machine: HudBlockLayout }> = {
  desktop: {
    score: { x: 24, y: 24, width: 365, height: 104 },
    machine: { x: 1059, y: 24, width: 365, height: 104 },
  },
  mobile: {
    score: { x: 10, y: 18, width: 350, height: 102 },
    machine: { x: 375, y: 18, width: 335, height: 102 },
  },
};

export const SPRITE_LAYOUT: Record<ScreenKind, Record<CharacterMode, SpriteLayout>> = {
  desktop: {
    heroine: { centerX: 720, bottom: 18, height: 258 },
    car: { centerX: 720, bottom: 18, height: 258 },
  },
  mobile: {
    heroine: { centerX: 360, bottom: 30, height: 304 },
    car: { centerX: 360, bottom: 42, height: 304 },
  },
};

export const WALLET_HITBOX: Record<CharacterMode, NormalizedRect> = {
  heroine: { x: 0.39, y: 0.18, width: 0.55, height: 0.34 },
  car: { x: 0.42, y: 0.13, width: 0.5, height: 0.34 },
};

export function scaleDesignValue(value: number, actualSize: number, designSize: number): number {
  return (value / designSize) * actualSize;
}

export function rectFromDesign(rect: HudBlockLayout, actual: DesignSize, design: DesignSize): Rect {
  return {
    x: scaleDesignValue(rect.x, actual.width, design.width),
    y: scaleDesignValue(rect.y, actual.height, design.height),
    width: scaleDesignValue(rect.width, actual.width, design.width),
    height: scaleDesignValue(rect.height, actual.height, design.height),
  };
}

export function walletHitboxForSprite(sprite: Rect, mode: CharacterMode): Rect {
  const wallet = WALLET_HITBOX[mode];
  return {
    x: sprite.x + sprite.width * wallet.x,
    y: sprite.y + sprite.height * wallet.y,
    width: sprite.width * wallet.width,
    height: sprite.height * wallet.height,
  };
}
