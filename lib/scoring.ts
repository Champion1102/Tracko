import { addDays, allDays, diffDays, isBirthday } from "./dates";
import type { Celebration, Config, Entry, Habit } from "./types";

/**
 * A day at or above this counts as done and keeps the streak alive. Seven of
 * ten, not ten of ten — gym and posts are daily habits she may well skip on a
 * given day, and a rest day shouldn't read as a failure.
 */
export const DONE_THRESHOLD = 70;

export type DayStatus = "perfect" | "kept" | "partial" | "missed" | "future";

export type HabitProgress = {
  habit: Habit;
  value: number;
  subDone: boolean[];
  /** Link-proof habits: the pasted URL. */
  note?: string;
  ratio: number; // 0..1
  done: boolean;
};

export type DayScore = {
  day: string;
  index: number; // 1-based challenge day
  done: number;
  total: number;
  pct: number;
  status: DayStatus;
  perHabit: HabitProgress[];
};

export type Totals = {
  /** Days at or above the threshold — the number she actually cares about. */
  daysDone: number;
  perfectDays: number;
  missedDays: number;
  daysElapsed: number;
  daysLeft: number;
  currentStreak: number;
  longestStreak: number;
};

export type Frequency = "daily" | "most" | "few" | "rare";

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  daily: "Every day",
  most: "Most days",
  few: "2–3 times a week",
  rare: "Rarely",
};

export type HabitStat = {
  habit: Habit;
  /** Days she completed it, out of days elapsed. */
  hit: number;
  elapsed: number;
  pct: number;
  /** Completions per week, extrapolated from the whole run so far. */
  perWeek: number;
  frequency: Frequency;
  /** The last 35 days ending today, oldest first — five weeks of dots. */
  recent: boolean[];
  /** Consecutive days ending today (or yesterday, if today isn't ticked yet). */
  run: number;
  /** Longest run of consecutive days, ever. */
  bestRun: number;
};

const key = (habitId: string, day: string) => `${habitId}|${day}`;

export function indexEntries(entries: Entry[]): Map<string, Entry> {
  const m = new Map<string, Entry>();
  for (const e of entries) m.set(key(e.habitId, e.day), e);
  return m;
}

export function habitRatio(habit: Habit, entry?: Entry): number {
  if (!entry) return 0;
  switch (habit.kind) {
    case "binary":
      return entry.value >= 1 ? 1 : 0;
    case "counter":
      return Math.min(entry.value / habit.target, 1);
    case "checklist": {
      const done = (entry.subDone ?? []).filter(Boolean).length;
      return Math.min(done / habit.target, 1);
    }
    default:
      return 0;
  }
}

export function scoreDay(
  config: Config,
  habits: Habit[],
  index: Map<string, Entry>,
  day: string,
  today: string,
): DayScore {
  const active = habits.filter((h) => h.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const perHabit: HabitProgress[] = active.map((habit) => {
    const entry = index.get(key(habit.id, day));
    const ratio = habitRatio(habit, entry);
    return {
      habit,
      value: entry?.value ?? 0,
      subDone: entry?.subDone ?? new Array(habit.subItems?.length ?? 0).fill(false),
      note: entry?.note,
      ratio,
      done: ratio >= 1,
    };
  });

  const total = perHabit.length;
  const done = perHabit.filter((p) => p.done).length;
  // Partial credit counts toward the day (four glasses is half the water), so
  // the ring on a busy day fills honestly rather than in ten hard steps.
  const pct = total === 0 ? 0 : (perHabit.reduce((s, p) => s + p.ratio, 0) / total) * 100;

  let status: DayStatus;
  if (diffDays(today, day) > 0) status = "future";
  else if (total > 0 && done === total) status = "perfect";
  else if (pct >= DONE_THRESHOLD) status = "kept";
  else if (pct > 0) status = "partial";
  else status = "missed";

  return { day, index: diffDays(config.startDate, day) + 1, done, total, pct, status, perHabit };
}

export function computeTotals(
  config: Config,
  habits: Habit[],
  entries: Entry[],
  today: string,
): { totals: Totals; days: DayScore[] } {
  const index = indexEntries(entries);
  const days = allDays(config.startDate, config.totalDays).map((d) =>
    scoreDay(config, habits, index, d, today),
  );

  const elapsedRaw = diffDays(config.startDate, today) + 1;
  const daysElapsed = Math.min(Math.max(elapsedRaw, 0), config.totalDays);
  const daysLeft = Math.max(config.totalDays - daysElapsed, 0);

  const past = days.filter((d) => d.status !== "future");
  const perfectDays = past.filter((d) => d.status === "perfect").length;
  const daysDone = past.filter((d) => keeps(d.status)).length;
  const missedDays = past.filter((d) => d.status === "missed").length;
  const { current, longest } = streaks(days, today);

  return {
    days,
    totals: {
      daysDone,
      perfectDays,
      missedDays,
      daysElapsed,
      daysLeft,
      currentStreak: current,
      longestStreak: longest,
    },
  };
}

function keeps(s: DayStatus) {
  return s === "perfect" || s === "kept";
}

export function streaks(days: DayScore[], today: string) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.status === "future") break;
    if (keeps(d.status)) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  // Today still being incomplete must not read as a broken streak.
  let current = 0;
  const past = days.filter((d) => d.status !== "future");
  for (let i = past.length - 1; i >= 0; i--) {
    const d = past[i];
    if (keeps(d.status)) current++;
    else if (d.day === today) continue;
    else break;
  }
  return { current, longest };
}

