import { BALANCE } from "../data/balance";
import { GAME_ITEMS } from "../data/items";
import type { FallingItem, GameItem, GameState, ItemId } from "../types";
import { contractChance, fallSpeedMultiplier, hazardChance } from "./difficulty";
import { fuelSpawnChance, isCarAssembled } from "./machineBonus";

type SpawnContext = {
  state: GameState;
  level: number;
  stageWidth: number;
  stageHeight: number;
  lastContractElapsedMs: number;
  lastFuelElapsedMs?: number;
  lastCarPartElapsedMs?: number;
  elapsedMs: number;
  activeItems?: FallingItem[];
  random?: () => number;
};

export type SpawnZone = "left" | "center" | "right";

const ITEM_BY_ID = new Map(GAME_ITEMS.map((item) => [item.id, item]));
const BILLS: ItemId[] = ["bill500", "bill500", "bill500", "bill1000", "bill1000", "bill5000"];
const FURNITURE: ItemId[] = ["mirror", "mirror", "hallway", "hallway", "kitchen"];
const SPAWN_ZONES: SpawnZone[] = ["left", "center", "right"];
const SINGLE_ACTIVE_ITEM_IDS = new Set<ItemId>(["contract", "kitchen", "carBody"]);

export function pickWeightedItem(random = Math.random): GameItem {
  const total = GAME_ITEMS.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of GAME_ITEMS) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item;
    }
  }
  return GAME_ITEMS[0];
}

export function createFallingItem(context: SpawnContext): FallingItem {
  const random = context.random ?? Math.random;
  const item = pickSpawnItem(context);
  const size = itemSize(item.id, context.stageWidth);
  const speed = itemFallSpeed(item.id, context.level, context.stageHeight);

  return {
    uid: `${item.id}-${Math.round(context.elapsedMs)}-${Math.floor(random() * 1_000_000)}`,
    item,
    x: spawnXForItem(item, size, context, random),
    y: -size - random() * 80,
    size,
    speed,
    rotation: random() * 24 - 12,
    rotationSpeed: random() * 60 - 30,
  };
}

export function pickSpawnItem(context: SpawnContext): GameItem {
  const random = context.random ?? Math.random;
  const state = context.state;
  const activeItems = context.activeItems ?? [];
  if (shouldForceFuelCan(context, activeItems)) {
    return requireItem("fuelCan");
  }

  const canSpawnContract = context.elapsedMs - context.lastContractElapsedMs >= 8_000 && canSpawnSingleActiveItem("contract", activeItems);
  const contractBoost = context.elapsedMs - context.lastContractElapsedMs >= 30_000 ? 0.04 : 0;
  const contractRollChance = canSpawnContract ? contractChance(context.level) + contractBoost : 0;
  const roll = random();

  if (roll < contractRollChance) {
    return requireItem("contract");
  }

  let cursor = contractRollChance;
  const hazardRollChance = hazardChance(context.level);
  if (roll < cursor + hazardRollChance) {
    return random() < BALANCE.hazards.taxShare ? requireItem("tax") : requireItem("fine");
  }
  cursor += hazardRollChance;

  const fuelChance = fuelSpawnChance(state);
  if (roll < cursor + fuelChance) {
    return requireItem("fuelCan");
  }
  cursor += fuelChance;

  const carPartChance =
    availableMissingCarParts(state, activeItems).length > 0 && canSpawnCarPartByTime(context)
      ? carPartSpawnChance(state, context.level)
      : 0;
  if (roll < cursor + carPartChance) {
    return pickMissingCarPart(state, random, activeItems);
  }

  return random() < 0.78 ? requireItem(pickFrom(BILLS, random)) : pickFurnitureItem(activeItems, random);
}

export function shouldForceFuelCan(context: SpawnContext, activeItems = context.activeItems ?? []): boolean {
  if (context.state.mode !== "car" || context.state.fuel > BALANCE.fuelSpawn.pityThresholdLiters) {
    return false;
  }

  if (activeItems.some((item) => item.item.id === "fuelCan")) {
    return false;
  }

  const lastFuelElapsedMs = context.lastFuelElapsedMs ?? 0;
  return context.elapsedMs - lastFuelElapsedMs >= BALANCE.fuelSpawn.pityTimerMs;
}

export function carPartSpawnChance(state: Pick<GameState, "carParts" | "mode">, level: number): number {
  if (isCarAssembled(state) || state.mode === "car") {
    return 0;
  }
  if (level <= 10) {
    return BALANCE.carParts.spawnChanceLevel1To10;
  }
  if (level <= 20) {
    return BALANCE.carParts.spawnChanceLevel11To20;
  }
  if (level <= 30) {
    return BALANCE.carParts.spawnChanceLevel21To30;
  }
  return BALANCE.carParts.spawnChanceLevel31To40;
}

