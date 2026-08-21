"use client";

import { useTransition } from "react";
import { motion } from "motion/react";
import { setHabitValue } from "@/app/actions";
import { emitTick } from "@/lib/bus";
import { money } from "@/lib/money";
import { HabitIcon } from "./HabitIcon";
import { sfx } from "@/lib/sfx";
import type { WeekScore } from "@/lib/scoring";

export function WeeklyCard({
  row,
  week,
  today,
  valueToday,
  perPoint,
  currency,
}: {
  row: WeekScore["perHabit"][number];
  week: WeekScore["week"];
  today: string;
  valueToday: number;
  perPoint: number;
  currency: string;
}) {
  const [pending, start] = useTransition();
  const { habit, value, weeklyTarget, done } = row;
  const todayIdx = week.days.indexOf(today);

  function log(delta: number) {
    const next = Math.max(0, valueToday + delta);
    if (delta > 0) sfx.done();
    else sfx.tick();
    emitTick({ habitId: habit.id, habitName: habit.name, emoji: habit.emoji, completed: delta > 0 });
    start(() => void setHabitValue(habit.id, today, next));
  }

  return (
    <motion.div
      layout
      className={`card p-4 ${done ? "border-violet/60 bg-violet/10" : ""} ${pending ? "opacity-90" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            done ? "bg-violet/20 text-violet" : "bg-surface-2 text-muted"
          }`}
        >
          <HabitIcon icon={habit.icon} emoji={habit.emoji} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-[15px] font-black text-text">{habit.name}</h3>
            <span className={`shrink-0 text-[12.5px] font-black tabular-nums ${done ? "text-violet" : "text-faint"}`}>
              {value}/{weeklyTarget} · {money(Math.min(value, weeklyTarget) * habit.points * perPoint, currency)}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug font-semibold text-muted">{habit.blurb}</p>
        </div>
      </div>

      <div className="mt-3 mb-3 flex gap-1.5">
        {week.days.map((d, i) => {
          const isToday = d === today;
          const filled = i < Math.min(value, weeklyTarget);
          return (
            <div
              key={d}
              className={`h-2 flex-1 rounded-full ${
                filled ? "bg-violet" : isToday ? "bg-surface-2 ring-1 ring-violet/50" : "bg-surface-2"
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => log(1)}
          disabled={todayIdx < 0}
          className={`press flex-1 rounded-xl py-3 text-[13px] font-black tracking-wide uppercase ${
            valueToday > 0 ? "border-violet/60 bg-violet text-ink" : "border-line bg-surface-2 text-muted"
          }`}
        >
          {valueToday > 0 ? `Logged today × ${valueToday}` : `Log ${habit.unit.replace(/s$/, "")}`}
        </button>
        {valueToday > 0 && (
          <button
            onClick={() => log(-1)}
            className="press rounded-xl border-line bg-surface-2 px-4 py-3 text-[13px] font-black text-faint"
            aria-label="Undo one"
          >
            −
          </button>
        )}
      </div>
    </motion.div>
  );
}
