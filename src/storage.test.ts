import { describe, expect, it } from "vite-plus/test";

import { collectId, createEmptyState, mergeStates, normalizeState } from "./storage.ts";

describe("collection state", () => {
  it("collects a creature only once", () => {
    const first = collectId(createEmptyState(), 1, new Date("2026-12-01T13:00:00Z"));
    const second = collectId(first, 1, new Date("2026-12-02T13:00:00Z"));
    expect(second).toBe(first);
    expect(Object.keys(second.collected)).toEqual(["1"]);
  });

  it("rejects malformed and unsupported backups", () => {
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState({ version: 2, season: 2026, collected: {} })).toBeNull();
    expect(normalizeState({ version: 1, season: 2025, collected: {} })).toBeNull();
  });

  it("drops unknown IDs and malformed records", () => {
    const normalized = normalizeState({
      version: 1,
      season: 2026,
      collected: {
        1: { collectedAt: "2026-12-01T13:00:00.000Z" },
        26: { collectedAt: "2026-12-26T13:00:00.000Z" },
        4: { collectedAt: "not-a-date" },
      },
      preferences: { soundEnabled: false },
    });
    expect(normalized?.collected).toEqual({ 1: { collectedAt: "2026-12-01T13:00:00.000Z" } });
  });

  it("merges imported discoveries without discarding current ones", () => {
    const current = collectId(createEmptyState(), 1, new Date("2026-12-01T13:00:00Z"));
    const imported = collectId(createEmptyState(), 2, new Date("2026-12-02T13:00:00Z"));
    expect(Object.keys(mergeStates(current, imported).collected)).toEqual(["1", "2"]);
  });
});
