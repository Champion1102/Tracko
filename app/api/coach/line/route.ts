import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { coachConfigured, generateLiveLine } from "@/lib/coach";
import { money } from "@/lib/money";
import { loadState } from "@/lib/state";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * One contextual line for the habit that was just completed. The client has
 * already shown something instantly, so this is pure enhancement — every
 * failure path returns 204 and the local line simply stays.
 */
export async function POST(req: Request) {
  const role = await currentRole();
  if (!role) return new NextResponse(null, { status: 401 });
  if (!coachConfigured()) return new NextResponse(null, { status: 204 });

  const { habitId } = (await req.json()) as { habitId?: string };
  if (!habitId) return new NextResponse(null, { status: 400 });

  const s = await loadState();
  const habit = s.habits.find((h) => h.id === habitId);
  if (!habit) return new NextResponse(null, { status: 204 });

  const outstanding = s.todayScore.perHabit.filter((p) => !p.done);
  const cur = s.config.currency;

  const line = await generateLiveLine({
    justCompleted: habit.name,
    itsWorth: money(habit.points * s.totals.perPoint, cur),
    timeNow: s.clock,
    habitsLeftToday: outstanding.length,
    whatsLeft: outstanding.map((p) => p.habit.name),
    dayIsComplete: outstanding.length === 0,
    earnedToday: money(s.totals.todayValue, cur),
    stillOnTheTableToday: money(
      outstanding.reduce((n, p) => n + p.habit.points, 0) * s.totals.perPoint,
      cur,
    ),
    currentStreak: s.totals.currentStreak,
    dayNumber: s.totals.daysElapsed,
    totalDays: s.config.totalDays,
    reward: s.config.rewardName,
    earnedTowardRewardSoFar: money(s.totals.earnedValue, cur),
    herName: s.config.heroName || null,
  });

  if (!line) return new NextResponse(null, { status: 204 });
  return NextResponse.json(line);
}
