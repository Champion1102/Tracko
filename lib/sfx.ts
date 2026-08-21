"use client";

/**
 * Synthesised so there are no audio assets to ship or cache. iOS only allows
 * audio once the user has interacted, so the context is created lazily on the
 * first tap and resumed on every play.
 */
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
  if (typeof localStorage !== "undefined") localStorage.setItem("tracko:muted", v ? "1" : "0");
}

export function isMuted() {
  if (typeof localStorage === "undefined") return muted;
  return localStorage.getItem("tracko:muted") === "1";
}

function note(freq: number, start: number, dur: number, gain = 0.14, type: OscillatorType = "triangle") {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  amp.gain.setValueAtTime(0, c.currentTime + start);
  amp.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.02);
}

function play(seq: [number, number, number][], gain = 0.14) {
  if (isMuted()) return;
  for (const [freq, start, dur] of seq) note(freq, start, dur, gain);
}

export const sfx = {
  tick: () => play([[880, 0, 0.09]], 0.08),
  step: () => play([[660, 0, 0.07]], 0.06),
  done: () => play([[784, 0, 0.1], [1047, 0.08, 0.16]]),
  perfect: () =>
    play([
      [523, 0, 0.12],
      [659, 0.09, 0.12],
      [784, 0.18, 0.12],
      [1047, 0.27, 0.4],
    ]),
  fanfare: () =>
    play([
      [523, 0, 0.14],
      [659, 0.1, 0.14],
      [784, 0.2, 0.14],
      [1047, 0.3, 0.2],
      [1319, 0.44, 0.5],
      [1047, 0.44, 0.5],
    ], 0.16),
  sad: () => play([[330, 0, 0.16], [247, 0.14, 0.3]], 0.1),
};
