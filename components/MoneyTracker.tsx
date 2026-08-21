"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, VERDICTS, category, forMonth, monthLabel, monthsPresent, summarise } from "@/lib/finance";
import { money } from "@/lib/money";
import { prettyDay } from "@/lib/dates";
import { sfx } from "@/lib/sfx";
import type { Expense, SpendVerdict } from "@/lib/types";

const TONE: Record<SpendVerdict, { bar: string; text: string; chip: string }> = {
  worth: { bar: "bg-grass", text: "text-grass", chip: "border-grass-deep bg-grass text-ink" },
  meh: { bar: "bg-gold", text: "text-gold", chip: "border-gold-deep bg-gold text-ink" },
  regret: { bar: "bg-flame", text: "text-flame", chip: "border-flame-deep bg-flame text-ink" },
};

export function MoneyTracker({
  initial,
  currency,
  today,
}: {
  initial: Expense[];
  currency: string;
  today: string;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initial);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();

  const months = useMemo(() => {
    const present = monthsPresent(expenses);
    return present.includes(today.slice(0, 7)) ? present : [today.slice(0, 7), ...present];
  }, [expenses, today]);

  const rows = useMemo(() => forMonth(expenses, month), [expenses, month]);
  const sum = useMemo(() => summarise(rows), [rows]);

  const byDay = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of rows) {
      const list = map.get(e.day) ?? [];
      list.push(e);
      map.set(e.day, list);
    }
    return [...map.entries()];
  }, [rows]);

  function add(e: Expense) {
    setExpenses((all) => [...all, e]);
    setAdding(false);
    sfx.done();
  }

  function setVerdict(id: string, verdict: SpendVerdict) {
    setExpenses((all) => all.map((e) => (e.id === id ? { ...e, verdict } : e)));
    sfx.tick();
    start(async () => {
      await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, verdict }),
      });
    });
  }

  function remove(id: string) {
    setExpenses((all) => all.filter((e) => e.id !== id));
    sfx.tick();
    start(async () => {
      await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    });
  }

  return (
    <div className="space-y-5">
      {months.length > 1 && (
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => {
                sfx.tick();
                setMonth(m);
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-black whitespace-nowrap ${
                m === month ? "bg-gold text-ink" : "bg-surface-2 text-muted"
              }`}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------- summary */}
      <section className="card p-4">
        <p className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Spent in {monthLabel(month)}
        </p>
        <p className="mt-1 text-[32px] leading-none font-black text-text tabular-nums">
          {money(sum.total, currency)}
        </p>
        <p className="mt-1.5 text-[12.5px] font-semibold text-muted">
          {sum.count} {sum.count === 1 ? "expense" : "expenses"}
          {sum.total > 0 && (
            <>
              {" · "}
              <span className={sum.regretPct >= 25 ? "text-flame" : "text-muted"}>
                {Math.round(sum.regretPct)}% regretted
              </span>
            </>
          )}
        </p>

        {sum.total > 0 && (
          <>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
              {VERDICTS.map((v) => {
                const pct = (sum.byVerdict[v.id] / sum.total) * 100;
                if (pct <= 0) return null;
                return (
                  <span
                    key={v.id}
                    className={TONE[v.id].bar}
                    style={{ width: `${pct}%` }}
                    title={`${v.noun}: ${money(sum.byVerdict[v.id], currency)}`}
                  />
                );
              })}
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {VERDICTS.map((v) => (
                <div key={v.id}>
                  <p className={`text-[13px] font-black tabular-nums ${TONE[v.id].text}`}>
                    {money(sum.byVerdict[v.id], currency)}
                  </p>
                  <p className="text-[10.5px] font-black tracking-wide text-faint uppercase">
                    {v.noun}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <button
        onClick={() => {
          sfx.tick();
          setAdding(true);
        }}
        className="press w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase"
      >
        Add an expense
      </button>

      {/* ------------------------------------------------------- categories */}
      {sum.byCategory.length > 0 && (
        <section className="card p-4">
          <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
            Where it went
          </h2>
          <div className="mt-3 space-y-2.5">
            {sum.byCategory.map((c) => (
              <div key={c.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-black text-text">
                    {c.emoji} {c.label}
                  </span>
                  <span className="shrink-0 text-[12.5px] font-black text-muted tabular-nums">
                    {money(c.total, currency)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-violet"
                    style={{ width: `${(c.total / sum.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ list */}
      {byDay.length === 0 ? (
        <section className="card grid place-items-center p-8 text-center">
          <p className="text-[15px] font-black text-text">Nothing logged yet.</p>
          <p className="mt-1.5 max-w-[32ch] text-[12.5px] leading-snug font-semibold text-muted">
            Add something you spent on today. It takes about five seconds, and after a
            fortnight the pattern speaks for itself.
          </p>
        </section>
      ) : (
        byDay.map(([day, list]) => (
          <section key={day}>
            <p className="mb-1.5 px-1 text-[11px] font-black text-muted">{prettyDay(day)}</p>
            <div className="space-y-2">
              {list.map((e) => (
                <Row
                  key={e.id}
                  expense={e}
                  currency={currency}
                  onVerdict={(v) => setVerdict(e.id, v)}
                  onDelete={() => remove(e.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <AnimatePresence>
        {adding && (
          <AddSheet
            currency={currency}
            today={today}
            onClose={() => setAdding(false)}
            onAdded={add}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------- row */

function Row({
  expense,
  currency,
  onVerdict,
  onDelete,
}: {
  expense: Expense;
  currency: string;
  onVerdict: (v: SpendVerdict) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const c = category(expense.categoryId);

  return (
    <div className="card p-3">
      <button
        onClick={() => {
          sfx.tick();
          setOpen((o) => !o);
        }}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-[17px]">
          {c.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-black text-text">{c.label}</span>
          {expense.note && (
            <span className="block truncate text-[12px] font-semibold text-muted">
              {expense.note}
            </span>
          )}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[14px] font-black text-text tabular-nums">
            {money(expense.amount, currency)}
          </span>
          <span
            className={`block text-[10.5px] font-black tracking-wide uppercase ${TONE[expense.verdict].text}`}
          >
            {VERDICTS.find((v) => v.id === expense.verdict)?.noun}
          </span>
        </span>
      </button>

      {open && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-line-soft pt-3">
          {VERDICTS.map((v) => (
            <button
              key={v.id}
              onClick={() => onVerdict(v.id)}
              className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-black tracking-wide uppercase ${
                expense.verdict === v.id
                  ? TONE[v.id].chip
                  : "bg-surface-2 text-muted"
              }`}
            >
              {v.label}
            </button>
          ))}
          <button
            onClick={onDelete}
            aria-label="Delete expense"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-faint"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
              <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- add sheet */

function AddSheet({
  currency,
  today,
  onClose,
  onAdded,
}: {
  currency: string;
  today: string;
  onClose: () => void;
  onAdded: (e: Expense) => void;
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [verdict, setVerdict] = useState<SpendVerdict | "">("");
  const [note, setNote] = useState("");
  const [day, setDay] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Number(amount) > 0 && categoryId && verdict;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), categoryId, verdict, note, day }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't save that");
      onAdded(json.expense);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that");
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-5 pt-4 pb-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

        <label className="block text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Amount
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[26px] font-black text-muted">{currency}</span>
          <input
            autoFocus
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
            className="w-full bg-transparent text-[32px] font-black text-text tabular-nums outline-none"
          />
        </div>

        <label className="mt-4 block text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          On what
        </label>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`rounded-xl px-1 py-2.5 text-center ${
                categoryId === c.id ? "bg-violet text-ink" : "bg-surface-2 text-muted"
              }`}
            >
              <span className="block text-[17px] leading-none">{c.emoji}</span>
              <span className="mt-1 block truncate text-[10px] font-black">{c.label}</span>
            </button>
          ))}
        </div>

        <label className="mt-4 block text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Was it worth it?
        </label>
        <div className="mt-2 flex gap-1.5">
          {VERDICTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVerdict(v.id)}
              className={`flex-1 rounded-xl py-2.5 text-[12px] font-black tracking-wide uppercase ${
                verdict === v.id ? TONE[v.id].chip : "bg-surface-2 text-muted"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={note}
            maxLength={140}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="min-w-0 flex-1 rounded-xl border border-line bg-ink-2 px-3 py-2.5 text-[13px] font-bold text-text outline-none focus:border-gold"
          />
          <input
            type="date"
            value={day}
            max={today}
            onChange={(e) => setDay(e.target.value)}
            className="shrink-0 rounded-xl border border-line bg-ink-2 px-2 py-2.5 text-[12px] font-black text-text outline-none focus:border-gold"
          />
        </div>

        {error && <p className="mt-2 text-[12px] font-bold text-flame">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="press flex-1 rounded-2xl border-line bg-surface-2 py-3.5 text-[12.5px] font-black tracking-wide text-text uppercase"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!ready || busy}
            className="press flex-[1.6] rounded-2xl border-grass-deep bg-grass py-3.5 text-[12.5px] font-black tracking-wide text-ink uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
