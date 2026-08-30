"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setHabitLink, setHabitValue, toggleSubItem } from "@/app/actions";
import { compressImage } from "@/lib/compress";
import { sfx } from "@/lib/sfx";
import type { HabitProgress } from "@/lib/scoring";
import { Icon } from "./Icon";
import { PhotoViewer } from "./PhotoViewer";

export type RowPhoto = { id: string; url: string };

type Props = {
  p: HabitProgress;
  day: string;
  /** Photos already attached to this habit on this day (signed server-side). */
  photos?: RowPhoto[];
  readOnly?: boolean;
};

/** What the sleep row offers. Whole tick = 1; anything above is hours slept. */
const HOURS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];
const fmtHours = (v: number) => (Math.round(v * 10) / 10).toString();

/** Sub-item labels squeezed to fit on one line next to the name. */
const SHORT: Record<string, string> = { Supplements: "Supps", Morning: "AM", Night: "PM" };
const short = (label: string) => SHORT[label] ?? (label.length > 8 ? `${label.slice(0, 7)}…` : label);

/**
 * One habit, one row, one rule: tap adds a step, tap again when it's complete
 * undoes a step. Binary habits just toggle. Counters and checklists show their
 * steps under the name; the two proof habits offer a camera or a link on the
 * right, and using either is also the tick.
 */
