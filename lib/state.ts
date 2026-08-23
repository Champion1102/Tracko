import { cache } from "react";

import { db } from "./db";
import { pickLine } from "./coach";
import { addDays, timeInTz, todayInTz, weekOf } from "./dates";
import { partsUnlocked, nextPart } from "./dyson";
import { mascotLine } from "./mascot";
import {
  computeTotals,
  detectCelebrations,
  indexEntries,
  scoreDay,
  scoreWeek,
} from "./scoring";
import type { DB, Situation } from "./types";

/**
 * Request-memoised via React cache(): the layout and the page each call this
 * during one render, and it used to hit the database twice for identical
 * data. Now the second caller gets the first caller's result.
 */
export const loadState = cache(async () => {
  const store = db();
  const data: DB = await store.read();
  const { config, habits } = data;
  const today = todayInTz(config.timezone);
  const clock = timeInTz(config.timezone);
  const hour = Number(clock.slice(0, 2));

  // Detection is idempotent — deterministic keys mean nothing ever double-fires.
  const existing = new Set(data.celebrations.map((c) => c.key));
  const fresh = detectCelebrations(config, habits, data.entries, today, existing);
  if (fresh.length) {
    await store.addCelebrations(fresh);
    data.celebrations.push(...fresh);
  }

  const { totals, days, weeks } = computeTotals(config, habits, data.entries, today, data.photos);
  const index = indexEntries(data.entries);
  const todayScore = scoreDay(config, habits, index, today, today);
  const thisWeek = scoreWeek(habits, index, weekOf(config.startDate, config.totalDays, today));

  const pending = data.celebrations
    .filter((c) => !c.seen)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const unlockedLetters = data.letters
    .filter((l) => totals.daysElapsed >= l.unlockDay)
    .sort((a, b) => a.unlockDay - b.unlockDay);

  const situation = pickSituation({
    unlocked: totals.unlocked,
    todayPct: todayScore.pct,
    remaining: todayScore.perHabit.filter((p) => !p.done).length,
    missedYesterday:
      days.find((d) => d.day === addDays(today, -1))?.status === "missed",
    onTrack: totals.onTrack,
    daysElapsed: totals.daysElapsed,
    streak: totals.currentStreak,
    hour,
  });

  // A generated line when we have one, the hand-written fallback when we don't.
  const coach = data.coach?.day === today ? data.coach : null;
  const written = mascotLine(config, todayScore, totals, hour, config.heroName);
  const generated = pickLine(coach, situation, totals.daysElapsed * 7 + hour);
  const mascot = generated
    ? { text: generated.text, mood: generated.mood }
    : written;

  return {
    config,
    habits: habits.filter((h) => h.active).sort((a, b) => a.sortOrder - b.sortOrder),
    allHabits: habits.sort((a, b) => a.sortOrder - b.sortOrder),
    entries: data.entries,
    letters: data.letters.sort((a, b) => a.unlockDay - b.unlockDay),
    unlockedLetters,
    nudges: data.nudges,
    photos: data.photos,
    unreadForHero: data.nudges.filter((n) => n.from !== "hero" && !n.readAt),
    unreadForSponsor: data.nudges.filter((n) => n.from !== "sponsor" && !n.readAt),
    pushSubs: data.pushSubs,
    today,
    clock,
    hour,
    days,
    weeks,
    totals,
    todayScore,
    thisWeek,
    pending,
    parts: partsUnlocked(totals.rewardPct),
    nextPart: nextPart(totals.rewardPct),
    mascot,
    situation,
    coach,
  };
});

/** Which kind of line fits where she is right now. Order matters — first wins. */
function pickSituation(x: {
  unlocked: boolean;
  todayPct: number;
  remaining: number;
  missedYesterday: boolean;
  onTrack: boolean;
  daysElapsed: number;
  streak: number;
  hour: number;
}): Situation {
  if (x.unlocked) return "reward";
  if (x.todayPct >= 99.5) return "perfect_day";
  if (x.remaining > 0 && x.remaining <= 2) return "almost";
  if (x.missedYesterday) return "comeback";
  if (!x.onTrack && x.daysElapsed > 7) return "behind";
  if (x.streak >= 7) return "streak";
  if (x.hour >= 20 && x.remaining > 0) return "evening";
  if (x.hour < 11) return "morning";
  return "reward";
}

export type AppState = Awaited<ReturnType<typeof loadState>>;
