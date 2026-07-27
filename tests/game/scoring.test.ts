import { describe, expect, it } from "vitest";

import { GAME_ITEMS } from "../../src/game/data/items";
import { lifeDeltaForCatch, scoreForCatch } from "../../src/game/systems/scoring";

describe("scoring", () => {
  it("adds points for reward items", () => {
    const contract = GAME_ITEMS.find((item) => item.id === "contract");
    expect(contract).toBeDefined();
    expect(scoreForCatch(10_000, contract!)).toBe(110_000);
  });

  it("does not let tax penalty drop score below zero", () => {
    const tax = GAME_ITEMS.find((item) => item.id === "tax");
    expect(tax).toBeDefined();
    expect(scoreForCatch(10_000, tax!)).toBe(0);
  });

  it("removes a life for fine catch", () => {
    const fine = GAME_ITEMS.find((item) => item.id === "fine");
    expect(fine).toBeDefined();
    expect(lifeDeltaForCatch(fine!)).toBe(-1);
  });
});
