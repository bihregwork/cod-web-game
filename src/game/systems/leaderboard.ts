import type { ScoreEntry } from "../types";

export const LEADERBOARD_LIMIT = 10;

export type LeaderboardUpdateResult = {
  allScores: ScoreEntry[];
  scores: ScoreEntry[];
  personalBestUpdated: boolean;
  nameUpdated: boolean;
  inTop10: boolean;
  rank: number | null;
};

export function normalizeLeaderboard(scores: ScoreEntry[], limit = LEADERBOARD_LIMIT): ScoreEntry[] {
  return mergeBestScores(scores).slice(0, limit);
}

export function mergeBestScores(scores: ScoreEntry[]): ScoreEntry[] {
  const bestByPlayer = new Map<string, ScoreEntry>();
  for (const entry of scores) {
    const current = bestByPlayer.get(entry.playerId);
    if (!current || entry.score > current.score || (entry.score === current.score && timestamp(entry.createdAt) < timestamp(current.createdAt))) {
      bestByPlayer.set(entry.playerId, entry);
      continue;
    }

    if (entry.name !== current.name) {
      bestByPlayer.set(entry.playerId, {
        ...current,
        name: entry.name,
        updatedAt: entry.updatedAt,
      });
    }
  }
  return sortScores([...bestByPlayer.values()]);
}

export function upsertScore(scores: ScoreEntry[], incoming: ScoreEntry, limit = LEADERBOARD_LIMIT): LeaderboardUpdateResult {
  const allScores = mergeBestScores(scores);
  const current = allScores.find((entry) => entry.playerId === incoming.playerId);
  const personalBestUpdated = !current || incoming.score > current.score;
  const nameUpdated = !current || incoming.name !== current.name;

  const nextEntry =
    !current || incoming.score > current.score
      ? incoming
      : {
          ...current,
          name: incoming.name,
          updatedAt: incoming.updatedAt,
        };

  const withoutCurrentPlayer = allScores.filter((entry) => entry.playerId !== incoming.playerId);
  const nextAllScores = sortScores([...withoutCurrentPlayer, nextEntry]);
  const topScores = nextAllScores.slice(0, limit);
  const topIndex = topScores.findIndex((entry) => entry.playerId === incoming.playerId);

  return {
    allScores: nextAllScores,
    scores: topScores,
    personalBestUpdated,
    nameUpdated,
    inTop10: topIndex >= 0,
    rank: topIndex >= 0 ? topIndex + 1 : null,
  };
}

function sortScores(scores: ScoreEntry[]): ScoreEntry[] {
  return [...scores].sort((a, b) => b.score - a.score || timestamp(a.createdAt) - timestamp(b.createdAt));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
