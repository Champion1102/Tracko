import { cache } from "react";

import { db } from "./db";
import { timeInTz, todayInTz } from "./dates";
import {
  computeTotals,
  detectCelebrations,
  habitStats,
  indexEntries,
  scoreDay,
} from "./scoring";
import type { Celebration, DB } from "./types";

const CELEBRATION_KINDS = new Set<Celebration["kind"]>(["perfect_day", "streak", "letter"]);

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

  const { totals, days } = computeTotals(config, habits, data.entries, today);
  const index = indexEntries(data.entries);
  const todayScore = scoreDay(config, habits, index, today, today);
  const stats = habitStats(config, habits, data.entries, days, today);

  // Rows of kinds the app no longer celebrates (reward milestones, week
  // bonuses) may still sit unseen in the table; they're simply never shown.
  const pending = data.celebrations
    .filter((c) => !c.seen && CELEBRATION_KINDS.has(c.kind))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const unlockedLetters = data.letters
    .filter((l) => totals.daysElapsed >= l.unlockDay)
    .sort((a, b) => a.unlockDay - b.unlockDay);

  return {
    config,
    habits: habits.filter((h) => h.active).sort((a, b) => a.sortOrder - b.sortOrder),
    allHabits: habits.sort((a, b) => a.sortOrder - b.sortOrder),
    entries: data.entries,
    letters: data.letters.sort((a, b) => a.unlockDay - b.unlockDay),
    unlockedLetters,
    nudges: data.nudges,
    photos: data.photos,
    journal: data.journal,
    unreadForHero: data.nudges.filter((n) => n.from !== "hero" && !n.readAt),
    unreadForSponsor: data.nudges.filter((n) => n.from !== "sponsor" && !n.readAt),
    pushSubs: data.pushSubs,
    today,
    clock,
    hour,
    days,
    totals,
    todayScore,
    stats,
    pending,
    coach: data.coach?.day === today ? data.coach : null,
  };
});

export type AppState = Awaited<ReturnType<typeof loadState>>;
