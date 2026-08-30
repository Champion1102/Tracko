"use client";

import { useState } from "react";
import { addDays, addMonths, daysOfMonth, monthLabel, prettyDay, weekday } from "@/lib/dates";
import type { DayStatus, HabitProgress } from "@/lib/scoring";
import { sfx } from "@/lib/sfx";
import type { Habit } from "@/lib/types";
import { DayRing } from "./DayRing";
import { Icon } from "./Icon";
import { TickRow } from "./TickRow";

export type DayLite = {
  day: string;
  index: number;
  pct: number;
  status: DayStatus;
  done: number;
  total: number;
};

export type ProgressLite = {
  habitId: string;
  value: number;
  subDone: boolean[];
  note?: string;
  ratio: number;
  done: boolean;
};

/**
 * The challenge as a calendar. Tap any day to see its ticks; yesterday stays
 * editable until tonight, which is the whole of the "fix it" feature now.
 */
export function MonthGrid({
  days,
  details,
  habits,
  today,
}: {
  days: DayLite[];
  /** Per elapsed day, that day's per-habit state — slim, so 100 days stay light. */
  details: Record<string, ProgressLite[]>;
  habits: Habit[];
  today: string;
}) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const habitsById = new Map(habits.map((h) => [h.id, h]));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);

  const firstMonth = days[0]?.day.slice(0, 7) ?? month;
  const lastMonth = days[days.length - 1]?.day.slice(0, 7) ?? month;
  const canPrev = addMonths(month, -1) >= firstMonth;
  const canNext = addMonths(month, 1) <= lastMonth;

  const cells = daysOfMonth(month);
  const lead = weekday(cells[0]);
  const sel = byDay.get(selected);
  const detail = details[selected];
  const yesterday = addDays(today, -1);
  const editable = selected === today || selected === yesterday;

  const move = (n: number) => {
    sfx.tick();
    setMonth((m) => addMonths(m, n));
  };

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => move(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="grid h-8 w-8 place-items-center rounded-full text-muted disabled:opacity-30"
        >
          <Icon.chevronLeft size={17} />
        </button>
        <h2 className="text-[14px] font-black text-text">{monthLabel(month)}</h2>
        <button
          onClick={() => move(1)}
          disabled={!canNext}
          aria-label="Next month"
          className="grid h-8 w-8 place-items-center rounded-full text-muted disabled:opacity-30"
        >
          <Icon.chevronRight size={17} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-2.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
          <span key={i} className="text-center text-[10px] font-bold text-faint">
            {l}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {cells.map((day) => {
          const d = byDay.get(day);
          if (!d) {
            // Outside the challenge window — present, but not part of the story.
            return (
              <span
                key={day}
                className="grid place-items-center text-[11px] font-semibold text-faint/50 tabular-nums"
              >
                {Number(day.slice(8))}
              </span>
            );
          }
          return (
            <span key={day} className="grid place-items-center">
              <button
                onClick={() => {
                  sfx.tick();
                  setSelected(day);
                }}
                aria-label={prettyDay(day)}
                aria-pressed={selected === day}
              >
                <DayRing
                  pct={d.pct}
                  status={d.status}
                  size={34}
                  stroke={2.5}
                  today={day === today && selected !== day}
                  selected={selected === day}
                >
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      d.status === "perfect"
                        ? "text-white"
                        : d.status === "future"
                          ? "text-faint"
                          : "text-text"
                    }`}
                  >
                    {Number(day.slice(8))}
                  </span>
                </DayRing>
              </button>
            </span>
          );
        })}
      </div>

      {sel && (
        <div className="mt-4 border-t border-line-soft pt-3">
          <div className="flex items-baseline justify-between px-1">
            <p className="text-[12.5px] font-bold text-text">
              {prettyDay(sel.day)} · Day {sel.index}
            </p>
            <p className="text-[11.5px] font-bold text-faint tabular-nums">
              {sel.status === "future"
                ? "not yet"
                : selected === yesterday
                  ? "editable until tonight"
                  : `${sel.done}/${sel.total}`}
            </p>
          </div>

          {sel.status !== "future" && detail && (
            <div className="-mx-2 mt-1 divide-y divide-line-soft">
              {detail.map((li) => {
                const habit = habitsById.get(li.habitId);
                if (!habit) return null;
                const p: HabitProgress = {
                  habit,
                  value: li.value,
                  subDone: li.subDone,
                  note: li.note,
                  ratio: li.ratio,
                  done: li.done,
                };
                return <TickRow key={li.habitId} p={p} day={selected} readOnly={!editable} />;
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
