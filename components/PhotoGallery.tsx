"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { prettyDay } from "@/lib/dates";
import { sfx } from "@/lib/sfx";

type Shot = { id: string; day: string; url: string };

export function PhotoGallery() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Shot | null>(null);

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
    const map = new Map<string, Shot[]>();
    for (const s of shots) {
      const list = map.get(s.day) ?? [];
      list.push(s);
      map.set(s.day, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [shots]);

  if (loading) return null;

  if (!shots.length) {
    return (
      <section className="card p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Gallery</h2>
        <p className="mt-1.5 text-[12.5px] leading-snug font-semibold text-muted">
          No photos yet. Add one on Today and it&apos;ll live here — in ninety-nine days this is
          going to be quite a thing to scroll back through.
        </p>
      </section>
    );
  }

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Gallery</h2>
        <span className="text-[11px] font-black text-faint tabular-nums">
          {shots.length} photo{shots.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-3 space-y-4">
        {byDay.map(([day, list]) => (
          <div key={day}>
            <p className="mb-1.5 text-[11px] font-black text-muted">{prettyDay(day)}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    sfx.tick();
                    setViewing(s);
                  }}
                  className="aspect-square overflow-hidden rounded-xl border border-line-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

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
              className="w-full max-w-sm text-center"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewing.url} alt="" className="w-full rounded-2xl border border-line" />
              <p className="mt-3 text-[12.5px] font-black text-muted">{prettyDay(viewing.day)}</p>
              <button
                onClick={() => setViewing(null)}
                className="press mt-3 w-full rounded-2xl border-line bg-surface-2 py-3 text-[13px] font-black tracking-wide text-text uppercase"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
