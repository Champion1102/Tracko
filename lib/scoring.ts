import {
  addDays,
  allDays,
  clockDistance,
  diffDays,
  isBirthday,
  sleepDuration,
  weeksOf,
  type Week,
} from "./dates";
import type { Celebration, Config, Entry, Habit, Photo } from "./types";

export const DAILY_MAX = 100;
/** A day at or above this keeps the streak alive. Forgiving on purpose. */
export const STREAK_THRESHOLD = 70;

export type DayStatus =
  | "perfect"
  | "strong"
  | "kept"
  | "partial"
  | "missed"
  | "frozen"
  | "future";

export type HabitProgress = {
  habit: Habit;
  value: number;
  bedtime?: string;
  wakeTime?: string;
  subDone: boolean[];
  ratio: number; // 0..1
  points: number;
  done: boolean;
};

export type DayScore = {
  day: string;
  index: number; // 1-based challenge day
  points: number;
  max: number;
  pct: number;
  status: DayStatus;
  perHabit: HabitProgress[];
};

export type WeekScore = {
  week: Week;
  earned: number;
  max: number;
  perHabit: (HabitProgress & { weeklyTarget: number })[];
  complete: boolean;
};

export type Totals = {
  earned: number;
  max: number;
  pct: number;
  rewardTarget: number;
  rewardPct: number; // progress toward the reward bar, 0..100
  unlocked: boolean;
  pointsToGo: number;
  perfectDays: number;
  keptDays: number;
  missedDays: number;
  daysElapsed: number;
  daysLeft: number;
  currentStreak: number;
  longestStreak: number;
  /** Points/day she needs from here on to still land the reward. */
  requiredPace: number;
  /** Rupees-per-point, and how much of the reward she has banked so far. */
  /** Photo-proof points. Pure bonus — added to earned, never to the target. */
  photoBonus: number;
  photosToday: number;
  /** Points deducted by the optional penalty rule, and how many days triggered it. */
  penaltyLost: number;
  penaltyDays: number;
  /** Bonus for weeks where every day landed perfect. Also outside `max`. */
  perfectWeekBonus: number;
  perfectWeeks: number;
  /** Points she left on the table yesterday, once the day closed. */
  yesterdayLost: number;
  perPoint: number;
  earnedValue: number;
  todayValue: number;
  /** Her actual average so far. */
  actualPace: number;
  onTrack: boolean;
};

const key = (habitId: string, day: string) => `${habitId}|${day}`;

export function indexEntries(entries: Entry[]): Map<string, Entry> {
  const m = new Map<string, Entry>();
  for (const e of entries) m.set(key(e.habitId, e.day), e);
  return m;
}

/**
 * Sleep is scored on two halves: did she go to bed near the time she meant to,
 * and did she actually get enough hours. Bedtime credit decays with distance
 * rather than cutting off, so being 20 minutes late isn't the same as 3am.
 */
export function sleepRatio(config: Config, entry?: Entry): number {
  if (!entry?.bedtime || !entry?.wakeTime) return 0;

  const minutes = sleepDuration(entry.bedtime, entry.wakeTime);
  if (minutes === null) return 0;
  const durationScore = Math.min(minutes / (config.sleepTargetHours * 60), 1);

  const drift = clockDistance(entry.bedtime, config.idealBedtime);
  const tolerance = Math.max(config.sleepToleranceMin, 1);
  const bedtimeScore =
    drift === null ? 0 : Math.max(0, 1 - Math.max(0, drift - tolerance) / (tolerance * 2));

  return Math.min(durationScore * 0.5 + bedtimeScore * 0.5, 1);
}