export function TickRow({ p, day, photos = [], readOnly = false }: Props) {
  const { habit } = p;
  const router = useRouter();
  const [value, setValue] = useState(p.value);
  const [subs, setSubs] = useState<boolean[]>(p.subDone);
  const [note, setNote] = useState(p.note ?? "");
  const [synced, setSynced] = useState({ value: p.value, subs: p.subDone, note: p.note ?? "" });
  const [pending, start] = useTransition();
  const [pop, setPop] = useState(0);

  // Server is the source of truth. Re-sync during render (rather than in an
  // effect) so an optimistic value is corrected before anything is painted.
  if (synced.value !== p.value || synced.subs !== p.subDone || synced.note !== (p.note ?? "")) {
    setSynced({ value: p.value, subs: p.subDone, note: p.note ?? "" });
    setValue(p.value);
    setSubs(p.subDone);
    setNote(p.note ?? "");
  }

  const ratio =
    habit.kind === "checklist"
      ? Math.min(subs.filter(Boolean).length / habit.target, 1)
      : habit.kind === "binary"
        ? value >= 1
          ? 1
          : 0
        : Math.min(value / habit.target, 1);
  const done = ratio >= 1;

  function sound(nowDone: boolean, up: boolean) {
    if (nowDone && !done) {
      sfx.done();
      setPop((n) => n + 1);
    } else if (up) sfx.step();
    else sfx.tick();
  }

  function commit(next: number) {
    if (readOnly) return;
    const nowDone = next >= (habit.kind === "binary" ? 1 : habit.target);
    sound(nowDone, next > value);
    setValue(next);
    start(() => void setHabitValue(habit.id, day, next));
  }

  function commitSub(idx: number) {
    if (readOnly) return;
    const next = [...subs];
    next[idx] = !next[idx];
    sound(next.filter(Boolean).length >= habit.target, next[idx]);
    setSubs(next);
    start(() => void toggleSubItem(habit.id, day, idx));
  }

  function tapRow() {
    if (readOnly) return;
    if (habit.kind === "binary") return commit(value >= 1 ? 0 : 1);
    if (habit.kind === "counter") return commit(done ? Math.max(value - 1, 0) : value + 1);
    const idx = done ? subs.lastIndexOf(true) : subs.indexOf(false);
    if (idx >= 0) commitSub(idx);
  }

  // ---- proof: photo -------------------------------------------------------

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<RowPhoto | null>(null);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", await compressImage(file));
      body.append("day", day);
      body.append("habitId", habit.id);
      const res = await fetch("/api/photos", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      // The photo is the tick. Already ticked? Just show the photo.
      if (!done) commit(1);
      else {
        sfx.done();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(id: string) {
    setViewing(null);
    sfx.tick();
    await fetch("/api/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  // ---- proof: hours -------------------------------------------------------

  const [hoursOpen, setHoursOpen] = useState(false);

  function pickHours(h: number) {
    setHoursOpen(false);
    commit(h);
  }

  // ---- proof: link --------------------------------------------------------

  const [linkOpen, setLinkOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function saveLink(raw: string) {
    const text = raw.trim();
    if (!text) return setLinkOpen(false);
    setError(null);
    sound(true, true);
    setNote(text);
    if (value < 1) setValue(1);
    setLinkOpen(false);
    setDraft("");
    start(async () => {
      try {
        await setHabitLink(habit.id, day, text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save that link");
        setNote(synced.note);
        setValue(synced.value);
      }
    });
  }

  function clearLink() {
    sfx.tick();
    setNote("");
    start(() => void setHabitLink(habit.id, day, ""));
  }

  const host = (() => {
    try {
      return new URL(note).hostname.replace(/^www\./, "");
    } catch {
      return note;
    }
  })();

  return (
    <div className={`transition-opacity ${pending ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-2 pr-3 pl-4">
        <button
          onClick={tapRow}
          disabled={readOnly}
          aria-pressed={done}
          aria-label={`${habit.name}${done ? ", done" : ""}`}
          className="flex min-w-0 flex-1 items-center gap-3.5 py-3.5 text-left disabled:cursor-default"
        >
          <Circle ratio={ratio} done={done} pop={pop} />

          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-[15px] leading-tight font-bold transition-colors ${
                done ? "text-muted" : "text-text"
              }`}
            >
              {habit.name}
            </span>

            {habit.kind === "counter" && (
              <span className="mt-1.5 flex items-center gap-[5px]" aria-hidden>
                {Array.from({ length: habit.target }, (_, i) => (
                  <span
                    key={i}
                    className={`block h-[7px] w-[7px] rounded-full transition-colors ${
                      value > i ? "bg-grass" : "bg-line"
                    }`}
                  />
                ))}
                <span className="ml-1 text-[11px] font-bold text-faint tabular-nums">
                  {Math.min(value, habit.target)}/{habit.target}
                </span>
              </span>
            )}

            {habit.proof === "hours" && value > 1 && (
              <span className="mt-1 flex items-center gap-1 text-[11.5px] font-bold text-faint tabular-nums">
                <Icon.clock size={11} />
                slept {fmtHours(value)} h
              </span>
            )}

            {note && (
              <span className="mt-1 flex items-center gap-1 text-[11.5px] font-bold text-faint">
                <Icon.external size={11} />
                <span className="truncate">{host}</span>
              </span>
            )}
          </span>
        </button>

        {habit.kind === "checklist" && (
          <span className="flex shrink-0 items-center gap-1">
            {(habit.subItems ?? []).map((label, i) => (
              <button
                key={label}
                disabled={readOnly}
                onClick={() => commitSub(i)}
                aria-pressed={subs[i]}
                aria-label={label}
                className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                  subs[i] ? "bg-grass/15 text-grass" : "bg-surface-2 text-faint"
                }`}
              >
                {short(label)}
              </button>
            ))}
          </span>
        )}

        {!readOnly && habit.proof === "photo" && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Add a photo"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-transform active:scale-90 disabled:opacity-50"
          >
            {busy ? <span className="text-[12px] font-bold">…</span> : <Icon.camera size={17} />}
          </button>
        )}

        {!readOnly && habit.proof === "hours" && (
          <button
            onClick={() => {
              sfx.tick();
              setHoursOpen((o) => !o);
            }}
            aria-label="How many hours did you sleep?"
            aria-expanded={hoursOpen}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform active:scale-90 ${
              value > 1 ? "bg-grass/15 text-grass" : "bg-surface-2 text-muted"
            }`}
          >
            <Icon.clock size={17} />
          </button>
        )}

        {!readOnly && habit.proof === "link" && (
          <button
            onClick={() => {
              sfx.tick();
              setDraft(note);
              setLinkOpen((o) => !o);
            }}
            aria-label={note ? "Change the link" : "Add a link"}
            aria-expanded={linkOpen}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform active:scale-90 ${
              note ? "bg-grass/15 text-grass" : "bg-surface-2 text-muted"
            }`}
          >
            <Icon.link size={17} />
          </button>
        )}
      </div>

      {hoursOpen && (
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto pr-3 pb-3 pl-[62px]">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => pickHours(h)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold tabular-nums transition-colors ${
                value === h ? "bg-grass text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {fmtHours(h)}h
            </button>
          ))}
        </div>
      )}

      {linkOpen && (
        <form
          className="flex items-center gap-2 pr-3 pb-3 pl-[62px]"
          onSubmit={(e) => {
            e.preventDefault();
            saveLink(draft);
          }}
        >
          <input
            autoFocus
            inputMode="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste the post link"
            className="min-w-0 flex-1 rounded-xl border border-line bg-ink-2 px-3 py-2 text-[13px] font-semibold text-text outline-none focus:border-grass"
          />
          <button
            type="submit"
            className="rounded-xl bg-text px-3 py-2 text-[12px] font-bold text-ink"
          >
            Save
          </button>
          {note && (
            <button
              type="button"
              onClick={() => {
                clearLink();
                setLinkOpen(false);
              }}
              aria-label="Remove the link"
              className="grid h-8 w-8 place-items-center rounded-full text-faint"
            >
              <Icon.close size={14} />
            </button>
          )}
        </form>
      )}

      {photos.length > 0 && (
        <div className="flex gap-1.5 pr-3 pb-3 pl-[62px]">
          {photos.map((s) => (
            <button
              key={s.id}
              onClick={() => setViewing(s)}
              className="h-12 w-12 overflow-hidden rounded-xl bg-surface-2"
              aria-label="Open photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {error && <p className="pr-3 pb-3 pl-[62px] text-[12px] font-bold text-flame">{error}</p>}

      {habit.proof === "photo" && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      )}

      <PhotoViewer
        url={viewing?.url ?? null}
        onClose={() => setViewing(null)}
        onDelete={readOnly || !viewing ? undefined : () => removePhoto(viewing.id)}
      />
    </div>
  );
}

/** The tick itself: an empty ring, an arc that fills with each step, a green disc when done. */
function Circle({ ratio, done, pop }: { ratio: number; done: boolean; pop: number }) {
  const size = 28;
  const stroke = 2.25;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  if (done) {
    return (
      <span
        key={pop}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-grass text-white ${
          pop ? "animate-pop" : ""
        }`}
      >
        <Icon.check size={15} strokeWidth={3.2} />
      </span>
    );
  }

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
      {ratio > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-grass)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - ratio * c}
          className="transition-[stroke-dashoffset] duration-300"
        />
      )}
    </svg>
  );
}
