import { describe, expect, it } from "vitest";

import { GAME_ITEMS } from "../../src/game/data/items";
import { createInitialState } from "../../src/game/engine/state";
import { applyMissedItem } from "../../src/game/systems/gameplay";

function item(id: string) {
  const found = GAME_ITEMS.find((gameItem) => gameItem.id === id);
  expect(found).toBeDefined();
  return found!;
}

describe("gameplay miss rules", () => {
  it("does not count missed bills as missed catchable items", () => {
    let state = createInitialState();

    state = applyMissedItem(state, item("bill500")).state;
    state = applyMissedItem(state, item("bill1000")).state;
    state = applyMissedItem(state, item("bill5000")).state;

    expect(state.lives).toBe(3);
    expect(state.missedCatchableItems).toBe(0);
  });

  it("removes one life after three missed furniture or car items", () => {
    let state = createInitialState();

    state = applyMissedItem(state, item("mirror")).state;
    expect(state.lives).toBe(3);
    expect(state.missedCatchableItems).toBe(1);

    state = applyMissedItem(state, item("fuelCan")).state;
    expect(state.lives).toBe(3);
    expect(state.missedCatchableItems).toBe(2);

    state = applyMissedItem(state, item("wheel")).state;
    expect(state.lives).toBe(2);
    expect(state.missedCatchableItems).toBe(0);
  });

  it("does not punish missed hazards", () => {
    const state = applyMissedItem(createInitialState(), item("tax")).state;

    expect(state.lives).toBe(3);
    expect(state.missedCatchableItems).toBe(0);
  });

  it("removes one life for one missed contract", () => {
    const state = applyMissedItem(createInitialState(), item("contract")).state;

    expect(state.lives).toBe(2);
    expect(state.missedCatchableItems).toBe(0);
  });
});
