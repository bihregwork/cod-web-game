import { BALANCE } from "../data/balance";
import type { FallingItem, FloatingTextKind, GameItem, GameState } from "../types";
import { addFuel, canStartCarMode } from "./machineBonus";
import { lifeDeltaForCatch, lifeDeltaForMiss, scoreForCatch } from "./scoring";

export type CatchResult = {
  state: GameState;
  text: string;
  textKind: FloatingTextKind;
};

export type MissResult = {
  state: GameState;
  text?: string;
  textKind?: FloatingTextKind;
};

const MISS_COUNTER_ITEM_IDS = new Set<GameItem["id"]>(["mirror", "hallway", "kitchen", "wheel", "engine", "carBody", "fuelCan"]);

export function applyCaughtItem(state: GameState, item: GameItem): CatchResult {
  let nextState: GameState = {
    ...state,
    score: scoreForCatch(state.score, item),
    lives: Math.max(0, state.lives + lifeDeltaForCatch(item)),
    carParts: { ...state.carParts },
  };
  let text = item.points > 0 ? `+${item.points.toLocaleString("ru-RU")}` : item.label;
  let textKind: FloatingTextKind = item.points > 0 ? "score" : "bonus";

  if (item.id === "tax") {
    text = "-50 000";
    textKind = "penalty";
  }

  if (item.id === "fine") {
    text = "-1 жизнь";
    textKind = "life";
  }

  if (item.id === "fuelCan") {
    nextState = { ...nextState, fuel: addFuel(nextState.fuel) };
    text = "+20 л";
    textKind = "bonus";
  }

  if (item.id === "wheel") {
    nextState = {
      ...nextState,
      carParts: { ...nextState.carParts, wheels: Math.min(4, nextState.carParts.wheels + 1) },
    };
    text = "Колесо";
    textKind = "bonus";
  }

  if (item.id === "engine" && !nextState.carParts.engine) {
    nextState = { ...nextState, carParts: { ...nextState.carParts, engine: true } };
    text = "Двигатель";
    textKind = "bonus";
  }

  if (item.id === "carBody" && !nextState.carParts.body) {
    nextState = { ...nextState, carParts: { ...nextState.carParts, body: true } };
    text = "Кузов";
    textKind = "bonus";
  }

  if (nextState.lives <= 0) {
    nextState = { ...nextState, mode: "gameOver" };
  } else if (canStartCarMode(nextState)) {
    nextState = { ...nextState, mode: "car" };
  }

  return { state: nextState, text, textKind };
}

export function applyMissedItem(state: GameState, item: GameItem): MissResult {
  if (item.kind === "hazard") {
    return { state };
  }

  if (!countsTowardMissPenalty(item) && item.id !== "contract") {
    return { state };
  }

  if (item.id !== "contract") {
    const missedCatchableItems = state.missedCatchableItems + 1;
    if (missedCatchableItems < BALANCE.scoring.missedCatchableBeforeLifePenalty) {
      return {
        state: { ...state, missedCatchableItems },
        text: `${missedCatchableItems}/${BALANCE.scoring.missedCatchableBeforeLifePenalty}`,
        textKind: "penalty",
      };
    }

    const livesAfterPenalty = Math.max(0, state.lives - 1);
    return {
      state: {
        ...state,
        lives: livesAfterPenalty,
        missedCatchableItems: 0,
        mode: livesAfterPenalty <= 0 ? "gameOver" : state.mode,
      },
      text: "-1 жизнь",
      textKind: "life",
    };
  }

  const lifeDelta = lifeDeltaForMiss(item);
  const lives = Math.max(0, state.lives + lifeDelta);
  return {
    state: { ...state, lives, mode: lives <= 0 ? "gameOver" : state.mode },
    text: "-1 жизнь",
    textKind: "life",
  };
}

export function countsTowardMissPenalty(item: GameItem): boolean {
  return MISS_COUNTER_ITEM_IDS.has(item.id);
}

export function consumeFuel(state: GameState, deltaMs: number): GameState {
  if (state.mode !== "car" || state.fuel <= 0) {
    return state;
  }

  const fuel = Math.max(0, state.fuel - deltaMs / 1000);
  return {
    ...state,
    fuel,
    mode: fuel <= 0 ? "playing" : "car",
  };
}

export function moveFallingItem(item: FallingItem, deltaMs: number): FallingItem {
  const seconds = deltaMs / 1000;
  return {
    ...item,
    y: item.y + item.speed * seconds,
    rotation: item.rotation + item.rotationSpeed * seconds,
  };
}

export function fuelForHud(fuel: number): number {
  return Math.min(BALANCE.maxFuel, Math.max(0, Math.ceil(fuel)));
}
