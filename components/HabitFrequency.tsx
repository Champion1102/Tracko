"use client";

import { useState } from "react";
import { FREQUENCY_LABEL, type Frequency, type HabitStat } from "@/lib/scoring";
import { sfx } from "@/lib/sfx";
import { HabitIcon } from "./HabitIcon";
import { Icon } from "./Icon";

const ORDER: Frequency[] = ["daily", "most", "few", "rare"];

const fmtPerWeek = (n: number) =>
  (Math.round(Math.min(n, 7) * 10) / 10).toFixed(1).replace(/\.0$/, "");

/**
 * The honest answer to "which habits am I actually doing?" — grouped by how
 * often they really happen, not by how often they were meant to. Tap a habit
 * for its last five weeks as dots.
 */
export function HabitFrequency({ stats }: { stats: HabitStat[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const young = (stats[0]?.elapsed ?? 0) < 7;
  const groups = ORDER.map((f) => ({
    f,
    rows: stats.filter((st) => st.frequency === f),
  })).filter((g) => g.rows.length > 0);

  if (!groups.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="px-1 text-[16px] font-black text-text">Habits</h2>
      {groups.map(({ f, rows }) => (
        <div key={f}>
          <h3 className="mb-1.5 px-1 text-[12px] font-bold text-faint">{FREQUENCY_LABEL[f]}</h3>
          <div className="card divide-y divide-line-soft">
            {rows.map((st) => {
              const expanded = open === st.habit.id;
              return (
                <div key={st.habit.id}>
                  <button
                    onClick={() => {
                      sfx.tick();
                      setOpen(expanded ? null : st.habit.id);
                    }}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                      <HabitIcon icon={st.habit.icon} emoji={st.habit.emoji} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-text">
                        {st.habit.name}
                      </span>
                      <span className="block text-[11.5px] font-semibold text-faint tabular-nums">
                        {st.hit} of {st.elapsed} days
                        {!young && ` · ≈ ${fmtPerWeek(st.perWeek)}× a week`}
                        {st.run >= 2 && ` · ${st.run} in a row`}
                      </span>
                    </span>
                    {expanded ? (
                      <Icon.chevronRight size={14} className="shrink-0 rotate-90 text-faint" />
                    ) : (
                      <span className="flex shrink-0 items-center gap-[3px]" aria-hidden>
                        {st.recent.slice(-7).map((done, i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full ${done ? "bg-grass" : "bg-line"}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-3.5 pl-[64px]">
                      <div className="grid w-fit grid-cols-7 gap-[5px]" aria-hidden>
                        {st.recent.map((done, i) => (
                          <span
                            key={i}
                            className={`h-2.5 w-2.5 rounded-[4px] ${done ? "bg-grass" : "bg-surface-2"}`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-faint tabular-nums">
                        Last 5 weeks · best run {st.bestRun} day{st.bestRun === 1 ? "" : "s"} ·{" "}
                        {Math.round(st.pct)}% overall
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
