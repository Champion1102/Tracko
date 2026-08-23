"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { setHabitValue, setSleepTimes, toggleSubItem } from "@/app/actions";
import { emitTick } from "@/lib/bus";
import { sleepDuration } from "@/lib/dates";
import { money } from "@/lib/money";
import { HabitIcon } from "./HabitIcon";
import { sfx } from "@/lib/sfx";
import type { HabitProgress } from "@/lib/scoring";

type Props = {
  p: HabitProgress;
  day: string;
  perPoint: number;
  currency: string;
  idealBedtime?: string;
  idealWakeTime?: string;
  locked?: boolean;
};

export function HabitCard({
  p,
  day,
  perPoint,
  currency,
  idealBedtime = "23:00",
  idealWakeTime = "07:00",
  locked = false,
}: Props) {
  const { habit } = p;
  const [value, setValue] = useState(p.value);
  const [subs, setSubs] = useState<boolean[]>(p.subDone);
  const [synced, setSynced] = useState({ value: p.value, subs: p.subDone });
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

  function commit(next: number) {
    if (locked) return;
    setValue(next);
    const willComplete = next >= (habit.kind === "binary" ? 1 : habit.target);
    if (willComplete && !done) sfx.done();
    else if (next > value) sfx.step();
    else sfx.tick();
    emitTick({ habitId: habit.id, habitName: habit.name, emoji: habit.emoji, completed: willComplete && !done });
    start(() => void setHabitValue(habit.id, day, next));
  }

  function commitSub(idx: number) {
    if (locked) return;
    const next = [...subs];
    next[idx] = !next[idx];
    setSubs(next);
    const willComplete = next.filter(Boolean).length >= habit.target;
    if (willComplete && !done) sfx.done();
    else sfx.step();
    emitTick({ habitId: habit.id, habitName: habit.name, emoji: habit.emoji, completed: willComplete && !done });
    start(() => void toggleSubItem(habit.id, day, idx));
  }

  return (
    <motion.div
      layout
      className={`card overflow-hidden transition-colors ${
        done ? "border-grass/70 bg-grass/10" : ""
      } ${pending ? "opacity-90" : ""}`}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="relative shrink-0">
          <div
            className={`grid h-11 w-11 place-items-center rounded-2xl ${
              done ? "bg-grass/20 text-grass" : "bg-surface-2 text-muted"
            }`}
          >
            <HabitIcon icon={habit.icon} emoji={habit.emoji} size={22} />
          </div>
          {done && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 14 }}
              className="absolute -right-1.5 -bottom-1.5 grid h-5 w-5 place-items-center rounded-full bg-grass text-[11px] font-black text-ink"
            >
              ✓
            </motion.div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-[15px] font-black text-text">{habit.name}</h3>
            <span
              className={`shrink-0 text-[12.5px] font-black tabular-nums ${
                done ? "text-grass" : "text-faint"
              }`}
            >
              {done
                ? `+${money(habit.points * perPoint, currency)}`
                : `${money(ratio * habit.points * perPoint, currency)} / ${money(habit.points * perPoint, currency)}`}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug font-semibold text-muted">
            {habit.blurb}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        {habit.kind === "binary" && (
          <button
            disabled={locked}
            onClick={() => commit(value >= 1 ? 0 : 1)}
            className={`press w-full rounded-xl py-3 text-[13px] font-black tracking-wide uppercase ${
              done
                ? "border-grass-deep bg-grass text-ink"
                : "border-line bg-surface-2 text-muted"
            }`}
          >
            {done ? "Done ✓" : "Mark done"}
          </button>
        )}

        {(habit.kind === "counter" || habit.kind === "duration") && (
          <Stepper
            habitKind={habit.kind}
            value={value}
            target={habit.target}
            unit={habit.unit}
            done={done}
            locked={locked}
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
            locked={locked}
          />
        )}

        {habit.kind === "checklist" && (
          <div className="flex flex-wrap gap-2">
            {(habit.subItems ?? []).map((label, i) => (
              <button
                key={label}
                disabled={locked}
                onClick={() => commitSub(i)}
                className={`press flex-1 rounded-xl px-3 py-2.5 text-[12.5px] font-black whitespace-nowrap ${
                  subs[i]
                    ? "border-grass-deep bg-grass text-ink"
                    : "border-line bg-surface-2 text-muted"
                }`}
              >
                {subs[i] ? "✓ " : ""}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function SleepLog({
  day,
  habitId,
  bedtime,
  wakeTime,
  idealBedtime,
  idealWakeTime,
  locked,
}: {
  day: string;
  habitId: string;
  bedtime?: string;
  wakeTime?: string;
  idealBedtime: string;
  idealWakeTime: string;
  locked: boolean;
}) {
  const [bed, setBed] = useState(bedtime ?? "");
  const [wake, setWake] = useState(wakeTime ?? "");
  const [synced, setSynced] = useState({ bedtime, wakeTime });
  const [pending, start] = useTransition();

  if (synced.bedtime !== bedtime || synced.wakeTime !== wakeTime) {
    setSynced({ bedtime, wakeTime });
    setBed(bedtime ?? "");
    setWake(wakeTime ?? "");
  }

  const minutes = bed && wake ? sleepDuration(bed, wake) : null;
  const hours = minutes === null ? null : minutes / 60;

  function save(nextBed: string, nextWake: string) {
    setBed(nextBed);
    setWake(nextWake);
    if (!nextBed || !nextWake) return;
    sfx.done();
    emitTick({ habitId, habitName: "Sleep", emoji: "🌙", completed: true });
    start(() => void setSleepTimes(habitId, day, nextBed, nextWake));
  }

  return (
    <div>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-[10.5px] font-black tracking-wide text-faint uppercase">
            In bed · aim {idealBedtime}
          </span>
          <input
            type="time"
            disabled={locked}
            value={bed}
            onChange={(e) => save(e.target.value, wake)}
            className="w-full rounded-xl border border-line bg-ink-2 px-3 py-2.5 text-[15px] font-black text-text outline-none focus:border-aqua"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-[10.5px] font-black tracking-wide text-faint uppercase">
            Awake · aim {idealWakeTime}
          </span>
          <input
            type="time"
            disabled={locked}
            value={wake}
            onChange={(e) => save(bed, e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-2 px-3 py-2.5 text-[15px] font-black text-text outline-none focus:border-aqua"
          />
        </label>
      </div>
      <p className={`mt-2 text-[12px] font-bold tabular-nums ${pending ? "text-faint" : "text-muted"}`}>
        {hours === null
          ? "Add both times to score this one."
          : `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m of sleep`}
      </p>
    </div>
  );
}

export function Stepper({
  habitKind,
  value,
  target,
  unit,
  done,
  locked,
  onSet,
}: {
  habitKind: "counter" | "duration";
  value: number;
  target: number;
  unit: string;
  done: boolean;
  locked: boolean;
  onSet: (n: number) => void;
}) {
  // Small targets get individually tappable pips; minutes get + chips.
  if (habitKind === "counter" && target <= 10) {
    return (
      <div>
        <div className="mb-2 flex gap-1.5">
          {Array.from({ length: target }, (_, i) => {
            const filled = value > i;
            return (
              <button
                key={i}
                disabled={locked}
                aria-label={`${i + 1} of ${target}`}
                onClick={() => onSet(value === i + 1 ? i : i + 1)}
                className={`h-9 flex-1 rounded-lg border-b-[3px] transition-colors ${
                  filled
                    ? "border-aqua/50 bg-aqua"
                    : "border-line bg-surface-2"
                }`}
              />
            );
          })}
        </div>
        <p className="text-[12px] font-bold text-faint tabular-nums">
          {value} / {target} {unit}
          {value > target ? " · overachiever" : ""}
        </p>
      </div>
    );
  }

  const steps = habitKind === "duration" ? (target >= 60 ? [15, 30, 60] : [5, 10, 15]) : [1];

  return (
    <div>
      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className={`h-full rounded-full ${done ? "bg-grass" : "bg-violet"}`}
          initial={false}
          animate={{ width: `${Math.min((value / target) * 100, 100)}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-[12px] font-bold text-faint tabular-nums">
          {value} / {target} {unit}
        </span>
        <div className="flex flex-1 gap-1.5">
          {steps.map((s) => (
            <button
              key={s}
              disabled={locked}
              onClick={() => onSet(value + s)}
              className="press flex-1 rounded-lg border-line bg-surface-2 py-2 text-[12px] font-black text-text"
            >
              +{s}
            </button>
          ))}
          <button
            disabled={locked || value === 0}
            onClick={() => onSet(0)}
            className="press rounded-lg border-line bg-surface-2 px-3 py-2 text-[12px] font-black text-faint"
            aria-label="Reset"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}
