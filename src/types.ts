export interface Cryptid {
  id: number;
  title: string;
  description: string;
  image: string;
}

export interface CollectedRecord {
  collectedAt: string;
}

export interface CollectionState {
  version: 1;
  season: number;
  collected: Record<string, CollectedRecord>;
  preferences: {
    soundEnabled: boolean;
  };
}

export type DoorState = "locked" | "available" | "collected";
export type CollectionFilter = "all" | "collected" | "undiscovered";
