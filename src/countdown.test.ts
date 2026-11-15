import { describe, expect, it } from "vite-plus/test";

import { getChristmasState, localCalendarDay } from "./countdown.ts";

describe("Christmas countdown", () => {
  it("shows one day throughout Christmas Eve", () => {
    expect(getChristmasState(new Date(2026, 11, 24, 23, 59))).toMatchObject({
      mode: "countdown",
      daysRemaining: 1,
      targetYear: 2026,
    });
  });

  it("shows the Christmas greeting throughout December 25", () => {
    expect(getChristmasState(new Date(2026, 11, 25, 18, 30))).toMatchObject({
      mode: "christmas",
      message: "Merry Christmas!",
    });
  });

  it("shows the return message from December 26 through 31", () => {
    expect(getChristmasState(new Date(2026, 11, 26))).toMatchObject({
      mode: "after-christmas",
      targetYear: 2027,
    });
    expect(getChristmasState(new Date(2026, 11, 31))).toMatchObject({
      mode: "after-christmas",
      targetYear: 2027,
    });
  });

  it("starts the new countdown on January 1", () => {
    expect(getChristmasState(new Date(2027, 0, 1, 12))).toMatchObject({
      mode: "countdown",
      daysRemaining: 358,
      targetYear: 2027,
    });
  });

  it("advances one calendar day across DST boundaries", () => {
    expect(
      localCalendarDay(new Date(2026, 2, 8, 23)) - localCalendarDay(new Date(2026, 2, 7, 23)),
    ).toBe(1);
    expect(
      localCalendarDay(new Date(2026, 10, 1, 23)) - localCalendarDay(new Date(2026, 9, 31, 23)),
    ).toBe(1);
  });
});
