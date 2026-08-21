"use client";

import { useEffect, useState } from "react";

import { DysonBuild } from "./DysonBuild";

const COLS = 6;
const ROWS = 6;
const TILES = COLS * ROWS;

/**
 * The reward photo is a cut-out PNG — roughly four fifths of it is fully
 * transparent, and the product itself is mostly near-black. Dropped straight
 * onto the dark theme it vanishes and all that reads is the seams, so every
 * variant below sits on an opaque plate: the backdrop it was shot against.
 */
const PLATE = "linear-gradient(160deg, #FBF8F4 0%, #EFE7DD 55%, #E2D8CC 100%)";

/**
 * Deterministic shuffle so the picture doesn't unzip row by row — it resolves
 * from scattered points, which reads much more like something appearing.
 * Same order every render, no Math.random.
 */
const ORDER = (() => {
  const idx = Array.from({ length: TILES }, (_, i) => i);
  let seed = 1337;
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const j = seed % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const rank = new Array<number>(TILES);
  idx.forEach((tile, position) => (rank[tile] = position));
  return rank;
})();

/**
 * The reward assembles itself out of its own photograph. Each tile is a slice
 * of the real image that fades from a faint ghost to fully opaque as she earns
 * it — no covering layer, so what she sees is genuinely the picture arriving.
 */
export function RewardImage({
  src,
  alt,
  rewardPct,
  size = 290,
  animate = false,
  plain = false,
}: {
  src: string;
  alt: string;
  rewardPct: number;
  size?: number;
  /** Fill the tiles in on mount, so the mechanic explains itself. */
  animate?: boolean;
  /** Skip the tiling entirely and just show the photo — for onboarding, where
   *  the point is "here is the thing", not "here is how the thing unlocks". */
  plain?: boolean;
}) {
  const target = Math.min(Math.max(rewardPct, 0), 100);
  const [progress, setProgress] = useState(animate ? 0 : 100);
  const shown = animate ? (target * progress) / 100 : target;

  useEffect(() => {
    if (!animate || plain) return;
    const DURATION = 1700;
    const startedAt = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / DURATION, 1);
      // ease-out so it rushes in then settles
      setProgress(100 * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, plain, target]);

  if (!src) return <DysonBuild rewardPct={rewardPct} size={size} />;

  if (plain) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ width: size, height: size, background: PLATE }}
        role="img"
        aria-label={alt}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    );
  }

  const unlocked = Math.round((shown / 100) * TILES);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ width: size, height: size, background: PLATE }}
      role="img"
      aria-label={`${alt}, ${Math.round(target)} percent revealed`}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: TILES }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const revealed = ORDER[i] < unlocked;

          // Plain CSS rather than a motion component: the opacity has to be
          // in the server HTML, or every tile paints fully visible for a frame
          // before hydration corrects it — which flashes the whole answer.
          return (
            <div
              key={i}
              style={{
                backgroundImage: `url(${src})`,
                // One slice of the image per tile: scale the background up by
                // the grid size, then offset to this tile's share of it.
                backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
                backgroundRepeat: "no-repeat",
                opacity: revealed ? 1 : 0.07,
                filter: revealed ? "none" : "blur(2px)",
                transform: revealed ? "scale(1)" : "scale(0.94)",
                transition: "opacity 550ms ease-out, filter 550ms ease-out, transform 550ms ease-out",
                transitionDelay: revealed ? `${(ORDER[i] % 8) * 35}ms` : "0ms",
              }}
            />
          );
        })}
      </div>

      {/* Faint seams, so it reads as pieces rather than a blurry photo. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #241B2C 1px, transparent 1px), linear-gradient(to bottom, #241B2C 1px, transparent 1px)",
          backgroundSize: `${100 / COLS}% ${100 / ROWS}%`,
        }}
      />
    </div>
  );
}
