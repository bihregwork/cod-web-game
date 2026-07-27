import { BALANCE } from "../data/balance";
import type { GameItem } from "../types";

export function scoreForCatch(currentScore: number, item: GameItem): number {
  if (item.id === "tax") {
    return Math.max(0, currentScore - BALANCE.scoring.taxPenalty);
  }
  return currentScore + item.points;
}

export function lifeDeltaForCatch(item: GameItem): number {
  return item.id === "fine" ? -1 : 0;
}

export function lifeDeltaForMiss(item: GameItem): number {
  return item.id === "contract" ? -BALANCE.scoring.missedContractLifePenalty : 0;
}
