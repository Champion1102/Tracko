"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Character, type CharacterEvent } from "@/components/character";
import { onTick } from "@/lib/bus";
import { pickLine } from "@/lib/coach.client";
import type { Mood } from "@/lib/mascot";
import { isSpeechOn, primeVoices, speak, stopSpeaking } from "@/lib/speech";
import type { CoachPack } from "@/lib/types";

/** Shown for the ~700ms before the live line lands, and kept if it never does. */
const FALLBACK_DONE = [
  "That's one. Keep rolling.",
  "Banked. Next.",
  "Nice — the meter moved.",
  "Another one off the board.",
  "Logged. Onwards.",
];

export function CoachBubble({
  text,
  mood,
  coach,
  size = 96,
}: {
  text: string;
  mood: Mood;
  coach: CoachPack | null;
  size?: number;
}) {
  const [line, setLine] = useState({ text, mood });
  const [ambient, setAmbient] = useState({ text, mood });
  const [event, setEvent] = useState<CharacterEvent>(null);
  const [nonce, setNonce] = useState(0);
  const [talking, setTalking] = useState(false);
  const revertRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const talkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    primeVoices();
    return () => stopSpeaking();
  }, []);

  // Server sends a new ambient line when the day's state changes.
  if (ambient.text !== text || ambient.mood !== mood) {
    setAmbient({ text, mood });
    setLine({ text, mood });
  }

  useEffect(
    () =>
      onTick(({ completed, habitName, habitId }) => {
        setNonce((n) => n + 1);
        setEvent(completed ? "complete" : "tick");
        if (!completed) return;

        const seq = ++requestSeq.current;

        const say = (next: { text: string; mood: Mood }, withVoice: boolean) => {
          setLine(next);
          if (withVoice && isSpeechOn()) {
            speak(next.text);
            setTalking(true);
            if (talkRef.current) clearTimeout(talkRef.current);
            // Roughly 0.4s a word — enough to drive the mouth flap.
            talkRef.current = setTimeout(
              () => setTalking(false),
              Math.min(next.text.split(" ").length * 400, 6000),
            );
          }
          if (revertRef.current) clearTimeout(revertRef.current);
          revertRef.current = setTimeout(() => setLine({ text, mood }), 9000);
        };

        // Something appears instantly. The good line replaces it a beat later.
        const stopgap = pickLine(coach, "habit_done", seq);
        say(
          {
            text: stopgap?.text ?? FALLBACK_DONE[(habitName.length + seq) % FALLBACK_DONE.length],
            mood: (stopgap?.mood ?? "hype") as Mood,
          },
          false,
        );

        inflight.current?.abort();
        const controller = new AbortController();
        inflight.current = controller;

        fetch("/api/coach/line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId }),
          signal: controller.signal,
        })
          .then((r) => (r.status === 200 ? r.json() : null))
          .then((live: { text: string; mood: Mood } | null) => {
            // A newer tap has already superseded this one.
            if (!live || seq !== requestSeq.current) return;
            say(live, true);
          })
          .catch(() => {
            /* offline or slow — the stopgap line stands */
          });
      }),
    [coach, text, mood],
  );

  return (
    <Link href="/chat" className="flex items-end gap-2" aria-label="Talk to Nimbus">
      <div className="shrink-0 animate-float">
        <Character mood={line.mood} event={event} eventNonce={nonce} talking={talking} size={size} />
      </div>
      <div className="relative mb-3 flex-1">
        <div
          className="absolute -left-[7px] bottom-4 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-line bg-surface"
          aria-hidden
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={line.text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="card px-4 py-3 text-[15px] leading-snug font-bold text-text"
          >
            {line.text}
          </motion.p>
        </AnimatePresence>
        <span className="mt-1 block pl-1 text-[10px] font-black tracking-wide text-faint uppercase">
          Tap to talk →
        </span>
      </div>
    </Link>
  );
}
