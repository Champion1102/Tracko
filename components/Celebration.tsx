"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { markSeen } from "@/app/actions";
import { sfx } from "@/lib/sfx";
import type { Celebration as C } from "@/lib/types";
import { DysonBuild } from "./DysonBuild";
import { RewardImage } from "./RewardImage";
import { Character } from "./character";

const THEME: Record<C["kind"], { colors: string[]; accent: string; ring: string }> = {
  perfect_day: { colors: ["#58CC02", "#A8F26B", "#FFFFFF"], accent: "text-grass", ring: "shadow-[0_0_90px_-10px_#58CC02]" },
  streak: { colors: ["#FF7A1A", "#FFC24B", "#FFFFFF"], accent: "text-flame", ring: "shadow-[0_0_90px_-10px_#FF7A1A]" },
  reward_milestone: { colors: ["#FFC24B", "#FFE39A", "#FFFFFF"], accent: "text-gold", ring: "shadow-[0_0_90px_-10px_#FFC24B]" },
  week_bonus: { colors: ["#A97BFF", "#D9C2FF", "#FFFFFF"], accent: "text-violet", ring: "shadow-[0_0_90px_-10px_#A97BFF]" },
  habit_streak: { colors: ["#3BC9F0", "#B4EEFF", "#FFFFFF"], accent: "text-aqua", ring: "shadow-[0_0_90px_-10px_#3BC9F0]" },
  letter: { colors: ["#FF5F8F", "#FFC9D6", "#FFFFFF"], accent: "text-rose", ring: "shadow-[0_0_90px_-10px_#FF5F8F]" },
};

function burst(colors: string[], big: boolean) {
  const base = { colors, disableForReducedMotion: true, zIndex: 100 };
  confetti({ ...base, particleCount: big ? 130 : 70, spread: big ? 100 : 70, origin: { y: 0.62 }, startVelocity: big ? 48 : 38 });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 180);
    setTimeout(() => confetti({ ...base, particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 300);
  }
}

export function CelebrationStack({
  items,
  rewardPct,
  rewardImage,
  rewardName,
}: {
  items: C[];
  rewardPct: number;
  rewardImage: string;
  rewardName: string;
}) {
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
    const big = current.kind === "reward_milestone" || current.kind === "perfect_day";
    burst(theme.colors, big);
    if (current.kind === "reward_milestone") sfx.fanfare();
    else if (current.kind === "perfect_day") sfx.perfect();
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
            <div className={`mx-auto mb-6 grid place-items-center ${THEME[current.kind].ring}`}>
              {current.kind === "reward_milestone" ? (
                rewardImage ? (
                  <RewardImage src={rewardImage} alt={rewardName} rewardPct={rewardPct} size={220} />
                ) : (
                  <DysonBuild rewardPct={rewardPct} size={190} />
                )
              ) : current.kind === "streak" ? (
                <div className="animate-flicker text-[92px] leading-none">🔥</div>
              ) : current.kind === "habit_streak" ? (
                <div className="animate-pop text-[86px] leading-none">
                  {String(current.title).split(" ")[0]}
                </div>
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
              className="press w-full rounded-2xl border-grass-deep bg-grass py-4 text-[15px] font-black tracking-wide text-ink uppercase"
            >
              {queue.length > 1 ? `Next (${queue.length - 1} more)` : "Let's go"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
