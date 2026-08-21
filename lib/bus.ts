"use client";

/**
 * Tiny window-event bus. The habit cards are scattered down the page and the
 * mascot sits at the top; a context provider for one event would be more
 * plumbing than it's worth.
 */

export type TickDetail = {
  habitId: string;
  habitName: string;
  emoji: string;
  /** true when this tap actually completed the habit, not just nudged it up */
  completed: boolean;
};

const EVENT = "tracko:tick";

export function emitTick(detail: TickDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TickDetail>(EVENT, { detail }));
}

export function onTick(cb: (d: TickDetail) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<TickDetail>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
