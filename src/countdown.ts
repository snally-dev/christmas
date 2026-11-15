export type ChristmasMode = "countdown" | "christmas" | "after-christmas";

export interface ChristmasState {
  mode: ChristmasMode;
  daysRemaining: number | null;
  message: string;
  targetYear: number;
}

const MILLISECONDS_PER_DAY = 86_400_000;

/** An integer day index made from local calendar fields, so DST cannot skew the result. */
export function localCalendarDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MILLISECONDS_PER_DAY;
}

export function getChristmasState(date: Date): ChristmasState {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (month === 11 && day === 25) {
    return {
      mode: "christmas",
      daysRemaining: null,
      message: "Merry Christmas!",
      targetYear: year,
    };
  }

  if (month === 11 && day > 25) {
    return {
      mode: "after-christmas",
      daysRemaining: null,
      message: "See you next Christmas!",
      targetYear: year + 1,
    };
  }

  const christmasDay = new Date(year, 11, 25);
  return {
    mode: "countdown",
    daysRemaining: localCalendarDay(christmasDay) - localCalendarDay(date),
    message: "",
    targetYear: year,
  };
}
