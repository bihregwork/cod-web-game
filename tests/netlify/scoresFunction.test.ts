import type { HandlerContext, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { beforeEach, describe, expect, it, vi } from "vitest";

const blobState = vi.hoisted(() => ({ data: null as unknown }));

vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    get: async () => blobState.data,
    setJSON: async (_key: string, value: unknown) => {
      blobState.data = value;
    },
  }),
}));

import { handler } from "../../netlify/functions/scores";

const playerId = "0d1872e2-1421-4ad6-8a34-71e184cdb36a";
const secondPlayerId = "122d47bf-17bd-46be-b12f-5f7dd1383cb4";

describe("scores Netlify Function", () => {
  beforeEach(() => {
    blobState.data = null;
  });

  it("returns the public API contract for GET", async () => {
    blobState.data = [
      {
        playerId,
        name: "Андрей",
        score: 1000,
        createdAt: "2026-07-23T10:00:00.000Z",
        updatedAt: "2026-07-23T10:00:00.000Z",
      },
    ];

    const response = await call("GET", null, { playerId });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect(body.scores).toMatchObject([{ rank: 1, name: "Андрей", score: 1000, isCurrentPlayer: true }]);
    expect(body.scores[0]).not.toHaveProperty("playerId");
  });

  it("stores only the best score for one player but updates the name", async () => {
    const first = await call("POST", { playerId, name: "Андрей", score: 1000 });
    const lower = await call("POST", { playerId, name: "Аня", score: 800 });
    const body = parseBody(lower);

    expect(first.statusCode).toBe(200);
    expect(body).toMatchObject({ accepted: true, personalBestUpdated: false, nameUpdated: true, inTop10: true, rank: 1 });
    expect(body.scores).toMatchObject([{ name: "Аня", score: 1000, isCurrentPlayer: true }]);
  });

  it("stores separate names when they use separate local player ids", async () => {
    await call("POST", { playerId, name: "Андрей", score: 1000 });
    const response = await call("POST", { playerId: secondPlayerId, name: "Анна", score: 900 });
    const body = parseBody(response);

    expect(body.scores).toMatchObject([
      { rank: 1, name: "Андрей", score: 1000, isCurrentPlayer: false },
      { rank: 2, name: "Анна", score: 900, isCurrentPlayer: true },
    ]);
  });

  it("rejects invalid payloads", async () => {
    const response = await call("POST", { playerId: "bad", name: "Андрей!", score: -1 });
    const body = parseBody(response);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects unsupported methods", async () => {
    const response = await call("PUT");

    expect(response.statusCode).toBe(405);
  });
});

async function call(method: string, body?: unknown, queryStringParameters: Record<string, string> | null = null): Promise<HandlerResponse> {
  const response = await handler(
    {
      httpMethod: method,
      body: body === undefined || body === null ? null : JSON.stringify(body),
      queryStringParameters,
    } as HandlerEvent,
    {} as HandlerContext,
  );
  if (!response) {
    throw new Error("Expected handler response");
  }
  return response;
}

function parseBody(response: HandlerResponse) {
  if (!response.body) {
    throw new Error("Expected JSON response body");
  }
  return JSON.parse(response.body);
}