export function canSpawnCarPartByTime(context: Pick<SpawnContext, "elapsedMs" | "lastCarPartElapsedMs">): boolean {
  const lastCarPartElapsedMs = context.lastCarPartElapsedMs ?? -BALANCE.carParts.minSpawnGapMs;
  return context.elapsedMs - lastCarPartElapsedMs >= BALANCE.carParts.minSpawnGapMs;
}

export function itemSize(itemId: ItemId, stageWidth: number): number {
  const mobileScale = stageWidth < 760 ? 0.76 : 1;
  const baseSize: Record<ItemId, number> = {
    bill500: 76,
    bill1000: 86,
    bill5000: 96,
    contract: 86,
    mirror: 96,
    hallway: 108,
    kitchen: 122,
    tax: 82,
    fine: 82,
    wheel: 76,
    engine: 86,
    carBody: 104,
    fuelCan: 82,
  };
  return Math.round(baseSize[itemId] * mobileScale);
}

export function itemFallSpeed(itemId: ItemId, level: number, stageHeight: number): number {
  const stageScale = Math.max(0.78, Math.min(1.1, stageHeight / 810));
  const heavyItemBonus = itemId === "kitchen" || itemId === "hallway" || itemId === "carBody" ? 0.84 : 1;
  const fuelCanBonus = itemId === "fuelCan" ? BALANCE.fallingItems.fuelCanSpeedMultiplier : 1;
  return BALANCE.fallingItems.baseFallSpeedPxPerSecond * stageScale * fallSpeedMultiplier(level) * heavyItemBonus * fuelCanBonus;
}

export function availableCatchableSpawnZones(activeItems: FallingItem[], stageWidth: number): SpawnZone[] {
  const zones = new Set<SpawnZone>(SPAWN_ZONES);

  for (const activeItem of activeItems) {
    if (activeItem.item.kind === "hazard") {
      continue;
    }

    const zone = zoneForFallingItem(activeItem, stageWidth);
    if (zone === "left") {
      zones.delete("right");
    }
    if (zone === "right") {
      zones.delete("left");
    }
  }

  return SPAWN_ZONES.filter((zone) => zones.has(zone));
}

function pickMissingCarPart(state: Pick<GameState, "carParts">, random: () => number, activeItems: FallingItem[]): GameItem {
  const missing = availableMissingCarParts(state, activeItems);
  return requireItem(pickFrom(missing, random));
}

function availableMissingCarParts(state: Pick<GameState, "carParts">, activeItems: FallingItem[]): ItemId[] {
  const missing: ItemId[] = [];
  if (state.carParts.wheels < 4) {
    missing.push("wheel", "wheel");
  }
  if (!state.carParts.engine) {
    missing.push("engine");
  }
  if (!state.carParts.body && canSpawnSingleActiveItem("carBody", activeItems)) {
    missing.push("carBody");
  }
  return missing;
}

function pickFurnitureItem(activeItems: FallingItem[], random: () => number): GameItem {
  const availableFurniture = FURNITURE.filter((itemId) => canSpawnSingleActiveItem(itemId, activeItems));
  return requireItem(pickFrom(availableFurniture, random));
}

function canSpawnSingleActiveItem(itemId: ItemId, activeItems: FallingItem[]): boolean {
  return !SINGLE_ACTIVE_ITEM_IDS.has(itemId) || !activeItems.some((item) => item.item.id === itemId);
}

function spawnXForItem(item: GameItem, size: number, context: SpawnContext, random: () => number): number {
  if (item.kind === "hazard") {
    return randomX(size, context.stageWidth, random);
  }

  const zones = availableCatchableSpawnZones(context.activeItems ?? [], context.stageWidth);
  const zone = pickFrom(zones, random);
  return randomXInZone(zone, size, context.stageWidth, random);
}

function randomX(size: number, stageWidth: number, random: () => number): number {
  return random() * Math.max(1, stageWidth - size);
}

function randomXInZone(zone: SpawnZone, size: number, stageWidth: number, random: () => number): number {
  const zoneIndex = SPAWN_ZONES.indexOf(zone);
  const minCenterX = (zoneIndex / SPAWN_ZONES.length) * stageWidth;
  const maxCenterX = ((zoneIndex + 1) / SPAWN_ZONES.length) * stageWidth;
  const maxItemX = Math.max(1, stageWidth - size);
  const minX = Math.max(0, minCenterX - size / 2);
  const maxX = Math.min(maxItemX, maxCenterX - size / 2);

  if (maxX <= minX) {
    return randomX(size, stageWidth, random);
  }

  return minX + random() * (maxX - minX);
}

function zoneForFallingItem(item: FallingItem, stageWidth: number): SpawnZone {
  const center = (item.x + item.size / 2) / stageWidth;
  if (center < 1 / 3) {
    return "left";
  }
  if (center > 2 / 3) {
    return "right";
  }
  return "center";
}

function pickFrom<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function requireItem(itemId: ItemId): GameItem {
  const item = ITEM_BY_ID.get(itemId);
  if (!item) {
    throw new Error(`Unknown game item: ${itemId}`);
  }
  return item;
}
