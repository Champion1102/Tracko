"use client";

import type { CoachLine, CoachPack, Situation } from "./types";

/** Same picker as lib/coach.ts, without dragging the server SDK into the bundle. */
export function pickLine(
  pack: CoachPack | null,
  situation: Situation,
  seed: number,
): CoachLine | null {
  if (!pack) return null;
  const matches = pack.lines.filter((l) => l.situation === situation);
  if (!matches.length) return null;
  return matches[Math.abs(seed) % matches.length];
}
