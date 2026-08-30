import Link from "next/link";
import { addDays, weekday } from "@/lib/dates";
import { loadState } from "@/lib/state";
import { HabitFrequency } from "@/components/HabitFrequency";
import { Icon } from "@/components/Icon";
import { MonthGrid, type DayLite, type ProgressLite } from "@/components/MonthGrid";
import { MoodStrip, WeekCompare, WeekdayBars } from "@/components/ProgressCharts";

export const dynamic = "force-dynamic";

/** Her analytics: how many days she did, and what each habit really looks like. */
export default async function ProgressPage() {
  const s = await loadState();
  const { totals, config } = s;

  const days: DayLite[] = s.days.map(({ day, index, pct, status, done, total }) => ({
    day,
    index,
    pct,
    status,
    done,
    total,
  }));

  // Only elapsed days carry detail — the future has nothing to show and this
  // keeps the payload small for the whole hundred days.
  const details = Object.fromEntries(
    s.days
      .filter((d) => d.status !== "future")
      .map((d) => [
        d.day,
        d.perHabit.map(
          (p): ProgressLite => ({
            habitId: p.habit.id,
            value: p.value,
            subDone: p.subDone,
            note: p.note,
            ratio: p.ratio,
            done: p.done,
          }),
        ),
      ]),
  );

  // ---- the numbers behind the cards --------------------------------------

  const elapsed = s.days.filter((d) => d.status !== "future");
  const possible = elapsed.reduce((n, d) => n + d.total, 0);
  const ticks = elapsed.reduce((n, d) => n + d.done, 0);
  const completion = possible ? Math.round((ticks / possible) * 100) : 0;

  const byDay = new Map(s.days.map((d) => [d.day, d]));
  const weekTicks = (from: string) =>
    Array.from({ length: 7 }, (_, i) => byDay.get(addDays(from, i))).reduce(
      (n, d) => n + (d && d.status !== "future" ? d.done : 0),
      0,
    );
  const thisWeek = weekTicks(addDays(s.today, -6));
  const lastWeek = weekTicks(addDays(s.today, -13));

  const letters = ["M", "T", "W", "T", "F", "S", "S"];
  const pattern = letters.map((label, w) => {
    const ds = elapsed.filter((d) => weekday(d.day) === w);
    return {
      label,
      pct: ds.length ? ds.reduce((n, d) => n + d.pct, 0) / ds.length : 0,
      count: ds.length,
    };
  });

  // Sleep logs hours into the entry value when she uses the selector.
  const sleepHabit = s.habits.find((h) => h.proof === "hours");
  const slept = sleepHabit
    ? s.entries.filter((e) => e.habitId === sleepHabit.id && e.value > 1).map((e) => e.value)
    : [];
  const avgSleep = slept.length
    ? Math.round((slept.reduce((a, b) => a + b, 0) / slept.length) * 10) / 10
    : null;

  const moodByDay = new Map(s.journal.map((j) => [j.day, j.mood]));
  const moods = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(s.today, i - 13);
    return { day, mood: moodByDay.get(day) ?? null };
  });

  return (
    <div className="space-y-5">
      <header className="px-1 pt-1">
        <h1 className="text-[26px] leading-none font-black text-text">Progress</h1>
        <p className="mt-1.5 text-[13px] font-bold text-muted">
          Day {totals.daysElapsed} of {config.totalDays}
          {totals.currentStreak >= 2 && ` · 🔥 ${totals.currentStreak}-day streak`}
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2.5">
        <Stat n={totals.daysDone} label="days done" />
        <Stat n={totals.perfectDays} label="perfect" />
        <Stat n={totals.missedDays} label="missed" />
      </section>
      <section className="grid grid-cols-3 gap-2.5">
        <Stat n={`${completion}%`} label="ticks done" />
        <Stat n={totals.longestStreak} label="best streak" />
        <Stat n={avgSleep !== null ? `${avgSleep}h` : "–"} label="avg sleep" />
      </section>

      <MonthGrid days={days} details={details} habits={s.habits} today={s.today} />

      {totals.daysElapsed >= 8 && <WeekCompare thisWeek={thisWeek} lastWeek={lastWeek} />}
      {totals.daysElapsed >= 7 && <WeekdayBars pattern={pattern} />}
      <MoodStrip days={moods} />

      <HabitFrequency stats={s.stats} />

      <Link href="/chat" className="card flex items-center gap-3 px-4 py-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
          <Icon.chat size={18} />
        </span>
        <span className="flex-1 text-[13.5px] font-bold text-text">Ask Nimbus about this</span>
        <Icon.chevronRight size={16} className="text-faint" />
      </Link>
    </div>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="card p-3.5 text-center">
      <div className="text-[22px] leading-none font-black text-text tabular-nums">{n}</div>
      <div className="mt-1.5 text-[11px] font-bold text-faint">{label}</div>
    </div>
  );
}
