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

/** 0-based week bucket, anchored to startDate rather than the calendar. */
export function weekIndex(startDate: string, day: string): number {
  return Math.floor(diffDays(startDate, day) / 7);
}

export type Week = {
  index: number;
  label: string;
  days: string[];
  start: string;
  end: string;
};

export function weeksOf(startDate: string, totalDays: number): Week[] {
  const weeks: Week[] = [];
  for (let i = 0; i * 7 < totalDays; i++) {
    const days = allDays(startDate, totalDays).slice(i * 7, i * 7 + 7);
    weeks.push({
      index: i,
      label: `Week ${i + 1}`,
      days,
      start: days[0],
      end: days[days.length - 1],
    });
  }
  return weeks;
}

export function weekOf(startDate: string, totalDays: number, day: string): Week {
  const idx = weekIndex(startDate, day);
  const weeks = weeksOf(startDate, totalDays);
  return weeks[Math.min(Math.max(idx, 0), weeks.length - 1)];
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

export function isFuture(day: string, today: string): boolean {
  return diffDays(today, day) > 0;
}

/** "HH:MM" → minutes past midnight. */
export function clockToMinutes(clock: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutes slept between two clock times, wrapping past midnight. */
export function sleepDuration(bedtime: string, wakeTime: string): number | null {
  const bed = clockToMinutes(bedtime);
  const wake = clockToMinutes(wakeTime);
  if (bed === null || wake === null) return null;
  return wake >= bed ? wake - bed : wake + 1440 - bed;
}

/** Shortest distance between two clock times, in minutes (max 720). */
export function clockDistance(a: string, b: string): number | null {
  const x = clockToMinutes(a);
  const y = clockToMinutes(b);
  if (x === null || y === null) return null;
  const raw = Math.abs(x - y);
  return Math.min(raw, 1440 - raw);
}

/** True when `day` (YYYY-MM-DD) falls on the same month and date as `birthday`. */
export function isBirthday(day: string, birthday: string): boolean {
  if (!birthday) return false;
  return day.slice(5) === birthday.slice(5);
}
