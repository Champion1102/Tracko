"use client";

import { useState, useTransition } from "react";
import { resetStartDate, updateDeal } from "@/app/actions";
import { money } from "@/lib/money";
import { sfx } from "@/lib/sfx";
import type { Config } from "@/lib/types";

export function DealSettings({ config, maxPoints }: { config: Config; maxPoints: number }) {
  const [d, setD] = useState(config);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [resetDone, setResetDone] = useState(false);
  const [resetting, startReset] = useTransition();

  const dirty = JSON.stringify(d) !== JSON.stringify(config);
  const targetPoints = (maxPoints * Number(d.rewardTargetPct)) / 100;
  const perPoint = targetPoints > 0 ? Number(d.rewardPrice) / targetPoints : 0;

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setD((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Who</h2>
        <Field label="Her name">
          <input className={input} value={d.heroName} placeholder="e.g. Riya" onChange={(e) => set("heroName", e.target.value)} />
        </Field>
        <Field label="Your name (signs the letters)">
          <input className={input} value={d.sponsorName} placeholder="e.g. Ritesh" onChange={(e) => set("sponsorName", e.target.value)} />
        </Field>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">The prize</h2>
        <Field label="What she's earning">
          <input className={input} value={d.rewardName} onChange={(e) => set("rewardName", e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Price">
              <input
                type="number"
                min={0}
                className={input}
                value={d.rewardPrice}
                onChange={(e) => set("rewardPrice", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Symbol">
            <input className={input} value={d.currency} maxLength={3} onChange={(e) => set("currency", e.target.value)} />
          </Field>
        </div>
        <Field label="Photo (drop a file in /public, then put its path here)">
          <input
            className={input}
            value={d.rewardImage}
            placeholder="/reward.png"
            onChange={(e) => set("rewardImage", e.target.value)}
          />
        </Field>
        <p className="rounded-xl bg-gold/10 px-3 py-2.5 text-[12px] leading-snug font-bold text-gold">
          Each point she ticks is worth {money(perPoint, d.currency)}. A perfect day earns her{" "}
          {money(perPoint * 100, d.currency)}.
        </p>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">The rules</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unlocks at %">
            <input type="number" min={50} max={100} className={input} value={d.rewardTargetPct} onChange={(e) => set("rewardTargetPct", Number(e.target.value))} />
          </Field>
          <Field label="Streak freezes">
            <input type="number" min={0} max={10} className={input} value={d.freezesTotal} onChange={(e) => set("freezesTotal", Number(e.target.value))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input type="date" className={input} value={d.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Total days">
            <input type="number" min={7} max={365} className={input} value={d.totalDays} onChange={(e) => set("totalDays", Number(e.target.value))} />
          </Field>
        </div>
        <button
          type="button"
          disabled={resetting}
          onClick={() => {
            sfx.done();
            setResetDone(false);
            startReset(async () => {
              const today = await resetStartDate();
              set("startDate", today);
              setResetDone(true);
            });
          }}
          className="press w-full rounded-xl border-line bg-surface-2 py-3 text-[12px] font-black tracking-wide text-text uppercase disabled:text-faint"
        >
          {resetting ? "Resetting…" : resetDone ? "Done — today is Day 1 ✓" : "Restart the clock — make today Day 1"}
        </button>
        <p className="text-[11.5px] leading-snug font-semibold text-muted">
          Saves immediately, no need to hit the button below. Use it if the challenge is counting
          from the wrong day — like showing it starts tomorrow.
        </p>
        <Field label="Timezone">
          <input className={input} value={d.timezone} onChange={(e) => set("timezone", e.target.value)} />
        </Field>
        <Field label="Her birthday (unlocks a takeover on the day)">
          <input
            type="date"
            className={input}
            value={d.heroBirthday}
            onChange={(e) => set("heroBirthday", e.target.value)}
          />
        </Field>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Sleep</h2>
        <p className="text-[12px] leading-snug font-semibold text-muted">
          She logs when she actually went to bed and woke up. These are what she&apos;s scored
          against — half the points for hitting bedtime, half for total hours.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ideal bedtime">
            <input type="time" className={input} value={d.idealBedtime} onChange={(e) => set("idealBedtime", e.target.value)} />
          </Field>
          <Field label="Ideal wake-up">
            <input type="time" className={input} value={d.idealWakeTime} onChange={(e) => set("idealWakeTime", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours needed">
            <input type="number" step="0.5" min={4} max={12} className={input} value={d.sleepTargetHours} onChange={(e) => set("sleepTargetHours", Number(e.target.value))} />
          </Field>
          <Field label="Grace on bedtime (min)">
            <input type="number" min={0} max={180} className={input} value={d.sleepToleranceMin} onChange={(e) => set("sleepToleranceMin", Number(e.target.value))} />
          </Field>
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Penalty</h2>
        <button
          onClick={() => set("penaltyEnabled", !d.penaltyEnabled)}
          className="flex w-full items-center justify-between gap-3 py-1"
        >
          <span className="text-left text-[14px] font-bold text-text">Deduct for thrown-away days</span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${d.penaltyEnabled ? "bg-flame" : "bg-surface-2"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${d.penaltyEnabled ? "left-6" : "left-1"}`} />
          </span>
        </button>
        <p className="text-[12px] leading-relaxed font-semibold text-muted">
          Off by default, and I&apos;d leave it off. Missing a habit already costs her the money
          she didn&apos;t earn — that page shows it as{" "}
          <span className="text-flame">&ldquo;left on the table yesterday&rdquo;</span>. A second
          deduction makes the number go backwards, which is where people quit. If you do turn it
          on, it only fires on days she barely showed up, never on an average one.
        </p>
        {d.penaltyEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Points lost">
              <input type="number" min={1} max={100} className={input} value={d.penaltyPoints} onChange={(e) => set("penaltyPoints", Number(e.target.value))} />
            </Field>
            <Field label="Fires below %">
              <input type="number" min={1} max={80} className={input} value={d.penaltyBelowPct} onChange={(e) => set("penaltyBelowPct", Number(e.target.value))} />
            </Field>
          </div>
        )}
        {d.penaltyEnabled && (
          <p className="rounded-xl bg-flame/10 px-3 py-2.5 text-[12px] leading-snug font-bold text-flame">
            A day under {d.penaltyBelowPct}% costs her {money(d.penaltyPoints * perPoint, d.currency)} on top of what she
            didn&apos;t earn.
          </p>
        )}
      </section>

      <button
        onClick={() => {
          sfx.done();
          setSaved(false);
          start(async () => {
            await updateDeal({
              heroName: d.heroName,
              sponsorName: d.sponsorName,
              rewardName: d.rewardName,
              rewardPrice: Number(d.rewardPrice),
              currency: d.currency,
              rewardImage: d.rewardImage.trim(),
              rewardTargetPct: Number(d.rewardTargetPct),
              freezesTotal: Number(d.freezesTotal),
              startDate: d.startDate,
              totalDays: Number(d.totalDays),
              timezone: d.timezone,
              heroBirthday: d.heroBirthday,
              idealBedtime: d.idealBedtime,
              idealWakeTime: d.idealWakeTime,
              sleepTargetHours: Number(d.sleepTargetHours),
              sleepToleranceMin: Number(d.sleepToleranceMin),
              penaltyEnabled: d.penaltyEnabled,
              penaltyPoints: Number(d.penaltyPoints),
              penaltyBelowPct: Number(d.penaltyBelowPct),
            });
            setSaved(true);
          });
        }}
        disabled={!dirty || pending}
        className="press w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
      >
        {pending ? "Saving…" : saved && !dirty ? "Saved ✓" : "Save the deal"}
      </button>
    </div>
  );
}

const input =
  "w-full rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-[14px] font-bold text-text outline-none focus:border-gold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-bold text-muted">{label}</span>
      {children}
    </label>
  );
}
