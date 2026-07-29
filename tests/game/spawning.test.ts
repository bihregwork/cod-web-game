import { describe, expect, it } from "vitest";

import { GAME_ITEMS } from "../../src/game/data/items";
import { createInitialState } from "../../src/game/engine/state";
import { availableCatchableSpawnZones, canSpawnCarPartByTime, carPartSpawnChance, itemFallSpeed, itemSize, pickSpawnItem, shouldForceFuelCan } from "../../src/game/systems/spawning";
import type { FallingItem, ItemId } from "../../src/game/types";

function item(id: ItemId) {
  const found = GAME_ITEMS.find((gameItem) => gameItem.id === id);
  expect(found).toBeDefined();
  return found!;
}

function fallingItem(id: ItemId, x: number): FallingItem {
  return {
    uid: `${id}-test`,
    item: item(id),
    x,
    y: 120,
    size: 90,
    speed: 110,
    rotation: 0,
    rotationSpeed: 0,
  };
}

function randomSequence(values: number[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

describe("spawn fairness", () => {
  it("does not allow a new catchable item in the opposite edge zone", () => {
    const zones = availableCatchableSpawnZones([fallingItem("bill500", 20)], 900);

    expect(zones).toEqual(["left", "center"]);
  });

  it("does not duplicate active contract spawns", () => {
    const picked = pickSpawnItem({
      state: createInitialState(),
      level: 1,
      stageWidth: 900,
      stageHeight: 700,
      lastContractElapsedMs: -30_000,
      elapsedMs: 35_000,
      activeItems: [fallingItem("contract", 420)],
      random: randomSequence([0, 0]),
    });

    expect(picked.id).not.toBe("contract");
  });

  it("does not duplicate active kitchen spawns", () => {
    const picked = pickSpawnItem({
      state: createInitialState(),
      level: 1,
      stageWidth: 900,
      stageHeight: 700,
      lastContractElapsedMs: 0,
      elapsedMs: 1_000,
      activeItems: [fallingItem("kitchen", 420)],
      random: randomSequence([0.99, 0.99, 0.99]),
    });

    expect(picked.id).not.toBe("kitchen");
  });
});

describe("hazard mix", () => {
  it("uses the accepted 70/30 tax and fine split", () => {
    const tax = pickSpawnItem({
      state: createInitialState(),
      level: 1,
      stageWidth: 900,
      stageHeight: 700,
      lastContractElapsedMs: 0,
      elapsedMs: 1_000,
      random: randomSequence([0.03, 0.69]),
    });
    const fine = pickSpawnItem({
      state: createInitialState(),
      level: 1,
      stageWidth: 900,
      stageHeight: 700,
      lastContractElapsedMs: 0,
      elapsedMs: 1_000,
      random: randomSequence([0.03, 0.7]),
    });

    expect(tax.id).toBe("tax");
    expect(fine.id).toBe("fine");
  });
});

describe("fuel can movement", () => {
  it("falls 15 percent slower than ordinary lightweight items", () => {
    expect(itemFallSpeed("fuelCan", 1, 810)).toBeCloseTo(itemFallSpeed("bill500", 1, 810) * 0.85);
  });
});

describe("item visual scale", () => {
  it("uses desktop 80 percent visual scale for falling item dimensions", () => {
    expect(itemSize("bill500", 1200)).toBe(61);
    expect(itemSize("kitchen", 1200)).toBe(98);
  });

  it("keeps the accepted mobile scale separate from desktop item scale", () => {
    expect(itemSize("bill500", 720)).toBe(58);
  });
});

describe("fuel can pity timer", () => {
  const carModeState = {
    ...createInitialState(),
    mode: "car" as const,
    fuel: 20,
    carParts: { wheels: 4, engine: true, body: true },
  };

  it("forces a fuel can in car mode after 15 seconds without fuel at 20 liters or less", () => {
    const picked = pickSpawnItem({
      state: carModeState,
      level: 5,
      stageWidth: 900,
      stageHeight: 700,
      lastContractElapsedMs: 0,
      lastFuelElapsedMs: 0,
      elapsedMs: 15_000,
      random: randomSequence([0.99, 0.99, 0.99]),
    });

    expect(picked.id).toBe("fuelCan");
  });

  it("does not force a fuel can above the low fuel threshold", () => {
    expect(
      shouldForceFuelCan({
        state: { ...carModeState, fuel: 21 },
        level: 5,
        stageWidth: 900,
        stageHeight: 700,
        lastContractElapsedMs: 0,
        lastFuelElapsedMs: 0,
        elapsedMs: 15_000,
      }),
    ).toBe(false);
  });

  it("does not force a second fuel can while one is already active", () => {
    expect(
      shouldForceFuelCan({
        state: carModeState,
        level: 5,
        stageWidth: 900,
        stageHeight: 700,
        lastContractElapsedMs: 0,
        lastFuelElapsedMs: 0,
        elapsedMs: 15_000,
        activeItems: [fallingItem("fuelCan", 420)],
      }),
    ).toBe(false);
  });
});

describe("car part spawn cadence", () => {
  it("uses accepted low car part chances across 40 levels", () => {
    const state = createInitialState();

    expect(carPartSpawnChance(state, 1)).toBe(0.04);
    expect(carPartSpawnChance(state, 10)).toBe(0.04);
    expect(carPartSpawnChance(state, 11)).toBe(0.05);
    expect(carPartSpawnChance(state, 20)).toBe(0.05);
    expect(carPartSpawnChance(state, 21)).toBe(0.06);
    expect(carPartSpawnChance(state, 30)).toBe(0.06);
    expect(carPartSpawnChance(state, 31)).toBe(0.07);
    expect(carPartSpawnChance(state, 40)).toBe(0.07);
  });

  it("does not spawn car parts before the accepted 8 second gap", () => {
    expect(canSpawnCarPartByTime({ elapsedMs: 10_000, lastCarPartElapsedMs: 2_001 })).toBe(false);
    expect(canSpawnCarPartByTime({ elapsedMs: 10_000, lastCarPartElapsedMs: 2_000 })).toBe(true);
  });

  it("falls back to ordinary items when car part cooldown is active", () => {
    const picked = pickSpawnItem({
      state: { ...createInitialState(), fuel: 60 },
      level: 1,
      stageWidth: 900,
      stageHeight: 700,
      lastContractElapsedMs: 10_000,
      lastCarPartElapsedMs: 6_000,
      elapsedMs: 10_000,
      random: randomSequence([0.07, 0, 0]),
    });

    expect(picked.kind).not.toBe("carPart");
  });
});
