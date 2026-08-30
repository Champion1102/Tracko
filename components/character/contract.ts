/**
 * THE CHARACTER CONTRACT
 * ----------------------
 * Everything that drives the mascot flows through these types. The SVG
 * implementation and the Rive implementation both consume exactly this, so
 * swapping one for the other touches a single line in ./index.tsx.
 *
 * If you commission or remix a .riv file, ask for a state machine named
 * "Nimbus" with these inputs:
 *
 *   mood      Number   0..5  — see MOOD_INDEX below
 *   talking   Boolean        — true while speech synthesis is mid-sentence
 *   tick      Trigger        — fired on any single habit being logged
 *   celebrate Trigger        — fired on a day/streak/reward milestone
 *
 * That's four inputs. Any rigged character exposing them will drop straight in.
 */

import type { Mood } from "@/lib/types";

export const MOOD_INDEX: Record<Mood, number> = {
  happy: 0,
  hype: 1,
  proud: 2,
  worried: 3,
  sleepy: 4,
  cheeky: 5,
};

export type CharacterEvent = "tick" | "complete" | "celebrate" | null;

export type CharacterProps = {
  /** Which cast member to show. Defaults to the everyday companion. */
  role?: import("@/lib/characterStore").CharacterRole;
  mood: Mood;
  /** Which drawn character to use, when the slot is a drawn one. */
  face?: import("./faces").DrawnId;
  /** Bump a counter alongside this to replay the same event twice in a row. */
  event?: CharacterEvent;
  eventNonce?: number;
  talking?: boolean;
  size?: number;
  className?: string;
};

export const RIVE_STATE_MACHINE = "Nimbus";
export const RIVE_SRC = process.env.NEXT_PUBLIC_RIVE_SRC ?? "";
