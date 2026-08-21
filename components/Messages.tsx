"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { markNudgesRead, sendMessage } from "@/app/actions";
import { sfx } from "@/lib/sfx";
import type { Nudge, Role } from "@/lib/types";

export function Messages({
  nudges,
  unread,
  me,
  otherName,
  startOpen,
}: {
  nudges: Nudge[];
  unread: number;
  me: Role;
  otherName: string;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen ?? unread > 0);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const marked = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Opening the thread is what marks it read — a ref, not state, because
  // nothing renders differently and it must fire exactly once.
  useEffect(() => {
    if (!open || unread === 0 || marked.current) return;
    marked.current = true;
    start(() => void markNudgesRead());
  }, [open, unread]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, nudges.length]);

  // Oldest first reads like a conversation; the stored list is newest first.
  const thread = [...nudges].reverse();
  const latest = nudges[0];

  const presets = [
    "Proud of you today",
    "Don't break the streak",
    `${otherName || "Hey"} — get the gym one in`,
    "That Dyson is getting closer",
  ];

  function send() {
    const text = draft.trim();
    if (!text) return;
    sfx.done();
    setDraft("");
    start(() => void sendMessage(text));
  }

  return (
    <section id="messages" className="card overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose/15 text-rose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.6A8.5 8.5 0 1 1 20.5 12z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.16em] text-rose uppercase">
            {unread > 0 ? `${unread} new` : otherName ? `You and ${otherName}` : "Messages"}
          </p>
          <p className="truncate text-[13.5px] font-bold text-text">
            {latest ? latest.body : "Say something."}
          </p>
        </div>
        <span className={`text-faint transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-72 space-y-2 overflow-y-auto px-4 pb-3">
              {thread.map((n) => {
                const mine = n.from === me;
                return (
                  <div key={n.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                        mine
                          ? "rounded-br-md border border-gold/45 bg-gold/25 text-text"
                          : "rounded-bl-md border border-line-soft bg-surface-2 text-text"
                      }`}
                    >
                      <p className="text-[13.5px] leading-snug font-bold">{n.body}</p>
                      <p className="mt-1 text-[10px] font-bold text-faint">
                        {new Date(n.sentAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {me === "sponsor" && !draft.trim() && (
              <div className="flex flex-wrap gap-1.5 border-t border-line-soft px-3 pt-3">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      sfx.tick();
                      setDraft(preset);
                    }}
                    className="press rounded-lg border-line bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-black text-muted"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 p-3">
              <textarea
                value={draft}
                rows={1}
                maxLength={400}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={otherName ? `Message ${otherName}…` : "Write something…"}
                className="max-h-24 min-h-[42px] flex-1 resize-none rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-[14px] font-bold text-text outline-none focus:border-rose"
              />
              <button
                onClick={send}
                disabled={pending || !draft.trim()}
                aria-label="Send"
                className="press grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border-rose/60 bg-rose text-white disabled:border-line disabled:bg-surface-2 disabled:text-faint"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 12l16-8-6 16-2.5-6.5z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