export function habitRatio(habit: Habit, entry?: Entry, config?: Config): number {
  if (!entry) return 0;
  switch (habit.kind) {
    case "binary":
      return entry.value >= 1 ? 1 : 0;
    case "counter":
    case "duration":
      return Math.min(entry.value / habit.target, 1);
    case "checklist": {
      const done = (entry.subDone ?? []).filter(Boolean).length;
      return Math.min(done / habit.target, 1);
    }
    case "sleep":
      return config ? sleepRatio(config, entry) : 0;
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
  const daily = habits.filter((h) => h.active && h.cadence === "daily");
  const perHabit: HabitProgress[] = daily.map((habit) => {
    const entry = index.get(key(habit.id, day));
    const ratio = habitRatio(habit, entry, config);
    return {
      habit,
      value: entry?.value ?? 0,
      bedtime: entry?.bedtime,
      wakeTime: entry?.wakeTime,
      subDone: entry?.subDone ?? new Array(habit.subItems?.length ?? 0).fill(false),
      ratio,
      points: ratio * habit.points,
      done: ratio >= 1,
    };
  });

  const max = daily.reduce((s, h) => s + h.points, 0);
  const points = perHabit.reduce((s, p) => s + p.points, 0);
  const pct = max === 0 ? 0 : (points / max) * 100;

  let status: DayStatus;
  if (diffDays(today, day) > 0) status = "future";
  else if (config.freezeDays.includes(day) && pct < STREAK_THRESHOLD) status = "frozen";
  else if (pct >= 99.5) status = "perfect";
  else if (pct >= 85) status = "strong";
  else if (pct >= STREAK_THRESHOLD) status = "kept";
  else if (pct > 0) status = "partial";
  else status = "missed";

  return {
    day,
    index: diffDays(config.startDate, day) + 1,
    points,
    max,
    pct,
    status,
    perHabit,
  };
}

/** Weekly targets shrink for a partial final week so the bar stays fair. */
export function weeklyTargetFor(habit: Habit, week: Week): number {
  if (week.days.length === 7) return habit.target;
  return Math.max(1, Math.round((habit.target * week.days.length) / 7));
}

export function scoreWeek(
  habits: Habit[],
  index: Map<string, Entry>,
  week: Week,
): WeekScore {
  const weekly = habits.filter((h) => h.active && h.cadence === "weekly");
  const perHabit = weekly.map((habit) => {
    const weeklyTarget = weeklyTargetFor(habit, week);
    const value = week.days.reduce(
      (s, d) => s + (index.get(key(habit.id, d))?.value ?? 0),
      0,
    );
    const counted = Math.min(value, weeklyTarget);
    return {
      habit,
      value,
      subDone: [],
      weeklyTarget,
      ratio: weeklyTarget === 0 ? 0 : counted / weeklyTarget,
      points: counted * habit.points,
      done: value >= weeklyTarget,
    };
  });

  const max = perHabit.reduce((s, p) => s + p.weeklyTarget * p.habit.points, 0);
  const earned = perHabit.reduce((s, p) => s + p.points, 0);
  return { week, earned, max, perHabit, complete: max > 0 && earned >= max };
}

export function photoBonusFor(config: Config, photos: Photo[], day: string): number {
  const count = photos.filter((p) => p.day === day).length;
  return Math.min(count, config.photoMaxPerDay) * config.photoBonusPoints;
}

export function computeTotals(
  config: Config,
  habits: Habit[],
  entries: Entry[],
  today: string,
  photos: Photo[] = [],
): { totals: Totals; days: DayScore[]; weeks: WeekScore[] } {
  const index = indexEntries(entries);
  const days = allDays(config.startDate, config.totalDays).map((d) =>
    scoreDay(config, habits, index, d, today),
  );
  const weeks = weeksOf(config.startDate, config.totalDays).map((w) =>
    scoreWeek(habits, index, w),
  );

  const dailyMax = days.reduce((s, d) => s + d.max, 0);
  const weeklyMax = weeks.reduce((s, w) => s + w.max, 0);
  const max = dailyMax + weeklyMax;

  // Photo points sit outside `max` on purpose: uploading is optional, so it
  // should pull the finish line closer, never push it further away.
  const photoDays = new Set(photos.map((p) => p.day));
  const photoBonus = [...photoDays].reduce((sum, d) => sum + photoBonusFor(config, photos, d), 0);

  // A clean sweep of a full week pays a lump sum. Also outside `max`, so it
  // rewards a great run without making an ordinary one feel like failure.
  const perfectWeekIndexes = weeks
    .filter((w) => {
      const wd = days.filter((d) => w.week.days.includes(d.day));
      return wd.length === 7 && wd.every((d) => d.status === "perfect");
    })
    .map((w) => w.week.index);
  const perfectWeekBonus = perfectWeekIndexes.length * config.perfectWeekBonus;

  /**
   * The optional penalty. Off by default, and deliberately narrow: it only
   * fires on a day that closed near-empty, never on a merely-average one.
   * The meter already punishes a missed habit by simply not paying for it —
   * this is a second, sharper sting for a day that was thrown away.
   */
  const penaltyHitDays = config.penaltyEnabled
    ? days.filter(
        (d) =>
          d.status !== "future" &&
          d.day !== today &&
          d.status !== "frozen" &&
          d.pct < config.penaltyBelowPct,
      )
    : [];
  const penaltyLost = penaltyHitDays.length * config.penaltyPoints;

  const yesterday = days.find((d) => d.day === addDays(today, -1));
  const yesterdayLost =
    yesterday && yesterday.status !== "future" ? Math.max(yesterday.max - yesterday.points, 0) : 0;

  const earnedRaw =
    days.reduce((s, d) => s + d.points, 0) +
    weeks.reduce((s, w) => s + w.earned, 0) +
    photoBonus +
    perfectWeekBonus;
  const earned = Math.max(earnedRaw - penaltyLost, 0);

  const pct = max === 0 ? 0 : (earned / max) * 100;
  const rewardTarget = (max * config.rewardTargetPct) / 100;
  const rewardPct = rewardTarget === 0 ? 0 : Math.min((earned / rewardTarget) * 100, 100);

  const elapsedRaw = diffDays(config.startDate, today) + 1;
  const daysElapsed = Math.min(Math.max(elapsedRaw, 0), config.totalDays);
  const daysLeft = Math.max(config.totalDays - daysElapsed, 0);

  const past = days.filter((d) => d.status !== "future");
  const perfectDays = past.filter((d) => d.status === "perfect").length;
  const keptDays = past.filter((d) =>
    ["perfect", "strong", "kept", "frozen"].includes(d.status),
  ).length;
  const missedDays = past.filter((d) => d.status === "missed").length;

  const { current, longest } = streaks(days, today);

  const perPoint = rewardTarget > 0 ? config.rewardPrice / rewardTarget : 0;
  const earnedValue = Math.min(earned * perPoint, config.rewardPrice);
  const todayValue =
    ((days.find((d) => d.day === today)?.points ?? 0) + photoBonusFor(config, photos, today)) *
    perPoint;

  const pointsToGo = Math.max(rewardTarget - earned, 0);
  // She still earns weekly bonus points on remaining days, so pace is per remaining day.
  const requiredPace = daysLeft > 0 ? pointsToGo / daysLeft : 0;
  const actualPace = daysElapsed > 0 ? earned / daysElapsed : 0;

  return {
    days,
    weeks,
    totals: {
      earned,
      max,
      pct,
      rewardTarget,
      rewardPct,
      unlocked: earned >= rewardTarget,
      pointsToGo,
      perfectDays,
      keptDays,
      missedDays,
      daysElapsed,
      daysLeft,
      currentStreak: current,
      longestStreak: longest,
      requiredPace,
      photoBonus,
      photosToday: photos.filter((p) => p.day === today).length,
      penaltyLost,
      penaltyDays: penaltyHitDays.length,
      perfectWeekBonus,
      perfectWeeks: perfectWeekIndexes.length,
      yesterdayLost,
      perPoint,
      earnedValue,
      todayValue,
      actualPace,
      onTrack: actualPace >= requiredPace || earned >= rewardTarget,
    },
  };
}

function keeps(s: DayStatus) {
  return s === "perfect" || s === "strong" || s === "kept" || s === "frozen";
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

/** Streak run, in days, for one habit ending today. */
export function habitStreak(
  habit: Habit,
  index: Map<string, Entry>,
  today: string,
  startDate: string,
): number {
  let n = 0;
  let cursor = today;
  while (diffDays(startDate, cursor) >= 0) {
    const ratio = habitRatio(habit, index.get(key(habit.id, cursor)));
    if (ratio >= 1) n++;
    else if (cursor === today) {
      // today not done yet — look back from yesterday instead
    } else break;
    cursor = addDays(cursor, -1);
  }
  return n;
}

// ---------------------------------------------------------------------------
// Celebration engine — deterministic keys so nothing ever fires twice.
// ---------------------------------------------------------------------------

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 45, 60, 75, 90];
const REWARD_MILESTONES = [10, 25, 50, 75, 90, 100];
const HABIT_MILESTONES = [7, 14, 30, 60, 90];

export function detectCelebrations(
  config: Config,
  habits: Habit[],
  entries: Entry[],
  today: string,
  existingKeys: Set<string>,
): Celebration[] {
  const { totals, days, weeks } = computeTotals(config, habits, entries, today);
  const index = indexEntries(entries);
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
      title: "Perfect day",
      body: `All ten, day ${todayScore.index}. Full 100 points banked.`,
      meta: { day: today, index: todayScore.index },
    });
  }

  for (const m of STREAK_MILESTONES) {
    if (totals.currentStreak >= m) {
      push({
        key: `streak:${m}`,
        kind: "streak",
        title: `${m}-day streak`,
        body:
          m >= 60
            ? `${m} days without breaking. This is who you are now.`
            : `${m} days in a row. The flame is getting bigger.`,
        meta: { streak: m },
      });
    }
  }

  for (const m of REWARD_MILESTONES) {
    if (totals.rewardPct >= m) {
      push({
        key: `reward:${m}`,
        kind: "reward_milestone",
        title: m === 100 ? `${config.rewardName} unlocked` : `${m}% to the ${config.rewardName}`,
        body:
          m === 100
            ? "You did the whole thing. Go collect."
            : `${Math.round(totals.pointsToGo)} points left to go.`,
        meta: { pct: m },
      });
    }
  }

  for (const w of weeks) {
    const started = diffDays(config.startDate, today) >= w.week.index * 7;
    if (started && w.complete) {
      push({
        key: `week:${w.week.index}`,
        kind: "week_bonus",
        title: `${w.week.label} bonus maxed`,
        body: `Gym and posts both done. +${Math.round(w.max)} bonus points.`,
        meta: { week: w.week.index, points: w.max },
      });
    }
  }

  // The first time each habit is ever ticked. Ten small wins in week one,
  // which is exactly when quitting risk is highest.
  for (const habit of habits.filter((h) => h.active)) {
    const everDone = entries.some(
      (e) => e.habitId === habit.id && habitRatio(habit, e, config) >= 1,
    );
    if (everDone) {
      push({
        key: `first:${habit.slug}`,
        kind: "habit_streak",
        title: `${habit.emoji} First ${habit.name}`,
        body: "One down. The first one is always the hardest to start.",
        meta: { habit: habit.slug, first: true },
      });
    }
  }

  for (const w of weeks) {
    const wd = days.filter((d) => w.week.days.includes(d.day));
    if (wd.length === 7 && wd.every((d) => d.status === "perfect")) {
      push({
        key: `perfectweek:${w.week.index}`,
        kind: "week_bonus",
        title: `A perfect ${w.week.label.toLowerCase()}`,
        body: `Seven days, nothing missed. That's ${config.perfectWeekBonus} bonus points on top.`,
        meta: { week: w.week.index },
      });
    }
  }

  for (const habit of habits.filter((h) => h.active && h.cadence === "daily")) {
    const run = habitStreak(habit, index, today, config.startDate);
    for (const m of HABIT_MILESTONES) {
      if (run >= m) {
        push({
          key: `habit:${habit.slug}:${m}`,
          kind: "habit_streak",
          title: `${habit.emoji} ${habit.name} × ${m}`,
          body: `${m} days straight. That one's basically automatic now.`,
          meta: { habit: habit.slug, run: m },
        });
      }
    }
  }

  return out;
}
