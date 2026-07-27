import { describe, expect, it } from "vitest";

import { addFuel, canStartCarMode, fuelSpawnChance } from "../../src/game/systems/machineBonus";

describe("machine bonus", () => {
  it("caps fuel at 60 liters", () => {
    expect(addFuel(50)).toBe(60);
  });

  it("starts car mode only with assembled car and fuel", () => {
    expect(canStartCarMode({ carParts: { wheels: 4, engine: true, body: true }, fuel: 20 })).toBe(true);
    expect(canStartCarMode({ carParts: { wheels: 3, engine: true, body: true }, fuel: 20 })).toBe(false);
  });

  it("uses accepted fuel spawn scale", () => {
    expect(fuelSpawnChance({ mode: "playing", carParts: { wheels: 0, engine: false, body: false }, fuel: 40 })).toBe(0.03);
    expect(fuelSpawnChance({ mode: "playing", carParts: { wheels: 0, engine: false, body: false }, fuel: 60 })).toBe(0);
    expect(fuelSpawnChance({ mode: "playing", carParts: { wheels: 4, engine: true, body: true }, fuel: 0 })).toBe(0.06);
    expect(fuelSpawnChance({ mode: "car", carParts: { wheels: 4, engine: true, body: true }, fuel: 10 })).toBe(0.08);
    expect(fuelSpawnChance({ mode: "car", carParts: { wheels: 4, engine: true, body: true }, fuel: 20 })).toBe(0.06);
    expect(fuelSpawnChance({ mode: "car", carParts: { wheels: 4, engine: true, body: true }, fuel: 40 })).toBe(0.04);
    expect(fuelSpawnChance({ mode: "car", carParts: { wheels: 4, engine: true, body: true }, fuel: 60 })).toBe(0.02);
  });
});
