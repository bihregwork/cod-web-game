import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchScores, submitScore } from "../../src/services/leaderboardApi";
import { readPendingScore } from "../../src/services/pendingScore";
import type { ScoreEntry } from "../../src/game/types";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const entry: ScoreEntry = {
  playerId: "0d1872e2-1421-4ad6-8a34-71e184cdb36a",
  name: "Андрей",
  score: 123000,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

describe("leaderboard API service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches scores from the API contract", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          scores: [{ rank: 1, name: "Андрей", score: 123000, updatedAt: entry.updatedAt, isCurrentPlayer: true }],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchScores(entry.playerId)).resolves.toMatchObject([{ rank: 1, name: "Андрей", isCurrentPlayer: true }]);
    expect(fetchMock).toHaveBeenCalledWith("/.netlify/functions/scores?playerId=0d1872e2-1421-4ad6-8a34-71e184cdb36a");
  });

  it("submits a score and returns save status", async () => {
    vi.stubGlobal("window", { localStorage: new MemoryStorage() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            accepted: true,
            personalBestUpdated: true,
            nameUpdated: true,
            inTop10: true,
            rank: 1,
            scores: [{ rank: 1, name: "Андрей", score: 123000, updatedAt: entry.updatedAt, isCurrentPlayer: true }],
          }),
        ),
      ),
    );

    await expect(submitScore(entry)).resolves.toMatchObject({ accepted: true, rank: 1 });
  });

  it("keeps a pending score when the API is unavailable", async () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("fail", { status: 503 })));

    await expect(submitScore(entry)).rejects.toThrow();
    expect(readPendingScore(storage)).toMatchObject({ playerId: entry.playerId, score: 123000 });
  });
});
