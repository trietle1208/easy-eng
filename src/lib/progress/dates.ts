/** Pure timezone / calendar helpers (no DB, safe for unit tests). */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date `YYYY-MM-DD` in the given IANA timezone. */
export function localDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Local hour 0–23 in the given timezone. */
export function localHour(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  return Number(hour ?? 0);
}

/** Add (or subtract) whole calendar days from a `YYYY-MM-DD` string. */
export function addDays(isoDate: string, days: number): string {
  if (!DATE_RE.test(isoDate)) {
    throw new Error(`Invalid date: ${isoDate}`);
  }
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

/** Inclusive day difference: `to - from` in calendar days. */
export function diffDays(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00.000Z`);
  const b = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Monday-start ISO week containing `isoDate`.
 * Returns the Monday `YYYY-MM-DD`.
 */
export function startOfWeekMonday(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay(); // 0 Sun … 6 Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday for a `YYYY-MM-DD` (calendar, not TZ). */
export function weekdayIndexMonday(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function weekdayLetter(isoDate: string): string {
  return WEEKDAY_LETTERS[weekdayIndexMonday(isoDate)]!;
}

/** e.g. `Mon, 28 Sep` */
export function formatDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** e.g. `4 Sep` */
export function formatShortDayMonth(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function monthShort(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7));
  return MONTH_SHORT[m - 1]!;
}
