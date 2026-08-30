export const DAY_MS = 86_400_000;

/** YYYY-MM-DD for "now" in a given IANA timezone. */
export function todayInTz(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Local clock "HH:MM" in a given IANA timezone. */
export function timeInTz(tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function toUTC(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  return fromUTC(toUTC(day) + n * DAY_MS);
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

/** 1-based challenge day number. Day 1 == startDate. */
export function dayIndex(startDate: string, day: string): number {
  return diffDays(startDate, day) + 1;
}

export function allDays(startDate: string, totalDays: number): string[] {
  return Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));
}

export function prettyDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "Sunday" for a YYYY-MM-DD. */
export function weekdayName(day: string): string {
  return new Date(toUTC(day)).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

/** "31 August" for a YYYY-MM-DD. */
export function dayMonth(day: string): string {
  return new Date(toUTC(day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(day: string): number {
  return (new Date(toUTC(day)).getUTCDay() + 6) % 7;
}

/** "August 2026" for a YYYY-MM. */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Every YYYY-MM-DD in a YYYY-MM. */
export function daysOfMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

/** YYYY-MM shifted by n months. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isFuture(day: string, today: string): boolean {
  return diffDays(today, day) > 0;
}

/** True when `day` (YYYY-MM-DD) falls on the same month and date as `birthday`. */
export function isBirthday(day: string, birthday: string): boolean {
  if (!birthday) return false;
  return day.slice(5) === birthday.slice(5);
}
