import { coachConfigured } from "@/lib/coach";
import { prettyDay } from "@/lib/dates";
import { FREQUENCY_LABEL } from "@/lib/scoring";
import { loadState } from "@/lib/state";
import { DayRing } from "@/components/DayRing";
import { HabitIcon } from "@/components/HabitIcon";

export const dynamic = "force-dynamic";

/** The daily glance: today's ticks, the streak, the last week, the pattern. */
export default async function SponsorOverviewPage() {
  const s = await loadState();
  const { totals, todayScore } = s;
  const done = todayScore.perHabit.filter((p) => p.done);
  const missing = todayScore.perHabit.filter((p) => !p.done);
  const recent = s.days.filter((d) => d.status !== "future").slice(-7).reverse();

  return (
    <div className="space-y-5">
      <section className="card p-4">
        <div className="flex items-center gap-4">
          <DayRing pct={todayScore.pct} status={todayScore.status} size={64} stroke={5}>
            <span
              className={`text-[13px] font-black tabular-nums ${
                todayScore.status === "perfect" ? "text-white" : "text-text"
              }`}
            >
              {todayScore.done}/{todayScore.total}
            </span>
          </DayRing>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-faint">Today</p>
            <p className="mt-0.5 text-[15px] leading-snug font-black text-text">
              {missing.length === 0
                ? "Everything ticked."
                : `${todayScore.done} ticked, ${missing.length} still open.`}
            </p>
            {missing.length > 0 && (
              <p className="mt-1 truncate text-[12px] font-semibold text-muted">
                {missing.map((p) => p.habit.name).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-line-soft pt-3.5">
          {done.map((p) => (
            <span
              key={p.habit.id}
              title={p.habit.name}
              className="grid h-8 w-8 place-items-center rounded-lg bg-grass/15 text-grass"
            >
              <HabitIcon icon={p.habit.icon} emoji={p.habit.emoji} size={17} />
            </span>
          ))}
          {missing.map((p) => (
            <span
              key={p.habit.id}
              title={p.habit.name}
              className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-faint"
            >
              <HabitIcon icon={p.habit.icon} emoji={p.habit.emoji} size={17} />
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2">
        <Tile v={String(totals.currentStreak)} l="streak" />
        <Tile v={String(totals.daysDone)} l="days done" />
        <Tile v={String(totals.perfectDays)} l="perfect" />
        <Tile v={String(totals.missedDays)} l="missed" />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-[12px] font-bold text-faint">Last 7 days</h2>
        <ul className="space-y-2">
          {recent.map((d) => (
            <li key={d.day} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[11.5px] font-bold text-faint">
                {prettyDay(d.day)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-grass"
                  style={{ width: `${Math.max(d.pct, 2)}%` }}
                />
              </div>
              <span className="w-11 shrink-0 text-right text-[11.5px] font-black text-text tabular-nums">
                {d.done}/{d.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-[12px] font-bold text-faint">How the habits are going</h2>
        <ul className="space-y-2.5">
          {s.stats.map((st) => (
            <li key={st.habit.id} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                <HabitIcon icon={st.habit.icon} emoji={st.habit.emoji} size={16} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-text">
                {st.habit.name}
              </span>
              <span className="shrink-0 text-[11.5px] font-bold text-muted tabular-nums">
                {st.hit}/{st.elapsed} · {FREQUENCY_LABEL[st.frequency].toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {!coachConfigured() && (
        <p className="px-1 text-[11.5px] leading-snug font-semibold text-faint">
          Nimbus is running on built-in lines — add a provider key under Setup to have them
          written fresh each morning.
        </p>
      )}
    </div>
  );
}

function Tile({ v, l }: { v: string; l: string }) {
  return (
    <div className="card p-2.5 text-center">
      <div className="text-[16px] font-black text-text tabular-nums">{v}</div>
      <div className="text-[9.5px] font-bold text-faint">{l}</div>
    </div>
  );
}
