"use client";

/**
 * Speech synthesis, with the three quirks that make naive implementations
 * silently do nothing:
 *
 *  1. getVoices() is empty until `voiceschanged` fires (Chrome, first load).
 *  2. cancel() immediately followed by speak() drops the utterance (Chrome) —
 *     the queue needs a tick to actually clear.
 *  3. Chrome pauses synthesis after ~15 seconds unless you poke resume().
 */

let voices: SpeechSynthesisVoice[] = [];
let unlocked = false;
let keepAlive: ReturnType<typeof setInterval> | null = null;
let lastError: string | null = null;

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speechError(): string | null {
  return lastError;
}

export function primeVoices() {
  const s = synth();
  if (!s) return;
  const load = () => {
    voices = s.getVoices();
  };
  load();
  s.addEventListener?.("voiceschanged", load);
}

function pickVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!voices.length && s) voices = s.getVoices();
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  if (!english.length) return null;

  const preferred = ["samantha", "karen", "serena", "moira", "google uk english female", "aria"];
  for (const name of preferred) {
    const hit = english.find((v) => v.name.toLowerCase().includes(name));
    if (hit) return hit;
  }
  return english.find((v) => v.localService) ?? english[0];
}

export function isSpeechOn(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("tracko:speech") === "1";
}

export function setSpeechOn(on: boolean) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("tracko:speech", on ? "1" : "0");
  }
  if (on) unlock();
}

/** Must run inside a real tap — Safari and Chrome both ignore speak() otherwise. */
export function unlock() {
  const s = synth();
  if (!s || unlocked) return;
  try {
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    s.speak(u);
    unlocked = true;
  } catch {
    /* nothing to do — the real speak() will report the failure */
  }
}

function stopKeepAlive() {
  if (keepAlive) {
    clearInterval(keepAlive);
    keepAlive = null;
  }
}

export type SpeakOpts = { force?: boolean; rate?: number; pitch?: number };

export function speak(text: string, opts: SpeakOpts = {}): boolean {
  const s = synth();
  if (!s) {
    lastError = "This browser has no speech engine.";
    return false;
  }
  if (!opts.force && !isSpeechOn()) return false;

  // Screen-reader style emoji announcements sound ridiculous read aloud.
  const clean = text.replace(/[\p{Extended_Pictographic}️]/gu, "").trim();
  if (!clean) return false;

  lastError = null;
  unlock();
  s.cancel();
  stopKeepAlive();

  const fire = () => {
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-GB";
    u.rate = opts.rate ?? 1.05;
    u.pitch = opts.pitch ?? 1.15;
    u.volume = 1;

    u.onerror = (e) => {
      // "interrupted"/"canceled" just means we spoke over ourselves — not a fault.
      const reason = (e as SpeechSynthesisErrorEvent).error;
      if (reason !== "interrupted" && reason !== "canceled") lastError = `Speech failed: ${reason}`;
      stopKeepAlive();
    };
    u.onend = stopKeepAlive;

    s.speak(u);

    // Quirk 3 — keep Chrome from pausing mid-sentence.
    keepAlive = setInterval(() => {
      if (!s.speaking) return stopKeepAlive();
      s.pause();
      s.resume();
    }, 9000);
  };

  // Quirk 2 — let the cancel actually land before queueing the new utterance.
  // Quirk 1 — if voices haven't arrived yet, wait one beat longer for them.
  const needsVoices = voices.length === 0;
  setTimeout(fire, needsVoices ? 180 : 40);
  return true;
}

export function stopSpeaking() {
  stopKeepAlive();
  synth()?.cancel();
}
