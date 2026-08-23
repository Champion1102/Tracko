import { coachConfigured } from "@/lib/coach";
import { prettyDay } from "@/lib/dates";
import { money } from "@/lib/money";
import { loadState } from "@/lib/state";
import { DysonBuild } from "@/components/DysonBuild";
import { HabitIcon } from "@/components/HabitIcon";
import { RewardImage } from "@/components/RewardImage";

export const dynamic = "force-dynamic";

/** The daily glance: where the money stands, today, the last week. */
export default async function SponsorOverviewPage() {
  const s = await loadState();
  const { totals, todayScore, config, days } = s;
  const cur = config.currency;
  const done = todayScore.perHabit.filter((p) => p.done);
  const missing = todayScore.perHabit.filter((p) => !p.done);
  const recent = days.filter((d) => d.status !== "future").slice(-7).reverse();

  return (
    <div className="space-y-5">
      <section className="card p-4">
        <div className="flex items-center gap-4">
          {config.rewardImage ? (
            <RewardImage src={config.rewardImage} alt={config.rewardName} rewardPct={totals.rewardPct} size={110} />
          ) : (
            <DysonBuild rewardPct={totals.rewardPct} size={110} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.16em] text-faint uppercase">
              She&apos;s earned
            </p>
            <div className="text-[30px] leading-none font-black text-gold tabular-nums">
              {money(totals.earnedValue, cur)}
            </div>
            <p className="mt-0.5 text-[12px] font-bold text-muted">
              of {money(config.rewardPrice, cur)} · {totals.rewardPct.toFixed(1)}%
            </p>
            <div className="mt-2.5 h-3 overflow-hidden rounded-full border border-line bg-ink-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold"
                style={{ width: `${Math.max(totals.rewardPct, 1.5)}%` }}
              />
            </div>
            <p className={`mt-2 text-[11.5px] font-black uppercase ${totals.onTrack ? "text-grass" : "text-flame"}`}>
              {totals.onTrack ? "On track" : "Behind pace"}
            </p>
          </div>
        </div>
      </section>

      {(totals.yesterdayLost > 0 || totals.penaltyDays > 0) && (
        <section className="card border-flame/35 bg-flame/8 p-4">
          <p className="text-[10px] font-black tracking-[0.16em] text-flame uppercase">
            What slipping costs
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed font-bold text-text">
            {totals.yesterdayLost > 0 &&
              `Yesterday she left ${money(totals.yesterdayLost * totals.perPoint, cur)} on the table. `}
            {totals.penaltyDays > 0 &&
              `The penalty rule has taken ${money(totals.penaltyLost * totals.perPoint, cur)} across ${totals.penaltyDays} day${totals.penaltyDays === 1 ? "" : "s"}.`}
          </p>
        </section>
      )}

      <section className="grid grid-cols-4 gap-2">
        <Tile v={String(totals.currentStreak)} l="streak" tone="text-flame" />
        <Tile v={String(totals.perfectDays)} l="perfect" tone="text-grass" />
        <Tile v={String(totals.missedDays)} l="missed" tone="text-muted" />
        <Tile v={money(totals.actualPace * totals.perPoint, cur)} l="avg/day" tone="text-aqua" />
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Today</h2>
          <span className="text-[12px] font-black text-gold tabular-nums">
            {money(totals.todayValue, cur)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {done.map((p) => (
            <span key={p.habit.id} className="grid h-8 w-8 place-items-center rounded-lg bg-grass/20 text-grass">
              <HabitIcon icon={p.habit.icon} emoji={p.habit.emoji} size={17} />
            </span>
          ))}
          {missing.map((p) => (
            <span key={p.habit.id} className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-faint">
              <HabitIcon icon={p.habit.icon} emoji={p.habit.emoji} size={17} />
            </span>
          ))}
        </div>
        {missing.length > 0 && (
          <p className="mt-3 text-[12.5px] leading-snug font-semibold text-muted">
            Still open: {missing.map((p) => p.habit.name).join(", ")}.
          </p>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Last 7 days
        </h2>
        <ul className="space-y-2">
          {recent.map((d) => (
            <li key={d.day} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[11.5px] font-bold text-faint">
                {prettyDay(d.day)}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${d.pct >= 99.5 ? "bg-grass" : d.pct >= 70 ? "bg-gold" : "bg-flame"}`}
                  style={{ width: `${Math.max(d.pct, 2)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-[11.5px] font-black text-text tabular-nums">
                {money(d.points * totals.perPoint, cur)}
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

function Tile({ v, l, tone }: { v: string; l: string; tone: string }) {
  return (
    <div className="card p-2.5 text-center">
      <div className={`text-[15px] font-black tabular-nums ${tone}`}>{v}</div>
      <div className="text-[9px] font-black tracking-wide text-faint uppercase">{l}</div>
    </div>
  );
}
