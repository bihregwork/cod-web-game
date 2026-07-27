import { BALANCE } from "../data/balance";
import type { GameState } from "../types";

export function isCarAssembled(state: Pick<GameState, "carParts">): boolean {
  return state.carParts.wheels >= 4 && state.carParts.engine && state.carParts.body;
}

export function canStartCarMode(state: Pick<GameState, "carParts" | "fuel">): boolean {
  return isCarAssembled(state) && state.fuel > 0;
}

export function addFuel(currentFuel: number): number {
  return Math.min(BALANCE.maxFuel, currentFuel + BALANCE.fuelCanLiters);
}

export function fuelSpawnChance(state: Pick<GameState, "carParts" | "fuel" | "mode">): number {
  const assembled = isCarAssembled(state);
  if (!assembled) {
    return state.fuel >= BALANCE.maxFuel ? 0 : BALANCE.fuelSpawn.unassembledBelowMax;
  }
  if (state.fuel === 0) {
    return BALANCE.fuelSpawn.assembledEmpty;
  }
  if (state.fuel <= 10) {
    return BALANCE.fuelSpawn.activeCritical;
  }
  if (state.fuel <= 20) {
    return BALANCE.fuelSpawn.activeLow;
  }
  if (state.fuel <= 40) {
    return BALANCE.fuelSpawn.activeMiddle;
  }
  return BALANCE.fuelSpawn.activeHigh;
}
