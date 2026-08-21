"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { deleteHabit, saveHabit } from "@/app/actions";
import { sfx } from "@/lib/sfx";
import type { Habit, HabitKind } from "@/lib/types";
import { HABIT_ICON_KEYS, HabitIcon } from "./HabitIcon";

const KINDS: { value: HabitKind; label: string; hint: string }[] = [
  { value: "binary", label: "Yes / no", hint: "One tap to mark done" },
  { value: "counter", label: "Count", hint: "Tap up to a target, like 8 glasses" },
  { value: "duration", label: "Minutes", hint: "Add time until you hit the target" },
  { value: "checklist", label: "Checklist", hint: "Several sub-items, all needed" },
];

const blank = (): Habit => ({
  id: `h_${Math.random().toString(36).slice(2, 9)}`,
  slug: `custom-${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  blurb: "",
  emoji: "✅",
  kind: "binary",
  cadence: "daily",
  points: 10,
  target: 1,
  unit: "",
  sortOrder: 99,
  active: true,
});

export function HabitEditor({ habits }: { habits: Habit[] }) {
  const [editing, setEditing] = useState<Habit | null>(null);
  const dailyTotal = habits
    .filter((h) => h.active && h.cadence === "daily")
    .reduce((s, h) => s + h.points, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Habits</h2>
        <span
          className={`text-[11px] font-black tabular-nums ${
            dailyTotal === 100 ? "text-grass" : "text-flame"
          }`}
        >
          {dailyTotal} pts / day
        </span>
      </div>

      {dailyTotal !== 100 && (
        <p className="card border-flame/40 bg-flame/8 p-3 text-[12px] leading-snug font-bold text-muted">
          Daily habits add up to {dailyTotal}, not 100. Everything still works — percentages are
          relative — but a perfect day won&apos;t read as a clean 100.
        </p>
      )}

      <ul className="space-y-2">
        {habits.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => {
                sfx.tick();
                setEditing(h);
              }}
              className={`card flex w-full items-center gap-3 p-3 text-left ${
                h.active ? "" : "opacity-50"
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                <HabitIcon icon={h.icon} emoji={h.emoji} size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-black text-text">{h.name}</span>
                <span className="block text-[11px] font-bold text-faint">
                  {h.cadence === "weekly" ? `weekly · ${h.target} ${h.unit}` : `daily · ${h.points} pts`}
                  {h.active ? "" : " · off"}
                </span>
              </span>
              <span className="text-faint">›</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          sfx.tick();
          setEditing(blank());
        }}
        className="press w-full rounded-2xl border-line bg-surface-2 py-3.5 text-[12.5px] font-black tracking-wide text-text uppercase"
      >
        + Add a habit
      </button>

      <AnimatePresence>
        {editing && <Sheet habit={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </section>
  );
}

function Sheet({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const [d, setD] = useState<Habit>(habit);
  const [pending, start] = useTransition();
  const set = <K extends keyof Habit>(k: K, v: Habit[K]) => setD((p) => ({ ...p, [k]: v }));

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end bg-ink/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="safe-bottom max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border-t-2 border-line bg-surface p-5 pb-8"
        initial={{ y: 420 }}
        animate={{ y: 0 }}
        exit={{ y: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold text-muted">Name</span>
            <input
              className={input}
              value={d.name}
              placeholder="Read 20 pages"
              onChange={(e) => set("name", e.target.value)}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[11.5px] font-bold text-muted">Icon</span>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_ICON_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => set("icon", key)}
                  aria-label={key}
                  className={`grid h-10 w-10 place-items-center rounded-xl border ${
                    d.icon === key
                      ? "border-gold/60 bg-gold/20 text-gold"
                      : "border-line bg-surface-2 text-muted"
                  }`}
                >
                  <HabitIcon icon={key} size={20} />
                </button>
              ))}
              <input
                className={`h-10 w-16 rounded-xl border border-line bg-ink-2 text-center text-lg outline-none focus:border-gold`}
                value={d.emoji}
                maxLength={4}
                aria-label="Or an emoji"
                onChange={(e) => setD((p) => ({ ...p, emoji: e.target.value, icon: undefined }))}
              />
            </div>
            <p className="mt-1.5 text-[11px] font-semibold text-faint">
              Pick a drawn icon, or type an emoji to use that instead.
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold text-muted">One-line reminder</span>
            <input
              className={input}
              value={d.blurb}
              placeholder="Why this one matters"
              onChange={(e) => set("blurb", e.target.value)}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[11.5px] font-bold text-muted">How it&apos;s tracked</span>
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  onClick={() => set("kind", k.value)}
                  className={`press rounded-xl px-3 py-2.5 text-left ${
                    d.kind === k.value
                      ? "border-aqua/50 bg-aqua/20"
                      : "border-line bg-surface-2"
                  }`}
                >
                  <span className="block text-[12.5px] font-black text-text">{k.label}</span>
                  <span className="block text-[10px] leading-tight font-bold text-faint">{k.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {d.kind === "checklist" && (
            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-bold text-muted">
                Sub-items (comma separated)
              </span>
              <input
                className={input}
                value={(d.subItems ?? []).join(", ")}
                onChange={(e) => {
                  const items = e.target.value.split(",").map((x) => x.trim()).filter(Boolean);
                  setD((p) => ({ ...p, subItems: items, target: Math.max(items.length, 1) }));
                }}
              />
            </label>
          )}

          <div className="grid grid-cols-3 gap-3">
            <label>
              <span className="mb-1.5 block text-[11.5px] font-bold text-muted">Points</span>
              <input
                type="number"
                min={1}
                className={input}
                value={d.points}
                onChange={(e) => set("points", Number(e.target.value))}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[11.5px] font-bold text-muted">Target</span>
              <input
                type="number"
                min={1}
                disabled={d.kind === "binary" || d.kind === "checklist"}
                className={`${input} disabled:opacity-40`}
                value={d.target}
                onChange={(e) => set("target", Number(e.target.value))}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[11.5px] font-bold text-muted">Unit</span>
              <input
                className={input}
                value={d.unit}
                placeholder="min"
                onChange={(e) => set("unit", e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["daily", "weekly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => set("cadence", c)}
                className={`press rounded-xl py-2.5 text-[12.5px] font-black capitalize ${
                  d.cadence === c ? "border-violet/60 bg-violet/25 text-text" : "border-line bg-surface-2 text-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={() => set("active", !d.active)}
            className="flex w-full items-center justify-between py-1"
          >
            <span className="text-[14px] font-bold text-text">Active</span>
            <span className={`h-7 w-12 rounded-full transition-colors ${d.active ? "bg-grass" : "bg-surface-2"} relative`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${d.active ? "left-6" : "left-1"}`} />
            </span>
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            disabled={pending || !d.name.trim()}
            onClick={() => {
              sfx.done();
              start(async () => {
                await saveHabit({ ...d, slug: d.slug || d.name.toLowerCase().replace(/\s+/g, "-") });
                onClose();
              });
            }}
            className="press flex-1 rounded-2xl border-grass-deep bg-grass py-3.5 text-[13px] font-black tracking-wide text-ink uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="press rounded-2xl border-line bg-surface-2 px-5 py-3.5 text-[13px] font-black text-text uppercase"
          >
            Cancel
          </button>
        </div>

        <button
          disabled={pending}
          onClick={() => {
            start(async () => {
              await deleteHabit(d.id);
              onClose();
            });
          }}
          className="mt-3 w-full py-2 text-[11.5px] font-black tracking-wide text-flame uppercase"
        >
          Delete habit and all its history
        </button>
      </motion.div>
    </motion.div>
  );
}

const input =
  "w-full rounded-xl border-2 border-line bg-ink-2 px-3.5 py-2.5 text-[14px] font-bold text-text outline-none focus:border-aqua";