/** How each habit is actually going: hit rate, times per week, recent run. */
export function habitStats(
  config: Config,
  habits: Habit[],
  entries: Entry[],
  days: DayScore[],
  today: string,
): HabitStat[] {
  const index = indexEntries(entries);
  const past = days.filter((d) => d.status !== "future");
  const elapsed = past.length;

  return habits
    .filter((h) => h.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((habit) => {
      const doneOn = (day: string) => habitRatio(habit, index.get(key(habit.id, day))) >= 1;
      const hit = past.filter((d) => doneOn(d.day)).length;
      const perWeek = elapsed ? (hit * 7) / elapsed : 0;
      const frequency: Frequency =
        perWeek >= 6 ? "daily" : perWeek >= 4 ? "most" : perWeek >= 2 ? "few" : "rare";

      const recent = Array.from({ length: 35 }, (_, i) => addDays(today, i - 34)).map(
        (d) => diffDays(config.startDate, d) >= 0 && doneOn(d),
      );

      let run = 0;
      let cursor = doneOn(today) ? today : addDays(today, -1);
      while (diffDays(config.startDate, cursor) >= 0 && doneOn(cursor)) {
        run++;
        cursor = addDays(cursor, -1);
      }

      let bestRun = 0;
      let streak = 0;
      for (const d of past) {
        if (doneOn(d.day)) {
          streak++;
          bestRun = Math.max(bestRun, streak);
        } else streak = 0;
      }

      return {
        habit,
        hit,
        elapsed,
        pct: elapsed ? (hit / elapsed) * 100 : 0,
        perWeek,
        frequency,
        recent,
        run,
        bestRun,
      };
    });
}

// ---------------------------------------------------------------------------
// Celebration engine — deterministic keys so nothing ever fires twice.
// ---------------------------------------------------------------------------

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 75, 100];

export function detectCelebrations(
  config: Config,
  habits: Habit[],
  entries: Entry[],
  today: string,
  existingKeys: Set<string>,
): Celebration[] {
  const { totals, days } = computeTotals(config, habits, entries, today);
  const out: Celebration[] = [];
  const now = new Date().toISOString();

  const push = (c: Omit<Celebration, "seen" | "createdAt">) => {
    if (existingKeys.has(c.key)) return;
    out.push({ ...c, seen: false, createdAt: now });
  };

  if (isBirthday(today, config.heroBirthday)) {
    push({
      key: `birthday:${today.slice(0, 4)}`,
      kind: "streak",
      title: "Happy birthday",
      body: "Ninety-nine other days for discipline. Today is not one of them.",
      meta: { day: today },
    });
  }

  const todayScore = days.find((d) => d.day === today);
  if (todayScore && todayScore.status === "perfect") {
    push({
      key: `perfect:${today}`,
      kind: "perfect_day",
      title: "Every single one",
      body: `All ${todayScore.total}, on day ${todayScore.index}. Go rest.`,
      meta: { day: today, index: todayScore.index },
    });
  }

  for (const m of STREAK_MILESTONES) {
    if (totals.currentStreak >= m) {
      push({
        key: `streak:${m}`,
        kind: "streak",
        title: `${m} days in a row`,
        body:
          m >= 50
            ? `${m} days without breaking. This is who you are now.`
            : `${m} days straight. Keep it going.`,
        meta: { streak: m },
      });
    }
  }

  return out;
}
