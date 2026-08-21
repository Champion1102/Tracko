"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * She signs with her finger. It's kept as a PNG and shown back to her later,
 * which is the whole point — a checkbox is forgettable, her own handwriting
 * from day one is not.
 */
export function SignaturePad({
  onChange,
  height = 160,
}: {
  onChange: (dataUrl: string) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const inked = useRef(false);
  const sized = useRef({ w: 0, h: 0 });
  const [hasInk, setHasInk] = useState(false);

  const style = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    // getPropertyValue on a custom property returns the raw token — "var(...)"
    // is not a valid strokeStyle and silently leaves it black, which is
    // invisible on a dark canvas. `color` is already resolved to rgb().
    ctx.strokeStyle = getComputedStyle(canvas).color || "#F7F2FA";
  }, []);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    // Resizing clears the canvas, so only do it when the size really changed —
    // otherwise an on-screen keyboard opening would wipe her signature.
    if (Math.abs(rect.width - sized.current.w) < 1 && Math.abs(rect.height - sized.current.h) < 1) {
      const ctx = canvas.getContext("2d");
      if (ctx) style(ctx, canvas);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    sized.current = { w: rect.width, h: rect.height };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    style(ctx, canvas);
  }, [style]);

  useEffect(() => {
    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, [setup]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    last.current = p;

    // A tap with no drag should still leave a mark.
    const ctx = e.currentTarget.getContext("2d");
    if (ctx) {
      style(ctx, e.currentTarget);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
    if (!inked.current) {
      inked.current = true;
      setHasInk(true);
    }
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const from = last.current;
    if (!ctx || !from) return;
    const to = pos(e);

    // Midpoint smoothing — finger paths are jittery and straight segments show it.
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(from.x, from.y, (from.x + to.x) / 2, (from.y + to.y) / 2);
    ctx.stroke();
    last.current = to;
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    // inked is a ref, not state — the state value in this closure can still be
    // stale from the render that began the stroke.
    if (canvas && inked.current) onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    inked.current = false;
    setHasInk(false);
    onChange("");
  }

  return (
    <div>
      <div className="relative rounded-2xl border-2 border-dashed border-line bg-surface-2/40">
        <canvas
          ref={canvasRef}
          style={{ height, touchAction: "none" }}
          className="w-full text-text"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] font-bold text-faint">
            Sign here with your finger
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-5 border-b border-line/70" />
      </div>

      {hasInk && (
        <button
          onClick={clear}
          className="mt-2 w-full py-1.5 text-[11.5px] font-black tracking-wide text-faint uppercase"
        >
          Start again
        </button>
      )}
    </div>
  );
}
