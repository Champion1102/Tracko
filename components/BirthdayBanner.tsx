"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Character } from "@/components/character";
import { sfx } from "@/lib/sfx";

const COLORS = ["#F3CB84", "#F2809E", "#AE8DE4", "#63D471", "#FFFFFF"];

export function BirthdayBanner({ name }: { name: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    sfx.fanfare();

    // A slow drift rather than one burst — it should feel like the page is
    // celebrating for a while, not popping once.
    const end = Date.now() + 2600;
    const tick = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 62,
        startVelocity: 42,
        origin: { x: 0, y: 0.7 },
        colors: COLORS,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 62,
        startVelocity: 42,
        origin: { x: 1, y: 0.7 },
        colors: COLORS,
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="card relative overflow-hidden border-rose/45 bg-gradient-to-br from-rose/15 via-gold/10 to-violet/15 p-5 text-center"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {[12, 30, 52, 74, 88].map((left, i) => (
          <motion.span
            key={left}
            className="absolute text-lg"
            style={{ left: `${left}%`, top: `${(i % 3) * 26 + 6}%` }}
            animate={{ y: [0, -8, 0], rotate: [0, 12, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {["✦", "✧", "✦", "✧", "✦"][i]}
          </motion.span>
        ))}
      </div>

      <div className="relative">
        <div className="mx-auto mb-1 w-fit animate-float">
          <Character role="celebration" mood="hype" size={104} event="celebrate" />
        </div>
        <p className="text-[10px] font-black tracking-[0.24em] text-rose uppercase">
          Happy birthday
        </p>
        <h2 className="mt-1 text-2xl leading-tight font-black text-text">
          {name ? `It's your day, ${name}` : "It's your day"}
        </h2>
        <p className="mx-auto mt-2 max-w-[30ch] text-[13px] leading-relaxed font-bold text-muted">
          The ticks can wait an hour — go eat something with sugar in it. Doctor&apos;s
          orders. Well, cloud&apos;s orders.
        </p>
      </div>
    </motion.section>
  );
}
