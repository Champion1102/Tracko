"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Character } from "@/components/character";
import { sfx } from "@/lib/sfx";
import type { ChatMessage } from "@/lib/types";

const OPENERS = [
  "How am I actually doing?",
  "Which habit am I worst at?",
  "What do I need to hit today?",
  "I don't feel like it today",
];

/** "Today", "Yesterday", or "Wed 20 Aug" — chips between message days. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function ChatRoom({
  initial,
  heroName,
  sponsorName,
}: {
  initial: ChatMessage[];
  heroName: string;
  sponsorName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: messages.length > initial.length ? "smooth" : "auto" });
  }, [messages.length, initial.length]);

  async function send(text: string) {
    const body = text.trim();
    if (!body || thinking) return;

    setError(null);
    setDraft("");
    sfx.tick();
    setMessages((m) => [
      ...m,
      { id: `local_${Date.now()}`, who: "her", body, createdAt: new Date().toISOString() },
    ]);
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setMessages((m) => [...m, json.reply]);
      sfx.step();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-13rem)] flex-col">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="animate-float">
            <Character role="chat" mood="happy" size={124} />
          </div>
          <h2 className="mt-4 text-xl font-black text-text">
            {heroName ? `Hi ${heroName}.` : "Hi."}
          </h2>
          <p className="mt-1.5 max-w-[30ch] text-[13.5px] leading-relaxed font-semibold text-muted">
            I can see your ticks, your streak and how each habit is going. Ask me anything —
            or just say how the day went.
          </p>
          <div className="mt-5 flex w-full flex-col gap-2">
            {OPENERS.map((o) => (
              <button
                key={o}
                onClick={() => send(o)}
                className="press w-full rounded-2xl border-line bg-surface-2 px-4 py-3 text-[13.5px] font-bold text-text"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-end space-y-3 pb-2">
          <div className="flex items-center justify-center gap-2 pb-1">
            <Character role="chat" mood="happy" size={30} />
            <p className="text-[11px] font-bold text-faint">
              Nimbus — sees your ticks, streaks and habits
            </p>
          </div>
          {messages.map((m, i) => {
            const mine = m.who === "her";
            const prev = messages[i - 1];
            const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
            return (
              <motion.div
                key={m.id}
                // initial={false}: anything server-rendered must paint at full
                // opacity, or the whole transcript arrives invisible.
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {newDay && (
                  <p className="pt-1 text-center text-[10.5px] font-black tracking-wide text-faint uppercase">
                    {dayLabel(m.createdAt)}
                  </p>
                )}
                <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <span className="mb-1 shrink-0">
                    <Character role="chat" mood="happy" size={40} />
                  </span>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                    mine
                      ? "rounded-br-md border border-gold/45 bg-gold/25 text-text"
                      : "rounded-bl-md border border-line-soft bg-surface text-text"
                  }`}
                >
                  <p className="text-[14px] leading-relaxed font-bold whitespace-pre-wrap">
                    {m.body}
                  </p>
                </div>
                </div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {thinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-end gap-2"
              >
                <Character role="chat" mood="happy" size={40} />
                <div className="rounded-2xl rounded-bl-md border border-line-soft bg-surface px-4 py-3">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-faint"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                      />
                    ))}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={endRef} />
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-xl bg-flame/10 px-3 py-2 text-[12.5px] font-bold text-flame">
          {error}
        </p>
      )}

      {messages.length > 0 && (
        <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-0.5">
          {OPENERS.map((o) => (
            <button
              key={o}
              onClick={() => send(o)}
              disabled={thinking}
              className="shrink-0 rounded-full border border-line bg-surface-2 px-3.5 py-2 text-[12px] font-bold whitespace-nowrap text-muted disabled:opacity-50"
            >
              {o}
            </button>
          ))}
        </div>
      )}

      <p className="mb-2 text-center text-[11px] leading-snug font-semibold text-faint">
        I&apos;m a cloud in an app, not a person.{" "}
        <Link href="/messages" className="text-rose underline">
          {sponsorName || "Your friend"} is one tap away
        </Link>{" "}
        when it matters.
      </p>

      <div className="safe-bottom sticky bottom-[62px] flex items-end gap-2 border-t border-line-soft bg-ink/92 py-3 backdrop-blur-xl">
        <textarea
          value={draft}
          rows={1}
          maxLength={500}
          disabled={thinking}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder="Say something to Nimbus…"
          className="max-h-28 min-h-[46px] flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-[14px] font-bold text-text outline-none focus:border-gold disabled:opacity-60"
        />
        <button
          onClick={() => send(draft)}
          disabled={thinking || !draft.trim()}
          aria-label="Send"
          className="press grid h-[46px] w-[46px] shrink-0 place-items-center rounded-2xl border-gold-deep bg-gold text-ink disabled:border-line disabled:bg-surface-2 disabled:text-faint"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12l16-8-6 16-2.5-6.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
