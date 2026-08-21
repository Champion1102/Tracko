import { loadState } from "@/lib/state";
import { habitRatio, indexEntries } from "@/lib/scoring";
import { prettyDay } from "@/lib/dates";
import { ShareCard } from "@/components/ShareCard";

export const dynamic = "force-dynamic";

const HEAT: Record<string, string> = {
  perfect: "bg-grass",
  strong: "bg-grass/60",
  kept: "bg-aqua/70",
  partial: "bg-flame/70",
  missed: "bg-surface-2",
  frozen: "bg-violet/70",
  future: "bg-ink-2 border border-line/60",
};

export default async function StatsPage() {
  const s = await loadState();
  const { totals, weeks, days, config } = s;
  const index = indexEntries(s.entries);
  const elapsed = Math.max(totals.daysElapsed, 1);

  const consistency = s.habits
    .filter((h) => h.cadence === "daily")
    .map((habit) => {
      const hit = days
        .filter((d) => d.status !== "future")
        .filter((d) => habitRatio(habit, index.get(`${habit.id}|${d.day}`), config) >= 1).length;
      return { habit, hit, pct: (hit / elapsed) * 100 };
    })
    .sort((a, b) => b.pct - a.pct);

  const bestWeek = [...weeks]
    .map((w) => {
      const wd = days.filter((d) => w.week.days.includes(d.day) && d.status !== "future");
      const pts = wd.reduce((sum, d) => sum + d.points, 0) + w.earned;
      return { label: w.week.label, pts, counted: wd.length };
    })
    .filter((w) => w.counted > 0)
    .sort((a, b) => b.pts - a.pts)[0];

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-2xl font-black text-text">The numbers</h1>
        <p className="mt-1 text-[13px] font-bold text-muted">
          {Math.round(totals.earned).toLocaleString()} of {Math.round(totals.max).toLocaleString()} points earned
        </p>
      </header>

      <ShareCard
        data={{
          weekLabel: s.thisWeek.week.label,
          dayNumber: totals.daysElapsed,
          totalDays: config.totalDays,
          weekPercents: s.thisWeek.week.days.map(
            (d) => days.find((x) => x.day === d && x.status !== "future")?.pct ?? 0,
          ),
          earnedThisWeek:
            s.thisWeek.week.days.reduce(
              (sum, d) => sum + (days.find((x) => x.day === d)?.points ?? 0),
              0,
            ) * totals.perPoint,
          streak: totals.currentStreak,
          rewardPct: totals.rewardPct,
          rewardName: config.rewardName,
          currency: config.currency,
          heroName: config.heroName,
        }}
      />

      <section className="grid grid-cols-2 gap-2.5">
        <Big label="Current streak" value={totals.currentStreak} suffix="days" tone="text-flame" />
        <Big label="Longest streak" value={totals.longestStreak} suffix="days" tone="text-gold" />
        <Big label="Perfect days" value={totals.perfectDays} suffix={`of ${elapsed}`} tone="text-grass" />
        <Big
          label="Daily average"
          value={Math.round(totals.actualPace)}
          suffix="points"
          tone="text-aqua"
        />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Every day at a glance
        </h2>
        <div className="space-y-1.5">
          {weeks.map((w) => (
            <div key={w.week.index} className="flex items-center gap-1.5">
              <span className="w-6 shrink-0 text-[9.5px] font-black text-faint tabular-nums">
                {w.week.index + 1}
              </span>
              {w.week.days.map((day) => {
                const d = days.find((x) => x.day === day)!;
                return (
                  <div
                    key={day}
                    title={`${prettyDay(day)} · ${Math.round(d.points)}/100`}
                    className={`h-6 flex-1 rounded-[5px] ${HEAT[d.status]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {[
            ["perfect", "Perfect"],
            ["strong", "Strong"],
            ["kept", "Kept"],
            ["partial", "Partial"],
            ["frozen", "Frozen"],
            ["missed", "Missed"],
          ].map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5 text-[10px] font-bold text-faint">
              <i className={`h-2.5 w-2.5 rounded-[3px] ${HEAT[k]}`} />
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Which habits are sticking
        </h2>
        <ul className="space-y-3.5">
          {consistency.map(({ habit, hit, pct }) => (
            <li key={habit.id}>
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-sm">{habit.emoji}</span>
                <span className="flex-1 truncate text-[13px] font-black text-text">{habit.name}</span>
                <span
                  className={`text-[12px] font-black tabular-nums ${
                    pct >= 85 ? "text-grass" : pct >= 60 ? "text-gold" : "text-flame"
                  }`}
                >
                  {Math.round(pct)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${
                    pct >= 85 ? "bg-grass" : pct >= 60 ? "bg-gold" : "bg-flame"
                  }`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
              <p className="mt-1 text-[10.5px] font-bold text-faint tabular-nums">
                {hit} of {elapsed} days
              </p>
            </li>
          ))}
        </ul>
      </section>

      {bestWeek && (
        <section className="card border-gold/40 bg-gold/8 p-4">
          <p className="text-[10px] font-black tracking-[0.16em] text-gold uppercase">Best week</p>
          <p className="mt-1 text-lg font-black text-text">
            {bestWeek.label} — {Math.round(bestWeek.pts)} points
          </p>
          <p className="mt-1 text-[12.5px] font-semibold text-muted">
            Beat it and the {config.rewardName} gets a lot closer.
          </p>
        </section>
      )}
    </div>
  );
}

function Big({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix: string;
  tone: string;
}) {
  return (
    <div className="card p-4">
      <div className={`text-3xl font-black tabular-nums ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-bold text-muted">{suffix}</div>
      <div className="mt-1 text-[9.5px] font-black tracking-wide text-faint uppercase">{label}</div>
    </div>
  );
}
