import type { ScoreEntry } from "../game/types";
import { normalizeLeaderboard, upsertScore, type LeaderboardUpdateResult } from "../game/systems/leaderboard";

const LOCAL_SCORES_KEY = "cod-web-game:localScores";

export function readLocalScores(storage: Storage = window.localStorage): ScoreEntry[] {
  return normalizeLeaderboard(readAllLocalScores(storage));
}

export function submitLocalScore(score: ScoreEntry, storage: Storage = window.localStorage): LeaderboardUpdateResult {
  const result = upsertScore(readAllLocalScores(storage), score);
  storage.setItem(LOCAL_SCORES_KEY, JSON.stringify(result.allScores));
  return result;
}

function readAllLocalScores(storage: Storage): ScoreEntry[] {
  const raw = storage.getItem(LOCAL_SCORES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isScoreEntry);
  } catch {
    return [];
  }
}

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<ScoreEntry>;
  return (
    typeof entry.playerId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.score === "number" &&
    Number.isFinite(entry.score) &&
    typeof entry.createdAt === "string" &&
    typeof entry.updatedAt === "string"
  );
}
