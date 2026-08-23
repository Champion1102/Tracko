"use client";

import { useState, useTransition } from "react";
import { setHabitValue, toggleSubItem } from "@/app/actions";
import { emitTick } from "@/lib/bus";
import { money } from "@/lib/money";
import { SleepLog, Stepper } from "./HabitCard";
import { HabitIcon } from "./HabitIcon";
import { sfx } from "@/lib/sfx";
import type { HabitProgress } from "@/lib/scoring";
import type { Habit } from "@/lib/types";

/** Each habit keeps its own colour so the list scans by shape, not by reading. */
const TINTS: Record<string, { fg: string; bg: string; bar: string }> = {
  sugar: { fg: "text-flame", bg: "bg-flame/15", bar: "bg-flame" },
  code: { fg: "text-violet", bg: "bg-violet/15", bar: "bg-violet" },
  leaf: { fg: "text-grass", bg: "bg-grass/15", bar: "bg-grass" },
  droplet: { fg: "text-aqua", bg: "bg-aqua/15", bar: "bg-aqua" },
  lotus: { fg: "text-rose", bg: "bg-rose/15", bar: "bg-rose" },
  sparkle: { fg: "text-rose", bg: "bg-rose/15", bar: "bg-rose" },
  cup: { fg: "text-gold", bg: "bg-gold/15", bar: "bg-gold" },
  moon: { fg: "text-gold", bg: "bg-gold/15", bar: "bg-gold" },
  dumbbell: { fg: "text-flame", bg: "bg-flame/15", bar: "bg-flame" },
  megaphone: { fg: "text-violet", bg: "bg-violet/15", bar: "bg-violet" },
};

export function habitTint(habit: Habit) {
  return TINTS[habit.icon ?? ""] ?? { fg: "text-violet", bg: "bg-violet/15", bar: "bg-violet" };
}

/** The one-fixed-step nudge the collapsed row offers. */
export function quickStep(habit: Habit): number {
  if (habit.kind === "duration") return habit.target >= 60 ? 30 : 10;
  return 1;
}

type Props = {
  p: HabitProgress;
  day: string;
  perPoint: number;
  currency: string;
  idealBedtime?: string;
  idealWakeTime?: string;
};

/**
 * One habit as a compact, expandable row. Collapsed it offers exactly one
 * quick action; tapping the body opens the full controls from HabitCard.
 */
