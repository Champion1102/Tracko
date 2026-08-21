"use client";

import { useState, useTransition } from "react";
import { resetOnboarding, updateDeal } from "@/app/actions";
import { sfx } from "@/lib/sfx";

export function PromiseEditor({
  text,
  signature,
  signedAt,
  heroName,
}: {
  text: string;
  signature: string;
  signedAt: string | null;
  heroName: string;
}) {
  const [draft, setDraft] = useState(text);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, start] = useTransition();

  const dirty = draft !== text;
  const signed = signedAt !== null;

  return (
    <section className="card space-y-3 p-4">
      <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">The promise</h2>
      <p className="-mt-1 text-[12px] leading-snug font-semibold text-muted">
        {signed
          ? `${heroName || "She"} read this and signed it. It's shown back to her in her settings.`
          : "She reads this during setup and signs it with her finger. Write it before she starts."}
      </p>

      <textarea
        value={draft}
        rows={9}
        disabled={signed}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full resize-none rounded-xl border border-line bg-ink-2 px-3.5 py-3 text-[13.5px] leading-relaxed font-semibold text-text outline-none focus:border-gold disabled:opacity-60"
      />

      {signed && signedAt ? (
        <>
          {signature && (
            <div className="rounded-xl border border-line-soft bg-surface-2/50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signature} alt="Her signature" className="h-16 w-full object-contain" />
            </div>
          )}
          <p className="text-[11.5px] font-bold text-faint">
            Signed{" "}
            {new Date(signedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            . Locked so it can&apos;t be quietly rewritten after the fact.
          </p>

          {confirmReset ? (
            <div className="flex gap-2">
              <button
                disabled={pending}
                onClick={() => {
                  sfx.tick();
                  start(async () => {
                    await resetOnboarding();
                    setConfirmReset(false);
                  });
                }}
                className="press flex-1 rounded-xl border-flame-deep bg-flame py-2.5 text-[12px] font-black tracking-wide text-ink uppercase"
              >
                Yes, clear it
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="press rounded-xl border-line bg-surface-2 px-4 py-2.5 text-[12px] font-black text-text uppercase"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2 text-[11.5px] font-black tracking-wide text-faint uppercase"
            >
              Run her setup again
            </button>
          )}
        </>
      ) : (
        <button
          disabled={!dirty || pending}
          onClick={() => {
            sfx.done();
            start(() => void updateDeal({ promiseText: draft }));
          }}
          className="press w-full rounded-xl border-grass-deep bg-grass py-3 text-[12.5px] font-black tracking-wide text-ink uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
        >
          {pending ? "Saving…" : dirty ? "Save the promise" : "Saved ✓"}
        </button>
      )}
    </section>
  );
}
