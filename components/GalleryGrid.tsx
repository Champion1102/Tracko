"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { prettyDay } from "@/lib/dates";
import { sfx } from "@/lib/sfx";

type Shot = { id: string; day: string; url: string };

/**
 * Her whole library, newest first. The API already returns them in order, so
 * the flat list *is* the viewer's running order — the day headings are only a
 * presentation grouping over the top of it. Keeping one flat array means
 * next/previous walks across day boundaries the way a photos app does.
 */
export function GalleryGrid() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [at, setAt] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    fetch("/api/photos?all=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        setShots(d?.photos ?? []);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, { shot: Shot; index: number }[]>();
    shots.forEach((shot, index) => {
      const list = map.get(shot.day) ?? [];
      list.push({ shot, index });
      map.set(shot.day, list);
    });
    return [...map.entries()];
  }, [shots]);

  const open = useCallback((index: number) => {
    sfx.tick();
    setAt(index);
  }, []);

  const step = useCallback(
    (delta: number) =>
      setAt((cur) => {
        if (cur === null) return cur;
        const next = cur + delta;
        return next < 0 || next >= shots.length ? cur : next;
      }),
    [shots.length],
  );

  // Arrow keys and Escape, so it behaves on a laptop too.
  useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAt(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, step]);

  // The viewer is full-screen; letting the page scroll underneath it is how you
  // end up somewhere else entirely when you close it.
  useEffect(() => {
    if (at === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [at]);

  async function remove(id: string) {
    const index = shots.findIndex((s) => s.id === id);
    setShots((s) => s.filter((p) => p.id !== id));
    setAt((cur) => {
      const left = shots.length - 1;
      if (cur === null || left === 0) return null;
      return Math.min(index, left - 1);
    });
    sfx.tick();
    await fetch("/api/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-surface-2" />
        ))}
      </div>
    );
  }

  if (!shots.length) {
    return (
      <section className="card grid place-items-center p-8 text-center">
        <p className="text-[15px] font-black text-text">Nothing here yet.</p>
        <p className="mt-1.5 max-w-[32ch] text-[12.5px] leading-snug font-semibold text-muted">
          Add a photo on Today and it&apos;ll live here. In a few months this is going to be quite
          a thing to scroll back through.
        </p>
      </section>
    );
  }

  const current = at === null ? null : shots[at];

  return (
    <>
      <div className="space-y-5">
        {byDay.map(([day, list]) => (
          <div key={day}>
            <p className="mb-1.5 px-1 text-[11px] font-black text-muted">{prettyDay(day)}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {list.map(({ shot, index }) => (
                <button
                  key={shot.id}
                  onClick={() => open(index)}
                  className="press aspect-square overflow-hidden rounded-xl border border-line-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="safe-top flex items-center justify-between px-4 py-3">
              <span className="text-[12px] font-black text-muted tabular-nums">
                {at! + 1} of {shots.length}
              </span>
              <button
                onClick={() => setAt(null)}
                className="press rounded-full border-line bg-surface-2 px-4 py-2 text-[11.5px] font-black tracking-wide text-text uppercase"
              >
                Close
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
              <motion.img
                key={current.id}
                src={current.url}
                alt=""
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) step(1);
                  else if (info.offset.x > 60) step(-1);
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18 }}
                className="max-h-full max-w-full cursor-grab rounded-2xl border border-line object-contain active:cursor-grabbing"
              />

              {at! > 0 && (
                <Arrow side="left" onClick={() => step(-1)} />
              )}
              {at! < shots.length - 1 && (
                <Arrow side="right" onClick={() => step(1)} />
              )}
            </div>

            <div className="safe-bottom px-6 py-4 text-center">
              <p className="text-[12.5px] font-black text-muted">{prettyDay(current.day)}</p>
              <button
                onClick={() => remove(current.id)}
                className="press mt-3 rounded-2xl border-flame-deep bg-flame px-6 py-2.5 text-[11.5px] font-black tracking-wide text-ink uppercase"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 -translate-y-1/2 ${
        side === "left" ? "left-1" : "right-1"
      } grid h-11 w-11 place-items-center rounded-full border border-line bg-ink/70 text-text`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {side === "left" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  );
}
