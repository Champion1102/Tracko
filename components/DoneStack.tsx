"use client";

import { useState } from "react";
import { money } from "@/lib/money";
import { HabitRow } from "./HabitRow";
import { sfx } from "@/lib/sfx";
import type { HabitProgress } from "@/lib/scoring";

type Props = {
  items: HabitProgress[];
  day: string;
  perPoint: number;
  currency: string;
  idealBedtime?: string;
  idealWakeTime?: string;
};

/**
 * Finished habits collapse into a one-line receipt so the list above only
 * ever shows work. Opens into full rows in case something needs un-ticking.
 */
export function DoneStack({ items, day, perPoint, currency, idealBedtime, idealWakeTime }: Props) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  const earned = items.reduce((n, p) => n + p.points, 0) * perPoint;
  const names = items.map((p) => p.habit.name).join(" · ");

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => {
          sfx.tick();
          setOpen((o) => !o);
        }}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grass/20 text-grass">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-muted">{names}</span>
        <span className="shrink-0 text-[13px] font-black text-grass tabular-nums">
          +{money(earned, currency)}
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-line-soft border-t border-line-soft">
          {items.map((p) => (
            <HabitRow
              key={p.habit.id}
              p={p}
              day={day}
              perPoint={perPoint}
              currency={currency}
              idealBedtime={idealBedtime}
              idealWakeTime={idealWakeTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}
