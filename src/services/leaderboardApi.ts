import type { LeaderboardEntry, ScoreEntry } from "../game/types";
import { clearPendingScore, savePendingScore } from "./pendingScore";

const SCORES_ENDPOINT = "/.netlify/functions/scores";

type ScoresResponse = {
  scores: LeaderboardEntry[];
};

export type SubmitScoreResponse = {
  accepted: boolean;
  personalBestUpdated: boolean;
  nameUpdated: boolean;
  inTop10: boolean;
  rank: number | null;
  scores: LeaderboardEntry[];
};

export async function fetchScores(playerId?: string): Promise<LeaderboardEntry[]> {
  const endpoint = playerId ? `${SCORES_ENDPOINT}?playerId=${encodeURIComponent(playerId)}` : SCORES_ENDPOINT;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Не удалось получить таблицу рекордов");
  }

  const payload = (await response.json()) as ScoresResponse;
  return Array.isArray(payload.scores) ? payload.scores : [];
}

export async function submitScore(score: ScoreEntry): Promise<SubmitScoreResponse> {
  try {
    const response = await fetch(SCORES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(score),
    });

    if (!response.ok) {
      throw new Error("Не удалось сохранить результат");
    }

    const payload = (await response.json()) as SubmitScoreResponse;
    clearPendingScore();
    return payload;
  } catch (error) {
    savePendingScore(score);
    throw error instanceof Error ? error : new Error("Не удалось сохранить результат");
  }
}
