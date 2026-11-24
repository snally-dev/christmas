import { SEASON_YEAR, TOTAL_DAYS } from "./config.ts";

const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

export type SeasonPhase = "before" | "active" | "after";

export interface SeasonDateState {
  phase: SeasonPhase;
  availableThrough: number;
  todayDay: number | null;
}

export interface CountdownState {
  label: string;
  target: Date | null;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** An integer made from local calendar fields, so DST cannot skew day comparisons. */
export function localCalendarDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MILLISECONDS_PER_DAY;
}

export function getSeasonDateState(now: Date): SeasonDateState {
  const firstDay = new Date(SEASON_YEAR, 11, 1);
  const finalDay = new Date(SEASON_YEAR, 11, TOTAL_DAYS);
  const dayIndex = localCalendarDay(now);

  if (dayIndex < localCalendarDay(firstDay)) {
    return { phase: "before", availableThrough: 0, todayDay: null };
  }

  if (dayIndex > localCalendarDay(finalDay)) {
    return { phase: "after", availableThrough: TOTAL_DAYS, todayDay: null };
  }

  const day = Math.min(TOTAL_DAYS, now.getDate());
  return { phase: "active", availableThrough: day, todayDay: day };
}

export function isDayAvailable(day: number, now: Date): boolean {
  return day >= 1 && day <= getSeasonDateState(now).availableThrough;
}

function splitDuration(target: Date, now: Date): Omit<CountdownState, "label" | "target"> {
  let remaining = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(remaining / MILLISECONDS_PER_DAY);
  remaining %= MILLISECONDS_PER_DAY;
  const hours = Math.floor(remaining / MILLISECONDS_PER_HOUR);
  remaining %= MILLISECONDS_PER_HOUR;
  const minutes = Math.floor(remaining / MILLISECONDS_PER_MINUTE);
  remaining %= MILLISECONDS_PER_MINUTE;
  return { days, hours, minutes, seconds: Math.floor(remaining / MILLISECONDS_PER_SECOND) };
}

export function getCountdownState(now: Date): CountdownState {
  const season = getSeasonDateState(now);

  if (season.phase === "before") {
    const target = new Date(SEASON_YEAR, 11, 1);
    return { label: "Until the first mystery", target, ...splitDuration(target, now) };
  }

  if (season.phase === "active" && season.todayDay !== TOTAL_DAYS) {
    const target = new Date(SEASON_YEAR, 11, season.todayDay! + 1);
    return { label: "Until the next mystery", target, ...splitDuration(target, now) };
  }

  return {
    label:
      season.phase === "active" ? "The final mystery has arrived" : "All mysteries are unlocked",
    target: null,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
}

export function getChristmasCountdownState(now: Date): CountdownState {
  const target = new Date(SEASON_YEAR, 11, TOTAL_DAYS);
  if (now.getTime() >= target.getTime()) {
    return {
      label: "Christmas Day has arrived",
      target: null,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }
  return { label: "Until Christmas Day", target, ...splitDuration(target, now) };
}

export function formatUnlockDate(day: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(SEASON_YEAR, 11, day));
}

export function millisecondsUntilNextLocalMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(1_000, next.getTime() - now.getTime() + 250);
}
