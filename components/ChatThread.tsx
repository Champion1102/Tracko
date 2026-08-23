"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { markNudgesRead, sendMessage } from "@/app/actions";
import { compressImage } from "@/lib/compress";
import { sfx } from "@/lib/sfx";
import type { Nudge, Role } from "@/lib/types";

export type NudgeWithUrl = Nudge & { imageUrl: string | null };

type LocalMsg = {
  id: string;
  body: string;
  previewUrl: string | null;
};

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

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Plain text with http(s) links made tappable. */
export function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline decoration-rose/60 underline-offset-2"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * The two-person thread, shaped like a real messenger: bubbles grow from the
 * bottom, days are separated, photos and links work, and the last of your own
 * messages says "Seen" once the other side has opened the thread.
 */
export function ChatThread({
  nudges,
  unread,
  me,
  otherName,
}: {
  nudges: NudgeWithUrl[];
  unread: number;
  me: Role;
  otherName: string;
}) {
  const [draft, setDraft] = useState("");
  const [attach, setAttach] = useState<{ file: File; previewUrl: string } | null>(null);
  const [locals, setLocals] = useState<LocalMsg[]>([]);
  const [synced, setSynced] = useState(nudges.length);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const marked = useRef(false);

  // Once the server round-trips a send, the real message is in `nudges` and
  // the optimistic copy must go. Done during render, before paint.
  if (synced !== nudges.length) {
    setSynced(nudges.length);
    setLocals([]);
  }

  // Opening the thread is what marks it read — once.
  useEffect(() => {
    if (unread === 0 || marked.current) return;
    marked.current = true;
    start(() => void markNudgesRead());
  }, [unread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [nudges.length, locals.length]);

  // Oldest first reads like a conversation; the stored list is newest first.
  const thread = [...nudges].reverse();
  const lastMine = [...nudges].find((n) => n.from === me);
  const seen = lastMine && lastMine.readAt !== null && locals.length === 0;

  async function pick(file: File | undefined) {
    if (!file) return;
    const small = await compressImage(file);
    setAttach({ file: small, previewUrl: URL.createObjectURL(small) });
  }

  function send() {
    const text = draft.trim();
    if ((!text && !attach) || pending) return;
    sfx.done();

    const fd = new FormData();
    fd.set("text", text);
    if (attach) fd.set("image", attach.file);

    setLocals((l) => [
      ...l,
      { id: `local_${Date.now()}`, body: text, previewUrl: attach?.previewUrl ?? null },
    ]);
    setDraft("");
    setAttach(null);
    start(() => void sendMessage(fd));
  }

  const initial = (otherName || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose/20 text-[15px] font-black text-rose">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] leading-tight font-black text-text">
            {otherName || "Your sponsor"}
          </p>
          <p className="text-[11px] font-bold text-faint">Only you two see this</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-y-auto px-3 py-3">
        {thread.length === 0 && locals.length === 0 && (
          <p className="pb-4 text-center text-[12.5px] font-semibold text-faint">
            Nothing yet. Say hi — it lands on {otherName || "their"}&apos;s side with a push.
          </p>
        )}

        {thread.map((n, i) => {
          const mine = n.from === me;
          const prev = thread[i - 1];
          const newDay = !prev || dayLabel(prev.sentAt) !== dayLabel(n.sentAt);
          return (
            <div key={n.id}>
              {newDay && (
                <p className="my-2.5 text-center text-[10.5px] font-black tracking-wide text-faint uppercase">
                  {dayLabel(n.sentAt)}
                </p>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] overflow-hidden rounded-2xl ${
                    mine
                      ? "rounded-br-md border border-rose/40 bg-rose/15"
                      : "rounded-bl-md border border-line-soft bg-surface"
                  }`}
                >
                  {n.imageUrl && (
                    <a href={n.imageUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={n.imageUrl}
                        alt="Shared photo"
                        className="max-h-72 w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  )}
                  {n.body && (
                    <p className="px-3.5 pt-2 text-[14px] leading-relaxed font-bold whitespace-pre-wrap text-text">
                      <Linkified text={n.body} />
                    </p>
                  )}
                  <p className={`px-3.5 pb-1.5 ${n.body ? "" : "pt-1.5"} text-right text-[9.5px] font-bold text-faint tabular-nums`}>
                    {timeOf(n.sentAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {locals.map((m) => (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[78%] overflow-hidden rounded-2xl rounded-br-md border border-rose/40 bg-rose/15 opacity-70">
              {m.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.previewUrl} alt="Sending photo" className="max-h-72 w-full object-cover" />
              )}
              {m.body && (
                <p className="px-3.5 pt-2 text-[14px] leading-relaxed font-bold whitespace-pre-wrap text-text">
                  {m.body}
                </p>
              )}
              <p className="px-3.5 pb-1.5 text-right text-[9.5px] font-bold text-faint">sending…</p>
            </div>
          </div>
        ))}

        {seen && (
          <p className="pr-1 text-right text-[10px] font-black tracking-wide text-faint uppercase">
            Seen
          </p>
        )}
        <div ref={endRef} />
      </div>

      {attach && (
        <div className="flex items-center gap-3 border-t border-line-soft px-4 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attach.previewUrl} alt="Ready to send" className="h-12 w-12 rounded-lg object-cover" />
          <span className="flex-1 text-[12px] font-bold text-muted">Photo attached</span>
          <button
            onClick={() => setAttach(null)}
            aria-label="Remove photo"
            className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-muted"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-line-soft px-3 py-2.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Attach a photo"
          className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-2xl border border-line bg-surface-2 text-muted"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M3.5 17.5l5-4.5 3.5 3 3.5-3.5 5 4.5" />
          </svg>
        </button>
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
          placeholder={`Message ${otherName || "them"}…`}
          className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-2.5 text-[14px] font-bold text-text outline-none focus:border-rose"
        />
        <button
          onClick={send}
          disabled={pending || (!draft.trim() && !attach)}
          aria-label="Send"
          className="press grid h-[44px] w-[44px] shrink-0 place-items-center rounded-2xl border-rose/60 bg-rose text-white disabled:border-line disabled:bg-surface-2 disabled:text-faint"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12l16-8-6 16-2.5-6.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
