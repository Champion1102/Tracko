"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

const HOLD_MS = 1800;

/**
 * A promise shouldn't be one tap. Holding for nearly two seconds is long
 * enough that she has to mean it, and short enough that it isn't a chore.
 */
export function HoldToSeal({
  label,
  onDone,
  disabled,
}: {
  label: string;
  onDone: () => void;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const fired = useRef(false);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  function tick(now: number) {
    if (startedAt.current === null) return;
    const p = Math.min((now - startedAt.current) / HOLD_MS, 1);
    setProgress(p);
    if (p >= 1) {
      if (!fired.current) {
        fired.current = true;
        sfx.fanfare();
        onDone();
      }
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }

  function begin() {
    if (disabled || fired.current) return;
    sfx.step();
    startedAt.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }

  function cancel() {
    if (fired.current) return;
    startedAt.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    setProgress(0);
  }

  return (
    <button
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className="relative w-full overflow-hidden rounded-2xl border-2 border-gold/50 bg-surface-2 py-4 text-[13px] font-black tracking-wide text-text uppercase select-none disabled:opacity-40"
      style={{ touchAction: "none" }}
    >
      <span
        className="absolute inset-y-0 left-0 bg-gold/35"
        style={{ width: `${progress * 100}%`, transition: progress === 0 ? "width 200ms ease" : "none" }}
        aria-hidden
      />
      <span className="relative">
        {progress > 0 && progress < 1 ? "Keep holding…" : label}
      </span>
    </button>
  );
}
