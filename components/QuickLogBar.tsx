"use client";

import { useTransition } from "react";
import { setHabitValue, toggleSubItem } from "@/app/actions";
import { emitTick } from "@/lib/bus";
import { habitTint, quickStep } from "./HabitRow";
import { HabitIcon } from "./HabitIcon";
import { sfx } from "@/lib/sfx";
import type { HabitProgress } from "@/lib/scoring";

type Props = {
  items: HabitProgress[];
  day: string;
};

/**
 * One-tap logging from anywhere on the page, docked above the tab bar.
 * Only habits that can be advanced with a single tap appear (sleep needs
 * its time inputs, so it stays in the list). Disappears when the day is done.
 */
export function QuickLogBar({ items, day }: Props) {
  const [, start] = useTransition();

  const quick = items.filter((p) => !p.done && p.habit.kind !== "sleep").slice(0, 6);
  if (quick.length === 0) return null;

  function tap(p: HabitProgress) {
    const { habit } = p;
    if (habit.kind === "checklist") {
      const idx = p.subDone.findIndex((s) => !s);
      if (idx === -1) return;
      const willComplete = p.subDone.filter(Boolean).length + 1 >= habit.target;
      if (willComplete) sfx.done();
      else sfx.step();
      emitTick({ habitId: habit.id, habitName: habit.name, emoji: habit.emoji, completed: willComplete });
      start(() => void toggleSubItem(habit.id, day, idx));
      return;
    }
    const next = habit.kind === "binary" ? 1 : p.value + quickStep(habit);
    const willComplete = next >= (habit.kind === "binary" ? 1 : habit.target);
    if (willComplete) sfx.done();
    else sfx.step();
    emitTick({ habitId: habit.id, habitName: habit.name, emoji: habit.emoji, completed: willComplete });
    start(() => void setHabitValue(habit.id, day, next));
  }

  return (
    <div
      className="fixed inset-x-0 z-20"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 58px)" }}
    >
      <div className="mx-auto max-w-md px-4 pb-2">
        <div className="flex items-center gap-2.5 rounded-2xl border border-line-soft bg-ink-2/95 px-3.5 py-2 shadow-lg backdrop-blur-xl">
          <span className="shrink-0 text-[9.5px] leading-tight font-black tracking-wide text-faint uppercase">
            Quick
            <br />
            log
          </span>
          <div className="flex flex-1 items-center justify-around gap-1.5 overflow-x-auto">
            {quick.map((p) => {
              const tint = habitTint(p.habit);
              const count =
                p.habit.kind === "counter" || p.habit.kind === "duration"
                  ? p.value
                  : p.habit.kind === "checklist"
                    ? p.subDone.filter(Boolean).length
                    : 0;
              return (
                <button
                  key={p.habit.id}
                  onClick={() => tap(p)}
                  aria-label={`Log ${p.habit.name}`}
                  className={`relative grid h-10.5 w-10.5 shrink-0 place-items-center rounded-xl ${tint.bg} ${tint.fg} active:scale-90 transition-transform`}
                >
                  <HabitIcon icon={p.habit.icon} emoji={p.habit.emoji} size={20} />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-surface-2 px-0.5 text-[8.5px] leading-none font-black text-muted ring-2 ring-ink-2 tabular-nums">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
