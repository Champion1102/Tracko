"use client";

import { useState, useTransition } from "react";
import { saveLetter } from "@/app/actions";
import { sfx } from "@/lib/sfx";
import type { Letter } from "@/lib/types";

export function LetterEditor({ letter, daysElapsed }: { letter: Letter; daysElapsed: number }) {
  const [title, setTitle] = useState(letter.title);
  const [body, setBody] = useState(letter.body);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const read = Boolean(letter.openedAt);
  const dirty = title !== letter.title || body !== letter.body;

  return (
    <div className={`card p-4 ${read ? "opacity-70" : ""}`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <span className="text-xl">{read ? "💌" : daysElapsed >= letter.unlockDay ? "📬" : "🔒"}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black tracking-[0.16em] text-faint uppercase">
            Unlocks day {letter.unlockDay}
            {read ? " · she's read it" : daysElapsed >= letter.unlockDay ? " · available now" : ""}
          </span>
          <span className="block truncate text-[14px] font-black text-text">{title}</span>
        </span>
        <span className={`text-faint transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2.5">
          <input
            value={title}
            disabled={read}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border-2 border-line bg-ink-2 px-3.5 py-2.5 text-[14px] font-black text-text outline-none focus:border-rose disabled:opacity-60"
          />
          <textarea
            value={body}
            disabled={read}
            rows={7}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write it now, while you mean it."
            className="w-full resize-none rounded-xl border-2 border-line bg-ink-2 px-3.5 py-3 text-[14px] leading-relaxed font-semibold text-text outline-none focus:border-rose disabled:opacity-60"
          />
          {read ? (
            <p className="text-[12px] font-bold text-faint">
              She&apos;s already opened this one, so it&apos;s locked from edits.
            </p>
          ) : (
            <button
              disabled={pending || !dirty}
              onClick={() => {
                sfx.done();
                start(() => void saveLetter(letter.id, title, body));
              }}
              className="press w-full rounded-xl border-grass-deep bg-grass py-3 text-[12.5px] font-black tracking-wide text-ink uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
            >
              {pending ? "Saving…" : dirty ? "Save letter" : "Saved ✓"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
