"use client";

import { useSyncExternalStore } from "react";

/**
 * A cast, not a single mascot. Different characters suit different jobs — an
 * AI-assistant face belongs in the chat, a growing plant belongs on the page
 * about progress — and each page only ever downloads the one it uses.
 */
export type CharacterRole = "companion" | "chat" | "celebration";

export type Cast = Record<CharacterRole, string>;

export const ROLE_LABELS: Record<CharacterRole, { title: string; blurb: string }> = {
  companion: { title: "Everyday buddy", blurb: "The one who walked you through day one." },
  chat: { title: "Chat face", blurb: "Who you're talking to on the Nimbus tab." },
  celebration: { title: "Celebrations", blurb: "Shows up when you hit something big." },
};

/**
 * The hand-drawn Nimbus keeps the two roles she looks at most — it's the one
 * that actually reacts to mood, and it's the face she knows. The downloaded
 * files fill the corners where a different character is a bonus rather than a
 * substitution, and every slot is swappable.
 */
export const DEFAULT_CAST: Cast = {
  companion: "drawn:nimbus",
  chat: "drawn:nimbus",
  celebration: "drawn:ember",
};

const KEY = "tracko:cast";
const EVENT = "tracko:cast-changed";

let cached: string | null = null;

function snapshot(): string {
  if (typeof localStorage === "undefined") return "";
  if (cached === null) cached = localStorage.getItem(KEY) ?? "";
  return cached;
}

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function parse(raw: string): Cast {
  if (!raw) return DEFAULT_CAST;
  try {
    return { ...DEFAULT_CAST, ...(JSON.parse(raw) as Partial<Cast>) };
  } catch {
    return DEFAULT_CAST;
  }
}

export function setRole(role: CharacterRole, file: string) {
  const next = { ...parse(snapshot()), [role]: file };
  cached = JSON.stringify(next);
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, cached);
  window.dispatchEvent(new Event(EVENT));
}

export function resetCast() {
  cached = "";
  if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function useCast(): Cast {
  // Server snapshot is empty so SSR always draws the SVG; the chosen cast
  // takes over on hydration without a layout shift.
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  return parse(raw);
}
