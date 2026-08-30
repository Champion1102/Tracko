"use client";

import { useState, useTransition } from "react";
import { resetStartDate, updateDeal } from "@/app/actions";
import { sfx } from "@/lib/sfx";
import type { Config } from "@/lib/types";

export function DealSettings({ config }: { config: Config }) {
  const [d, setD] = useState(config);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [resetDone, setResetDone] = useState(false);
  const [resetting, startReset] = useTransition();

  const dirty = JSON.stringify(d) !== JSON.stringify(config);
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setD((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-4">
        <h2 className="text-[12px] font-bold text-faint">Who</h2>
        <Field label="Her name">
          <input className={input} value={d.heroName} placeholder="e.g. Riya" onChange={(e) => set("heroName", e.target.value)} />
        </Field>
        <Field label="Your name (signs the letters)">
          <input className={input} value={d.sponsorName} placeholder="e.g. Ritesh" onChange={(e) => set("sponsorName", e.target.value)} />
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
        <h2 className="text-[12px] font-bold text-faint">The clock</h2>
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
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-[12px] font-bold text-faint">Her money tracker</h2>
        <Field label="Currency symbol">
          <input className={input} value={d.currency} maxLength={3} onChange={(e) => set("currency", e.target.value)} />
        </Field>
      </section>

      <button
        onClick={() => {
          sfx.done();
          setSaved(false);
          start(async () => {
            await updateDeal({
              heroName: d.heroName,
              sponsorName: d.sponsorName,
              heroBirthday: d.heroBirthday,
              startDate: d.startDate,
              totalDays: Number(d.totalDays),
              timezone: d.timezone,
              currency: d.currency,
            });
            setSaved(true);
          });
        }}
        disabled={!dirty || pending}
        className="press w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-white uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
      >
        {pending ? "Saving…" : saved && !dirty ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}

const input =
  "w-full rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-[14px] font-bold text-text outline-none focus:border-grass";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-bold text-muted">{label}</span>
      {children}
    </label>
  );
}
