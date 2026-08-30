import { moodFace } from "@/lib/moods";
import type { JournalMood } from "@/lib/types";

/**
 * The small analytics on Progress. One hue does all the data ink (green =
 * done, neutral track behind it), numbers stay in text tokens, bars grow from
 * the baseline with softly rounded ends — meters, not dashboards.
 */

export function WeekCompare({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
  const max = Math.max(thisWeek, lastWeek, 1);
  const delta = thisWeek - lastWeek;

  return (
    <section className="card p-4">
      <h2 className="text-[12px] font-bold text-faint">Ticks, week on week</h2>
      <div className="mt-3 space-y-2.5">
        <Bar label="This week" value={thisWeek} max={max} strong />
        <Bar label="Last week" value={lastWeek} max={max} />
      </div>
      <p className={`mt-2.5 text-[12px] font-bold ${delta > 0 ? "text-grass" : "text-muted"}`}>
        {delta > 0
          ? `${delta} more than last week.`
          : delta < 0
            ? `${-delta} fewer than last week. Still counts.`
            : "Dead level with last week."}
      </p>
    </section>
  );
}

function Bar({
  label,
  value,
  max,
  strong = false,
}: {
  label: string;
  value: number;
  max: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[70px] shrink-0 text-[11.5px] font-bold text-muted">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${strong ? "bg-grass" : "bg-line"}`}
          style={{ width: `${Math.max((value / max) * 100, 2)}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-[12px] font-black text-text tabular-nums">
        {value}
      </span>
    </div>
  );
}

export type WeekdaySlice = { label: string; pct: number; count: number };

/** Which days of the week actually go well — averaged over the whole run. */
export function WeekdayBars({ pattern }: { pattern: WeekdaySlice[] }) {
  const withData = pattern.filter((p) => p.count > 0);
  if (!withData.length) return null;
  const best = Math.max(...withData.map((p) => p.pct));

  return (
    <section className="card p-4">
      <h2 className="text-[12px] font-bold text-faint">Your week&apos;s shape</h2>
      <div className="mt-3 flex items-end justify-between gap-2">
        {pattern.map((p, i) => {
          const isBest = p.count > 0 && p.pct === best && best > 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`text-[10px] font-bold tabular-nums ${
                  isBest ? "text-grass" : "text-transparent"
                }`}
                aria-hidden={!isBest}
              >
                {Math.round(p.pct)}%
              </span>
              <div
                className="flex h-16 w-full max-w-[26px] items-end overflow-hidden rounded-t-[4px] bg-surface-2"
                title={p.count ? `${p.label}: ${Math.round(p.pct)}% on average` : undefined}
              >
                <div
                  className={`w-full rounded-t-[4px] ${isBest ? "bg-grass" : "bg-grass/55"}`}
                  style={{ height: `${Math.max(p.pct, p.count ? 3 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-faint">{p.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The last fortnight of journal moods, oldest first. Only she sees this page. */
export function MoodStrip({ days }: { days: { day: string; mood: JournalMood | null }[] }) {
  const felt = days.filter((d) => d.mood !== null) as { day: string; mood: JournalMood }[];
  if (!felt.length) return null;
  const avg = Math.round(felt.reduce((n, d) => n + d.mood, 0) / felt.length) as JournalMood;

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[12px] font-bold text-faint">How you felt</h2>
        <span className="text-[12px] font-bold text-muted">mostly {moodFace(avg)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between" aria-label="Moods, last two weeks">
        {days.map((d) => (
          <span key={d.day} className="grid h-6 w-5 place-items-center">
            {d.mood !== null ? (
              <span className="text-[15px]">{moodFace(d.mood)}</span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-line" aria-hidden />
            )}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[10.5px] font-semibold text-faint">Last two weeks, from your journal.</p>
    </section>
  );
}
