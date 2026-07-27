import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";

import { normalizeLeaderboard, upsertScore } from "../../src/game/systems/leaderboard";
import type { LeaderboardEntry, ScoreEntry } from "../../src/game/types";

const STORE_NAME = "scores";
const SCORES_KEY = "leaderboard";
const MAX_SCORE = 999_999_999;
const PLAYER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLAYER_NAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;

export const handler: Handler = async (event) => {
  try {
    const store = getStore(STORE_NAME);
    const current = await readScores(store);

    if (event.httpMethod === "GET") {
      return json({ scores: publicScores(normalizeLeaderboard(current), event.queryStringParameters?.playerId) });
    }

    if (event.httpMethod !== "POST") {
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Метод не поддерживается" } }, 405);
    }

    const entry = parseScore(event.body);
    if (!entry) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Некорректные данные результата" } }, 400);
    }

    const result = upsertScore(current, entry);
    await store.setJSON(SCORES_KEY, result.allScores);
    return json({
      accepted: true,
      personalBestUpdated: result.personalBestUpdated,
      nameUpdated: result.nameUpdated,
      inTop10: result.inTop10,
      rank: result.rank,
      scores: publicScores(result.scores, entry.playerId),
    });
  } catch {
    return json({ error: { code: "STORAGE_ERROR", message: "Таблица рекордов временно недоступна" } }, 500);
  }
};

function parseScore(body: string | null): ScoreEntry | null {
  if (!body) {
    return null;
  }
  let value: Partial<ScoreEntry>;
  try {
    value = JSON.parse(body) as Partial<ScoreEntry>;
  } catch {
    return null;
  }

  const playerId = typeof value.playerId === "string" ? value.playerId.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const score = value.score;
  if (
    !PLAYER_ID_PATTERN.test(playerId) ||
    !PLAYER_NAME_PATTERN.test(name) ||
    name.length < 1 ||
    name.length > 20 ||
    !Number.isInteger(score) ||
    typeof score !== "number" ||
    score < 0 ||
    score > MAX_SCORE
  ) {
    return null;
  }

  const now = new Date().toISOString();
  return {
    playerId,
    name,
    score,
    createdAt: now,
    updatedAt: now,
  };
}

async function readScores(store: ReturnType<typeof getStore>): Promise<ScoreEntry[]> {
  const stored = await store.get(SCORES_KEY, { type: "json" });
  return Array.isArray(stored) ? stored.filter(isScoreEntry) : [];
}

function isScoreEntry(entry: unknown): entry is ScoreEntry {
  if (!entry || typeof entry !== "object") {
    return false;
  }
  const candidate = entry as Partial<ScoreEntry>;
  return (
    typeof candidate.playerId === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

function publicScores(scores: ScoreEntry[], currentPlayerId?: string): LeaderboardEntry[] {
  return scores.map((entry, index) => ({
    rank: index + 1,
    name: entry.name,
    score: entry.score,
    updatedAt: entry.updatedAt,
    isCurrentPlayer: entry.playerId === currentPlayerId,
  }));
}

function json(body: unknown, statusCode = 200) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}
