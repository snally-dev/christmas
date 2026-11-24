import { SEASON_YEAR, STORAGE_KEY, STORAGE_VERSION, TOTAL_DAYS } from "./config.ts";
import type { CollectionState, CollectedRecord } from "./types.ts";

export interface StorageController {
  available: boolean;
  read: () => CollectionState;
  write: (state: CollectionState) => boolean;
  clear: () => boolean;
}

export function createEmptyState(): CollectionState {
  return {
    version: STORAGE_VERSION,
    season: SEASON_YEAR,
    collected: {},
    preferences: { soundEnabled: false },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

export function normalizeState(value: unknown): CollectionState | null {
  if (!isRecord(value) || value.version !== STORAGE_VERSION || value.season !== SEASON_YEAR)
    return null;
  if (!isRecord(value.collected)) return null;

  const collected: Record<string, CollectedRecord> = {};
  for (const [key, record] of Object.entries(value.collected)) {
    const id = Number(key);
    if (!Number.isInteger(id) || id < 1 || id > TOTAL_DAYS || !isRecord(record)) continue;
    if (!isValidIsoTimestamp(record.collectedAt)) continue;
    collected[String(id)] = { collectedAt: record.collectedAt };
  }

  const preferences = isRecord(value.preferences)
    ? { soundEnabled: value.preferences.soundEnabled === true }
    : { soundEnabled: false };

  return { version: STORAGE_VERSION, season: SEASON_YEAR, collected, preferences };
}

export function mergeStates(current: CollectionState, imported: CollectionState): CollectionState {
  return {
    ...current,
    collected: { ...imported.collected, ...current.collected },
  };
}

export function collectId(
  state: CollectionState,
  id: number,
  collectedAt = new Date(),
): CollectionState {
  const key = String(id);
  if (state.collected[key] || !Number.isInteger(id) || id < 1 || id > TOTAL_DAYS) return state;
  return {
    ...state,
    collected: { ...state.collected, [key]: { collectedAt: collectedAt.toISOString() } },
  };
}

export function getCollectedIds(state: CollectionState): Set<number> {
  return new Set(Object.keys(state.collected).map(Number));
}

export function createStorageController(): StorageController {
  let memoryState = createEmptyState();
  let available = false;

  try {
    const probe = `${STORAGE_KEY}.probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }

  return {
    get available() {
      return available;
    },
    read() {
      if (!available) return memoryState;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return createEmptyState();
        return normalizeState(JSON.parse(raw)) ?? createEmptyState();
      } catch {
        return createEmptyState();
      }
    },
    write(state) {
      memoryState = state;
      if (!available) return false;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch {
        available = false;
        return false;
      }
    },
    clear() {
      memoryState = createEmptyState();
      if (!available) return false;
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        return true;
      } catch {
        available = false;
        return false;
      }
    },
  };
}
