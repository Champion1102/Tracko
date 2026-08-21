"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { openLetter } from "@/app/actions";
import { sfx } from "@/lib/sfx";
import type { Letter } from "@/lib/types";

export function LetterCard({
  letter,
  daysElapsed,
  from,
}: {
  letter: Letter;
  daysElapsed: number;
  from: string;
}) {
  const [show, setShow] = useState(false);
  const [, start] = useTransition();
  const unlocked = daysElapsed >= letter.unlockDay;

  function open() {
    sfx.fanfare();
    confetti({
      particleCount: 90,
      spread: 80,
      colors: ["#FF5F8F", "#FFC9D6", "#FFC24B"],
      origin: { y: 0.6 },
      disableForReducedMotion: true,
    });
    setShow(true);
    if (!letter.openedAt) start(() => void openLetter(letter.id));
  }

  return (
    <>
      <button
        disabled={!unlocked}
        onClick={open}
        className={`press w-full rounded-2xl border-2 p-4 text-left ${
          unlocked
            ? "border-rose/50 bg-rose/10"
            : "border-line bg-surface opacity-60"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{unlocked ? (letter.openedAt ? "💌" : "✉️") : "🔒"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.16em] text-faint uppercase">
              Day {letter.unlockDay}
              {from ? ` · from ${from}` : ""}
            </p>
            <p className="truncate text-[14px] font-black text-text">
              {unlocked ? letter.title : "Sealed until you get there"}
            </p>
          </div>
          {unlocked && !letter.openedAt && (
            <span className="shrink-0 rounded-full bg-rose px-2 py-0.5 text-[10px] font-black text-white uppercase">
              New
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/92 px-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
          >
            <motion.article
              className="card w-full max-w-sm border-rose/45 bg-surface p-6"
              initial={{ scale: 0.85, rotate: -3 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-black tracking-[0.16em] text-rose uppercase">
                Day {letter.unlockDay}
              </p>
              <h3 className="mt-1 mb-4 text-2xl leading-tight font-black text-text">
                {letter.title}
              </h3>
              <p className="text-[15px] leading-relaxed font-semibold whitespace-pre-wrap text-muted">
                {letter.body}
              </p>
              {from && (
                <p className="mt-5 text-right text-[14px] font-black text-rose">— {from}</p>
              )}
              <button
                onClick={() => setShow(false)}
                className="press mt-6 w-full rounded-2xl border-line bg-surface-2 py-3.5 text-[13px] font-black tracking-wide text-text uppercase"
              >
                Close
              </button>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
