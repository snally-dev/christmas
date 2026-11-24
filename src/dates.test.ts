import { describe, expect, it } from "vite-plus/test";

import {
  getChristmasCountdownState,
  getCountdownState,
  getSeasonDateState,
  isDayAvailable,
  localCalendarDay,
} from "./dates.ts";

describe("2026 advent unlocking", () => {
  it("keeps every door locked on November 30", () => {
    expect(getSeasonDateState(new Date(2026, 10, 30, 23, 59))).toEqual({
      phase: "before",
      availableThrough: 0,
      todayDay: null,
    });
  });

  it("unlocks only day 1 on December 1", () => {
    expect(isDayAvailable(1, new Date(2026, 10, 30, 23, 59, 59))).toBe(false);
    const date = new Date(2026, 11, 1, 0, 0);
    expect(getSeasonDateState(date)).toEqual({ phase: "active", availableThrough: 1, todayDay: 1 });
    expect(isDayAvailable(1, date)).toBe(true);
    expect(isDayAvailable(2, date)).toBe(false);
  });

  it("keeps days 1 through 5 available on December 5", () => {
    const date = new Date(2026, 11, 5, 18);
    expect(getSeasonDateState(date).availableThrough).toBe(5);
    expect(isDayAvailable(5, date)).toBe(true);
    expect(isDayAvailable(6, date)).toBe(false);
  });

  it("unlocks all doors on and after December 25", () => {
    expect(getSeasonDateState(new Date(2026, 11, 25)).availableThrough).toBe(25);
    expect(getSeasonDateState(new Date(2026, 11, 26)).availableThrough).toBe(25);
    expect(getSeasonDateState(new Date(2027, 0, 1)).availableThrough).toBe(25);
  });

  it("counts down to the first and next discoveries", () => {
    expect(getCountdownState(new Date(2026, 10, 30, 23, 59, 57))).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 3,
    });
    expect(getCountdownState(new Date(2026, 11, 5, 23, 59, 57))).toMatchObject({
      label: "Until the next mystery",
      seconds: 3,
    });
  });

  it("keeps a separate countdown to local midnight on Christmas Day", () => {
    expect(getChristmasCountdownState(new Date(2026, 11, 24, 23, 59, 57))).toMatchObject({
      label: "Until Christmas Day",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 3,
    });
    expect(getChristmasCountdownState(new Date(2026, 11, 25, 0, 0)).target).toBeNull();
  });

  it("uses local calendar days across DST boundaries", () => {
    expect(
      localCalendarDay(new Date(2026, 2, 8, 23)) - localCalendarDay(new Date(2026, 2, 7, 23)),
    ).toBe(1);
    expect(
      localCalendarDay(new Date(2026, 10, 1, 23)) - localCalendarDay(new Date(2026, 9, 31, 23)),
    ).toBe(1);
  });
});
