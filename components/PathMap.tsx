"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { DayStatus } from "@/lib/scoring";
import { prettyDay } from "@/lib/dates";
import { sfx } from "@/lib/sfx";
import { HabitIcon } from "./HabitIcon";

export type Node = {
  day: string;
  index: number;
  pct: number;
  points: number;
  status: DayStatus;
  missed: { icon?: string; emoji: string; name: string }[];
};

const LOOK: Record<DayStatus, { bg: string; ring: string; text: string; face: string }> = {
  perfect: { bg: "bg-grass", ring: "border-grass-deep", text: "text-ink", face: "★" },
  strong: { bg: "bg-gold", ring: "border-gold-deep", text: "text-ink", face: "" },
  kept: { bg: "bg-aqua", ring: "border-aqua/50", text: "text-ink", face: "" },
  partial: { bg: "bg-flame", ring: "border-flame-deep", text: "text-ink", face: "" },
  missed: { bg: "bg-surface-2", ring: "border-line", text: "text-faint", face: "" },
  frozen: { bg: "bg-violet", ring: "border-violet/50", text: "text-ink", face: "❄" },
  future: { bg: "bg-ink-2", ring: "border-line", text: "text-faint", face: "" },
};

const CHESTS = [7, 14, 21, 30, 45, 60, 75];

export function PathMap({ nodes, today }: { nodes: Node[]; today: string }) {
  const [open, setOpen] = useState<Node | null>(null);
  const todayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  }, []);

  return (
    <>
      <div className="relative py-2">
        {nodes.map((n) => {
          // Gentle S-curve so it reads as a path rather than a list.
          const offset = Math.sin((n.index - 1) * 0.55) * 34;
          const look = LOOK[n.status];
          const isToday = n.day === today;
          const chest = CHESTS.includes(n.index);
          const finale = n.index === nodes.length;

          return (
            <div
              key={n.day}
              ref={isToday ? todayRef : undefined}
              className="relative flex h-[62px] items-center justify-center"
            >
              {n.index > 1 && (
                <div
                  className="absolute -top-[10px] h-[22px] w-[3px] rounded-full bg-line"
                  style={{ transform: `translateX(${Math.sin((n.index - 1.5) * 0.55) * 34}px)` }}
                  aria-hidden
                />
              )}

              <motion.button
                onClick={() => {
                  sfx.tick();
                  setOpen(n);
                }}
                whileTap={{ scale: 0.9 }}
                style={{ transform: `translateX(${offset}px)` }}
                className={`press relative grid place-items-center rounded-full ${look.bg} ${look.ring} ${
                  finale ? "h-16 w-16" : chest ? "h-14 w-14" : "h-11 w-11"
                } ${isToday ? "ring-4 ring-text/70 ring-offset-4 ring-offset-ink" : ""}`}
                aria-label={`Day ${n.index}, ${n.status}`}
              >
                <span className={`text-[13px] font-black ${look.text} tabular-nums`}>
                  {finale ? "🏆" : chest ? "🎁" : look.face || n.index}
                </span>
                {n.status === "perfect" && !chest && !finale && (
                  <span className="absolute -right-1 -bottom-1 text-[11px]">✨</span>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end bg-ink/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="safe-bottom w-full rounded-t-3xl border-t-2 border-line bg-surface p-6 pb-8"
              initial={{ y: 260 }}
              animate={{ y: 0 }}
              exit={{ y: 260 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
              <p className="text-[10px] font-black tracking-[0.16em] text-faint uppercase">
                Day {open.index} · {prettyDay(open.day)}
              </p>
              <h3 className="mt-1 text-2xl font-black text-text">
                {open.status === "future"
                  ? "Not yet"
                  : open.status === "perfect"
                    ? "Perfect day ★"
                    : open.status === "frozen"
                      ? "Freeze used ❄"
                      : `${Math.round(open.points)} / 100 points`}
              </h3>

              {open.missed.length > 0 && open.status !== "future" && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-black tracking-wide text-faint uppercase">
                    Missed
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {open.missed.map((m) => (
                      <span
                        key={m.name}
                        title={m.name}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-faint"
                      >
                        <HabitIcon icon={m.icon} emoji={m.emoji} size={18} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setOpen(null)}
                className="press mt-6 w-full rounded-2xl border-line bg-surface-2 py-3.5 text-[13px] font-black tracking-wide text-text uppercase"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
