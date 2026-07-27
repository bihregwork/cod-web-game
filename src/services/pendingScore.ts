import type { ScoreEntry } from "../game/types";

const PENDING_SCORE_KEY = "cod-web-game:pendingScore";

export function savePendingScore(score: ScoreEntry, storage: Storage = window.localStorage): void {
  storage.setItem(PENDING_SCORE_KEY, JSON.stringify(score));
}

export function readPendingScore(storage: Storage = window.localStorage): ScoreEntry | null {
  const raw = storage.getItem(PENDING_SCORE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ScoreEntry;
  } catch {
    clearPendingScore(storage);
    return null;
  }
}

export function clearPendingScore(storage: Storage = window.localStorage): void {
  storage.removeItem(PENDING_SCORE_KEY);
}
