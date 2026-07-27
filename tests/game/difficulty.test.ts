import { describe, expect, it } from "vitest";

import { contractChance, difficultyLevel, fallSpeedMultiplier, hazardChance, movementSpeedMultiplier, spawnIntervalMs } from "../../src/game/systems/difficulty";

describe("difficulty balance", () => {
  it("grows difficulty by score only", () => {
    expect(difficultyLevel(600, 0)).toBe(1);
    expect(difficultyLevel(0, 199_999)).toBe(1);
    expect(difficultyLevel(0, 200_000)).toBe(2);
    expect(difficultyLevel(0, 3_800_000)).toBe(20);
    expect(difficultyLevel(0, 7_800_000)).toBe(40);
    expect(difficultyLevel(0, 10_000_000)).toBe(40);
  });

  it("uses the accepted fall speed growth", () => {
    expect(fallSpeedMultiplier(1)).toBe(1);
    expect(fallSpeedMultiplier(40)).toBeCloseTo(4);
  });

  it("adds range-based movement speed per difficulty level", () => {
    expect(movementSpeedMultiplier(1)).toBeCloseTo(1);
    expect(movementSpeedMultiplier(2)).toBeCloseTo(1.01);
    expect(movementSpeedMultiplier(10)).toBeCloseTo(1.09);
    expect(movementSpeedMultiplier(20)).toBeCloseTo(1.19);
    expect(movementSpeedMultiplier(30)).toBeCloseTo(1.39);
    expect(movementSpeedMultiplier(40)).toBeCloseTo(1.59);
    expect(movementSpeedMultiplier(99)).toBeCloseTo(1.59);
  });

  it("uses the accepted slower spawn interval range", () => {
    expect(spawnIntervalMs(1)).toBe(2_000);
    expect(spawnIntervalMs(40)).toBe(650);
  });

  it("scales contract and hazard chances across the 40 levels", () => {
    expect(contractChance(1)).toBeCloseTo(0.02);
    expect(contractChance(40)).toBeCloseTo(0.05);
    expect(hazardChance(1)).toBeCloseTo(0.06);
    expect(hazardChance(40)).toBeCloseTo(0.22);
  });
});
