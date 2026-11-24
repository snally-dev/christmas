export const SEASON_YEAR = 2026;
export const TOTAL_DAYS = 25;
export const STORAGE_VERSION = 1;
export const STORAGE_KEY = `snally.christmas.${SEASON_YEAR}.v${STORAGE_VERSION}`;

export const ASSET_DIRECTORY = "assets/Christmas-Cryptids-2026";
export const DATA_URL = `${import.meta.env.BASE_URL}${ASSET_DIRECTORY}/christmas-cryptids-2026.json`;

/**
 * Development-only date override. Run `vp dev`, then add `?date=2026-12-05`
 * (or a full local date/time) to the URL. Production builds always use the
 * device clock, even if a date query parameter is present.
 */
export function getAppNow(): Date {
  if (import.meta.env.DEV) {
    const value = new URLSearchParams(window.location.search).get("date");
    if (value) {
      const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      const parsed = dateOnly
        ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12)
        : new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  return new Date();
}
