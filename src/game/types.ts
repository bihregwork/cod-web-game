export type GameMode = "idle" | "countdown" | "playing" | "car" | "paused" | "leaderboard" | "gameOver";

export type ItemKind = "reward" | "hazard" | "carPart" | "fuel";

export type ItemId =
  | "bill500"
  | "bill1000"
  | "bill5000"
  | "contract"
  | "mirror"
  | "hallway"
  | "kitchen"
  | "tax"
  | "fine"
  | "wheel"
  | "engine"
  | "carBody"
  | "fuelCan";

export type CarPartId = "wheel" | "engine" | "body";

export type GameItem = {
  id: ItemId;
  label: string;
  kind: ItemKind;
  asset: string;
  points: number;
  weight: number;
};

export type GameState = {
  mode: GameMode;
  score: number;
  lives: number;
  fuel: number;
  missedCatchableItems: number;
  carParts: {
    wheels: number;
    engine: boolean;
    body: boolean;
  };
};

export type FallingItem = {
  uid: string;
  item: GameItem;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
};

export type FloatingTextKind = "score" | "penalty" | "life" | "bonus";

export type FloatingText = {
  uid: string;
  text: string;
  x: number;
  y: number;
  ageMs: number;
  kind: FloatingTextKind;
};

export type ScoreEntry = {
  playerId: string;
  name: string;
  score: number;
  createdAt: string;
  updatedAt: string;
};

export type LeaderboardEntry = {
  playerId?: string;
  rank?: number;
  name: string;
  score: number;
  updatedAt: string;
  isCurrentPlayer?: boolean;
};
