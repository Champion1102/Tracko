"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { compressImage } from "@/lib/compress";
import { money } from "@/lib/money";
import { sfx } from "@/lib/sfx";

type Shot = { id: string; day: string; url: string };

export function PhotoStrip({
  perPoint,
  currency,
  bonusPoints,
  max,
}: {
  perPoint: number;
  currency: string;
  bonusPoints: number;
  max: number;
}) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Shot | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    fetch("/api/photos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setShots(d.photos))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const each = money(bonusPoints * perPoint, currency);
  const earned = money(Math.min(shots.length, max) * bonusPoints * perPoint, currency);
  const full = shots.length >= max;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);

    for (const file of Array.from(files).slice(0, max - shots.length)) {
      try {
        const body = new FormData();
        body.append("file", await compressImage(file));
        const res = await fetch("/api/photos", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        setShots((s) => [...s, json.photo]);
        sfx.done();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }

    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function remove(id: string) {
    setShots((s) => s.filter((p) => p.id !== id));
    setViewing(null);
    sfx.tick();
    await fetch("/api/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Today in photos
        </h2>
        <div className="flex shrink-0 items-baseline gap-3">
          <span className={`text-[12px] font-black tabular-nums ${shots.length ? "text-gold" : "text-faint"}`}>
            {shots.length ? `+${earned}` : `${each} each`}
          </span>
          <Link
            href="/gallery"
            className="text-[11px] font-black tracking-[0.16em] text-gold uppercase"
          >
            See all
          </Link>
        </div>
      </div>
      <p className="mt-1 text-[12.5px] leading-snug font-semibold text-muted">
        Optional. Up to {max} a day — a gym selfie, your plate, your water bottle. Pure bonus, it
        only ever pulls the {currency}
        {""} closer.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {shots.map((s) => (
          <button
            key={s.id}
            onClick={() => setViewing(s)}
            className="relative h-[72px] w-[72px] overflow-hidden rounded-xl border border-line"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}

        {!full && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="press grid h-[72px] w-[72px] place-items-center rounded-xl border-line bg-surface-2 text-[26px] leading-none font-black text-faint disabled:opacity-50"
            aria-label="Add a photo"
          >
            {busy ? "…" : "+"}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />

      {error && <p className="mt-2 text-[12px] font-bold text-flame">{error}</p>}

      <AnimatePresence>
        {viewing && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/92 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewing(null)}
          >
            <motion.div
              className="w-full max-w-sm"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewing.url} alt="" className="w-full rounded-2xl border border-line" />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setViewing(null)}
                  className="press flex-1 rounded-2xl border-line bg-surface-2 py-3 text-[13px] font-black tracking-wide text-text uppercase"
                >
                  Close
                </button>
                <button
                  onClick={() => remove(viewing.id)}
                  className="press rounded-2xl border-flame-deep bg-flame px-5 py-3 text-[13px] font-black tracking-wide text-ink uppercase"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
