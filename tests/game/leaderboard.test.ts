import { describe, expect, it } from "vitest";

import { normalizeLeaderboard, upsertScore } from "../../src/game/systems/leaderboard";
import type { ScoreEntry } from "../../src/game/types";

function score(playerId: string, name: string, value: number, createdAt: string): ScoreEntry {
  return {
    playerId,
    name,
    score: value,
    createdAt,
    updatedAt: createdAt,
  };
}

describe("leaderboard rules", () => {
  it("keeps only the best score for one player", () => {
    const scores = normalizeLeaderboard([
      score("player-1", "Анна", 1000, "2026-07-23T10:00:00.000Z"),
      score("player-1", "Анна", 900, "2026-07-23T10:01:00.000Z"),
    ]);

    expect(scores).toHaveLength(1);
    expect(scores[0].score).toBe(1000);
  });

  it("updates player name even when the new score is lower", () => {
    const result = upsertScore(
      [score("player-1", "Анна", 1000, "2026-07-23T10:00:00.000Z")],
      score("player-1", "Аня", 900, "2026-07-23T10:02:00.000Z"),
    );

    expect(result.personalBestUpdated).toBe(false);
    expect(result.nameUpdated).toBe(true);
    expect(result.scores[0]).toMatchObject({ name: "Аня", score: 1000 });
  });

  it("sorts by score descending and earlier result first on ties", () => {
    const scores = normalizeLeaderboard([
      score("player-2", "Борис", 2000, "2026-07-23T10:02:00.000Z"),
      score("player-1", "Анна", 2000, "2026-07-23T10:00:00.000Z"),
    ]);

    expect(scores.map((entry) => entry.playerId)).toEqual(["player-1", "player-2"]);
  });

  it("returns only top 10 scores", () => {
    const scores = Array.from({ length: 12 }, (_, index) => score(`player-${index}`, `Игрок ${index}`, index, `2026-07-23T10:${index.toString().padStart(2, "0")}:00.000Z`));

    expect(normalizeLeaderboard(scores)).toHaveLength(10);
  });
});
