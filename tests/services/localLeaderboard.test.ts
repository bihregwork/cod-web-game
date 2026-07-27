import { describe, expect, it } from "vitest";

import { readLocalScores, submitLocalScore } from "../../src/services/localLeaderboard";
import { getOrCreatePlayerProfile, getPlayerName, readPlayerProfiles, savePlayerName, validatePlayerName } from "../../src/services/playerIdentity";
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

function score(playerId: string, name: string, value: number): ScoreEntry {
  return {
    playerId,
    name,
    score: value,
    createdAt: "2026-07-23T10:00:00.000Z",
    updatedAt: "2026-07-23T10:00:00.000Z",
  };
}

describe("local leaderboard storage", () => {
  it("stores scores in local storage and returns top scores", () => {
    const storage = new MemoryStorage();

    submitLocalScore(score("player-1", "Анна", 1000), storage);

    expect(readLocalScores(storage)).toMatchObject([{ playerId: "player-1", name: "Анна", score: 1000 }]);
  });

  it("keeps personal best while allowing name changes", () => {
    const storage = new MemoryStorage();

    submitLocalScore(score("player-1", "Анна", 1000), storage);
    const result = submitLocalScore(score("player-1", "Аня", 800), storage);

    expect(result.personalBestUpdated).toBe(false);
    expect(readLocalScores(storage)).toMatchObject([{ playerId: "player-1", name: "Аня", score: 1000 }]);
  });
});

describe("player name storage", () => {
  it("saves a normalized player name", () => {
    const storage = new MemoryStorage();

    expect(savePlayerName("  Андрей   Б  ", storage)).toBe("Андрей Б");
    expect(getPlayerName(storage)).toBe("Андрей Б");
  });

  it("creates separate local player profiles for different names on one device", () => {
    const storage = new MemoryStorage();

    const first = getOrCreatePlayerProfile("Андрей", storage);
    const second = getOrCreatePlayerProfile("Анна", storage);

    expect(second.playerId).not.toBe(first.playerId);
    expect(readPlayerProfiles(storage)).toHaveLength(2);
  });

  it("reuses an existing local player profile for the same name", () => {
    const storage = new MemoryStorage();

    const first = getOrCreatePlayerProfile("Андрей", storage);
    const same = getOrCreatePlayerProfile("  андрей  ", storage);

    expect(same.playerId).toBe(first.playerId);
    expect(readPlayerProfiles(storage)).toHaveLength(1);
  });

  it("rejects unsupported characters", () => {
    expect(validatePlayerName("Андрей!").valid).toBe(false);
  });
});
