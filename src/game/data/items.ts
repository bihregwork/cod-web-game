import type { GameItem } from "../types";
import { ASSETS } from "./assets";

export const GAME_ITEMS: GameItem[] = [
  { id: "bill500", label: "500", kind: "reward", asset: ASSETS.items.bill500, points: 500, weight: 22 },
  { id: "bill1000", label: "1000", kind: "reward", asset: ASSETS.items.bill1000, points: 1000, weight: 16 },
  { id: "bill5000", label: "5000", kind: "reward", asset: ASSETS.items.bill5000, points: 5000, weight: 8 },
  { id: "mirror", label: "Зеркало", kind: "reward", asset: ASSETS.items.mirror, points: 10_000, weight: 7 },
  { id: "hallway", label: "Прихожая", kind: "reward", asset: ASSETS.items.hallway, points: 20_000, weight: 5 },
  { id: "kitchen", label: "Кухня", kind: "reward", asset: ASSETS.items.kitchen, points: 50_000, weight: 3 },
  { id: "contract", label: "Договор", kind: "reward", asset: ASSETS.items.contract, points: 100_000, weight: 2 },
  { id: "tax", label: "ФНС", kind: "hazard", asset: ASSETS.items.tax, points: 0, weight: 3 },
  { id: "fine", label: "ДПС", kind: "hazard", asset: ASSETS.items.fine, points: 0, weight: 2 },
  { id: "wheel", label: "Колесо", kind: "carPart", asset: ASSETS.items.wheel, points: 0, weight: 2 },
  { id: "engine", label: "Двигатель", kind: "carPart", asset: ASSETS.items.engine, points: 0, weight: 1 },
  { id: "carBody", label: "Кузов", kind: "carPart", asset: ASSETS.items.carBody, points: 0, weight: 1 },
  { id: "fuelCan", label: "20 л", kind: "fuel", asset: ASSETS.items.fuelCan, points: 0, weight: 2 },
];

export const STARTUP_ITEMS = GAME_ITEMS.filter((item) =>
  ["bill5000", "contract", "tax", "kitchen", "fuelCan", "bill1000", "wheel"].includes(item.id),
);