export function HabitRow({
  p,
  day,
  perPoint,
  currency,
  idealBedtime = "23:00",
  idealWakeTime = "07:00",
}: Props) {
  const { habit } = p;
  const tint = habitTint(habit);
  const [value, setValue] = useState(p.value);
  const [subs, setSubs] = useState<boolean[]>(p.subDone);
  const [synced, setSynced] = useState({ value: p.value, subs: p.subDone });
  const [open, setOpen] = useState(habit.kind === "sleep" && !p.done);
  const [pending, start] = useTransition();

  // Server is the source of truth. Re-sync during render (rather than in an
  // effect) so an optimistic value is corrected before anything is painted.
  if (synced.value !== p.value || synced.subs !== p.subDone) {
    setSynced({ value: p.value, subs: p.subDone });
    setValue(p.value);
    setSubs(p.subDone);
  }

  const ratio =
    habit.kind === "sleep"
      ? p.ratio
      : habit.kind === "checklist"
        ? Math.min(subs.filter(Boolean).length / habit.target, 1)
        : habit.kind === "binary"
          ? (value >= 1 ? 1 : 0)
          : Math.min(value / habit.target, 1);
  const done = ratio >= 1;
  const worth = habit.points * perPoint;

  function commit(next: number) {
    setValue(next);
    const willComplete = next >= (habit.kind === "binary" ? 1 : habit.target);
    if (willComplete && !done) sfx.done();
    else if (next > value) sfx.step();
    else sfx.tick();
    emitTick({ habitId: habit.id, habitName: habit.name, emoji: habit.emoji, completed: willComplete && !done });
    start(() => void setHabitValue(habit.id, day, next));
  }

  function commitSub(idx: number) {
    const next = [...subs];
    next[idx] = !next[idx];
    setSubs(next);
    const willComplete = next.filter(Boolean).length >= habit.target;
    if (willComplete && !done) sfx.done();
    else sfx.step();
    emitTick({ habitId: habit.id, habitName: habit.name, emoji: habit.emoji, completed: willComplete && !done });
    start(() => void toggleSubItem(habit.id, day, idx));
  }

  const sub =
    habit.kind === "binary"
      ? money(worth, currency)
      : habit.kind === "sleep"
        ? done
          ? `logged · +${money(p.points * perPoint, currency)}`
          : `aim ${idealBedtime} → ${idealWakeTime} · ${money(worth, currency)}`
        : habit.kind === "checklist"
          ? `${subs.filter(Boolean).length} of ${habit.target} · ${money(worth, currency)}`
          : `${value}/${habit.target} ${habit.unit} · ${money(ratio * worth, currency)} of ${money(worth, currency)}`;

  return (
    <div className={`transition-opacity ${pending ? "opacity-90" : ""}`}>
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <span
            className={`grid h-9.5 w-9.5 shrink-0 place-items-center rounded-xl ${
              done ? "bg-grass/20 text-grass" : `${tint.bg} ${tint.fg}`
            }`}
          >
            <HabitIcon icon={habit.icon} emoji={habit.emoji} size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[13.5px] leading-tight font-black text-text">
                {habit.name}
              </span>
              <svg
                width="11"
                height="11"
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
            </span>
            <span className={`block text-[11px] font-bold tabular-nums ${done ? "text-grass" : "text-faint"}`}>
              {sub}
            </span>
            {(habit.kind === "counter" || habit.kind === "duration") && !done && (
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className={`block h-full rounded-full ${tint.bar}`}
                  style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                />
              </span>
            )}
          </span>
        </button>

        {/* the one quick action */}
        {habit.kind === "binary" && (
          <button
            onClick={() => commit(value >= 1 ? 0 : 1)}
            className={`press shrink-0 rounded-xl px-3.5 py-2 text-[11.5px] font-black tracking-wide uppercase ${
              done ? "border-grass-deep bg-grass text-ink" : "border-line bg-surface-2 text-muted"
            }`}
          >
            {done ? "✓" : "Done"}
          </button>
        )}
        {(habit.kind === "counter" || habit.kind === "duration") && (
          <button
            onClick={() => commit(value + quickStep(habit))}
            className="press shrink-0 rounded-xl border-line bg-surface-2 px-3.5 py-2 text-[11.5px] font-black text-text tabular-nums"
          >
            +{quickStep(habit)}
          </button>
        )}
        {habit.kind === "checklist" && (
          <span className="flex shrink-0 gap-1.5">
            {(habit.subItems ?? []).map((label, i) => (
              <button
                key={label}
                onClick={() => commitSub(i)}
                aria-label={label}
                className={`press rounded-lg px-2.5 py-2 text-[10.5px] font-black uppercase ${
                  subs[i] ? "border-grass-deep bg-grass text-ink" : "border-line bg-surface-2 text-muted"
                }`}
              >
                {label.slice(0, 2)}
              </button>
            ))}
          </span>
        )}
        {habit.kind === "sleep" && !open && (
          <button
            onClick={() => setOpen(true)}
            className="press shrink-0 rounded-xl border-line bg-surface-2 px-3.5 py-2 text-[11.5px] font-black tracking-wide text-muted uppercase"
          >
            Log
          </button>
        )}
      </div>

      {open && (
        <div className="px-3.5 pt-0.5 pb-3.5">
          <p className="mb-2.5 text-[12px] leading-snug font-semibold text-muted">{habit.blurb}</p>
          {(habit.kind === "counter" || habit.kind === "duration") && (
            <Stepper
              habitKind={habit.kind}
              value={value}
              target={habit.target}
              unit={habit.unit}
              done={done}
              locked={false}
              onSet={commit}
            />
          )}
          {habit.kind === "sleep" && (
            <SleepLog
              day={day}
              habitId={habit.id}
              bedtime={p.bedtime}
              wakeTime={p.wakeTime}
              idealBedtime={idealBedtime}
              idealWakeTime={idealWakeTime}
              locked={false}
            />
          )}
          {habit.kind === "checklist" && (
            <div className="flex flex-wrap gap-2">
              {(habit.subItems ?? []).map((label, i) => (
                <button
                  key={label}
                  onClick={() => commitSub(i)}
                  className={`press flex-1 rounded-xl px-3 py-2.5 text-[12.5px] font-black whitespace-nowrap ${
                    subs[i] ? "border-grass-deep bg-grass text-ink" : "border-line bg-surface-2 text-muted"
                  }`}
                >
                  {subs[i] ? "✓ " : ""}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
