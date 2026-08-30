"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { markSeen } from "@/app/actions";
import { sfx } from "@/lib/sfx";
import type { Celebration as C } from "@/lib/types";
import { Character } from "./character";

const THEME: Record<C["kind"], { colors: string[]; accent: string }> = {
  perfect_day: { colors: ["#2E9E56", "#7FDCA1", "#FFFFFF"], accent: "text-grass" },
  streak: { colors: ["#FF7A1A", "#FFC24B", "#FFFFFF"], accent: "text-flame" },
  letter: { colors: ["#FF5F8F", "#FFC9D6", "#FFFFFF"], accent: "text-rose" },
};

function burst(colors: string[], big: boolean) {
  const base = { colors, disableForReducedMotion: true, zIndex: 100 };
  confetti({ ...base, particleCount: big ? 130 : 70, spread: big ? 100 : 70, origin: { y: 0.62 }, startVelocity: big ? 48 : 38 });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 180);
    setTimeout(() => confetti({ ...base, particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 300);
  }
}

export function CelebrationStack({ items }: { items: C[] }) {
  const [queue, setQueue] = useState<C[]>(items);
  const [seenBatch, setSeenBatch] = useState(items);
  const [, start] = useTransition();

  if (seenBatch !== items) {
    setSeenBatch(items);
    if (items.length) setQueue(items);
  }

  const current = queue[0];

  useEffect(() => {
    if (!current) return;
    const theme = THEME[current.kind];
    const big = current.kind === "perfect_day";
    burst(theme.colors, big);
    if (big) sfx.perfect();
    else sfx.done();
  }, [current]);

  function next() {
    sfx.tick();
    const rest = queue.slice(1);
    setQueue(rest);
    if (!rest.length) {
      const keys = items.map((i) => i.key);
      start(() => void markSeen(keys));
    }
  }

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.key}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/92 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm text-center"
            initial={{ scale: 0.82, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 210, damping: 18 }}
          >
            <div className="mx-auto mb-6 grid place-items-center">
              {current.kind === "streak" ? (
                <div className="animate-flicker text-[92px] leading-none">🔥</div>
              ) : (
                <Character role="celebration" mood="proud" size={150} event="celebrate" />
              )}
            </div>

            <p className={`mb-1 text-xs font-black tracking-[0.18em] uppercase ${THEME[current.kind].accent}`}>
              {current.kind.replace("_", " ")}
            </p>
            <h2 className="mb-3 text-3xl leading-tight font-black text-text">{current.title}</h2>
            <p className="mb-8 text-[15px] leading-relaxed font-semibold text-muted">{current.body}</p>

            <button
              onClick={next}
              className="press w-full rounded-2xl border-grass-deep bg-grass py-4 text-[15px] font-black tracking-wide text-white uppercase"
            >
              {queue.length > 1 ? `Next (${queue.length - 1} more)` : "Nice"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
