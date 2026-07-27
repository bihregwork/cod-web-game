import { BALANCE } from "../data/balance";
import type { GameState } from "../types";

export function createInitialState(): GameState {
  return {
    mode: "idle",
    score: 0,
    lives: BALANCE.startingLives,
    fuel: 0,
    missedCatchableItems: 0,
    carParts: {
      wheels: 0,
      engine: false,
      body: false,
    },
  };
}
