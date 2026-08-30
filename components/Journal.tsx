"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveJournal } from "@/app/actions";
import { prettyDay } from "@/lib/dates";
import { MOODS, moodFace } from "@/lib/moods";
import { sfx } from "@/lib/sfx";
import type { JournalEntry, JournalMood } from "@/lib/types";

/**
 * A calm box that saves itself. No save button, no form — she types, it keeps.
 * Autosave skips revalidation on the server (see saveJournal), so nothing ever
 * repaints underneath her mid-sentence.
 */
export function JournalEditor({
  day,
  initial,
  compact = false,
}: {
  day: string;
  initial: JournalEntry | null;
  compact?: boolean;
}) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [mood, setMood] = useState<JournalMood | null>(initial?.mood ?? null);
  const [state, setState] = useState<"idle" | "dirty" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ day, body, mood, dirty: false });
  const [, start] = useTransition();

  // Mirror the newest values after every render (never during it), so the
  // unmount flush below always writes what she actually typed.
  useEffect(() => {
    latest.current.day = day;
    latest.current.body = body;
    latest.current.mood = mood;
  });

  function queue(nextBody: string, nextMood: JournalMood | null, delay = 800) {
    setState("dirty");
    latest.current.dirty = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setState("saving");
      latest.current.dirty = false;
      start(async () => {
        try {
          await saveJournal(day, nextBody, nextMood);
          setState("saved");
        } catch {
          setState("dirty");
          latest.current.dirty = true;
        }
      });
    }, delay);
  }

  // Unmounting mid-debounce (she taps a tab straight after typing) must not
  // drop the words — flush what's pending on the way out.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      // Reading the ref at cleanup time is the point: flush what she typed
      // LAST, not what existed when this effect mounted.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const { day: d, body: b, mood: m, dirty } = latest.current;
      if (dirty) void saveJournal(d, b, m);
    };
  }, []);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1" role="radiogroup" aria-label="How was today?">
          {MOODS.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={mood === m.value}
              aria-label={m.label}
              onClick={() => {
                sfx.tick();
                const next = mood === m.value ? null : m.value;
                setMood(next);
                queue(body, next, 250);
              }}
              className={`grid h-9 w-9 place-items-center rounded-full text-[19px] transition-all ${
                mood === m.value ? "scale-110 bg-grass/15" : mood !== null ? "opacity-35" : ""
              }`}
            >
              {m.face}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-bold text-faint" aria-live="polite">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : ""}
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          queue(e.target.value, mood);
        }}
        placeholder="How was today?"
        rows={compact ? 3 : 6}
        maxLength={5000}
        className="mt-3 w-full resize-none bg-transparent text-[15px] leading-relaxed font-semibold text-text outline-none placeholder:text-faint"
      />
    </div>
  );
}

/** Past days, newest first. Tap one to reopen it — a diary, not an archive. */
export function JournalList({ entries }: { entries: JournalEntry[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!entries.length) return null;

  return (
    <section className="space-y-2.5">
      <h2 className="px-1 text-[16px] font-black text-text">Earlier</h2>
      {entries.map((e) =>
        open === e.day ? (
          <div key={e.day}>
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <span className="text-[12px] font-bold text-muted">{prettyDay(e.day)}</span>
              <button
                onClick={() => {
                  sfx.tick();
                  setOpen(null);
                }}
                className="text-[12px] font-bold text-faint"
              >
                Done
              </button>
            </div>
            <JournalEditor day={e.day} initial={e} compact />
          </div>
        ) : (
          <button
            key={e.day}
            onClick={() => {
              sfx.tick();
              setOpen(e.day);
            }}
            className="card block w-full p-4 text-left"
          >
            <span className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-muted">{prettyDay(e.day)}</span>
              {e.mood !== null && <span className="text-[15px]">{moodFace(e.mood)}</span>}
            </span>
            {e.body && (
              <span className="mt-1.5 block text-[13.5px] leading-relaxed font-semibold whitespace-pre-line text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                {e.body}
              </span>
            )}
          </button>
        ),
      )}
    </section>
  );
}
