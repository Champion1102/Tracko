"use client";

import { useRef, useState } from "react";
import { money } from "@/lib/money";
import { sfx } from "@/lib/sfx";

export type ShareData = {
  weekLabel: string;
  dayNumber: number;
  totalDays: number;
  weekPercents: number[];
  earnedThisWeek: number;
  streak: number;
  rewardPct: number;
  rewardName: string;
  currency: string;
  heroName: string;
};

const W = 1080;
const H = 1350;

/**
 * She has to post 2–3 times a week as one of her habits. Handing her the
 * content closes that loop — this draws the week as a shareable image.
 */
export function ShareCard({ data }: { data: ShareData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function draw(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return null;

    canvas.width = W;
    canvas.height = H;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#231A33");
    bg.addColorStop(0.55, "#120D1C");
    bg.addColorStop(1, "#0B0710");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W / 2, 240, 40, W / 2, 240, 620);
    glow.addColorStop(0, "rgba(243,203,132,0.20)");
    glow.addColorStop(1, "rgba(243,203,132,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 900);

    const font = (size: number, weight = 900) =>
      `${weight} ${size}px Nunito, ui-rounded, system-ui, sans-serif`;

    ctx.textAlign = "center";

    ctx.fillStyle = "#7C6F8E";
    ctx.font = font(34, 800);
    ctx.letterSpacing = "8px";
    ctx.fillText(data.weekLabel.toUpperCase(), W / 2, 150);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = "#F7F2FA";
    ctx.font = font(52);
    ctx.fillText(`Day ${data.dayNumber} of ${data.totalDays}`, W / 2, 226);

    // Earned this week — the headline.
    ctx.fillStyle = "#F3CB84";
    ctx.font = font(190);
    ctx.fillText(money(data.earnedThisWeek, data.currency), W / 2, 420);

    ctx.fillStyle = "#B0A4C0";
    ctx.font = font(40, 700);
    ctx.fillText("earned this week", W / 2, 486);

    // Seven bars, one per day.
    const barW = 108;
    const gap = 20;
    const totalW = data.weekPercents.length * barW + (data.weekPercents.length - 1) * gap;
    let x = (W - totalW) / 2;
    const baseY = 760;
    for (const pct of data.weekPercents) {
      const h = Math.max(10, (Math.min(pct, 100) / 100) * 200);
      ctx.fillStyle = "#2C2239";
      roundRect(ctx, x, baseY - 200, barW, 200, 22);
      ctx.fill();
      ctx.fillStyle = pct >= 99.5 ? "#63D471" : pct >= 70 ? "#F3CB84" : "#FF9152";
      roundRect(ctx, x, baseY - h, barW, h, 22);
      ctx.fill();
      x += barW + gap;
    }

    // Two stats side by side.
    const statY = 900;
    const drawStat = (cx: number, value: string, label: string, color: string) => {
      ctx.fillStyle = color;
      ctx.font = font(96);
      ctx.fillText(value, cx, statY);
      ctx.fillStyle = "#7C6F8E";
      ctx.font = font(34, 800);
      ctx.letterSpacing = "5px";
      ctx.fillText(label.toUpperCase(), cx, statY + 56);
      ctx.letterSpacing = "0px";
    };
    drawStat(W * 0.3, `${data.streak}`, "day streak", "#FF9152");
    drawStat(W * 0.7, `${Math.round(data.rewardPct)}%`, "to the goal", "#F3CB84");

    // Progress bar toward the reward.
    const barX = 120;
    const barY = 1060;
    const barWidth = W - 240;
    ctx.fillStyle = "#2C2239";
    roundRect(ctx, barX, barY, barWidth, 40, 20);
    ctx.fill();
    const fill = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    fill.addColorStop(0, "#A6742A");
    fill.addColorStop(1, "#F3CB84");
    ctx.fillStyle = fill;
    roundRect(ctx, barX, barY, Math.max(40, (data.rewardPct / 100) * barWidth), 40, 20);
    ctx.fill();

    ctx.fillStyle = "#B0A4C0";
    ctx.font = font(40, 800);
    ctx.fillText(data.rewardName, W / 2, barY + 110);

    ctx.fillStyle = "#4A4159";
    ctx.font = font(32, 800);
    ctx.letterSpacing = "6px";
    ctx.fillText(
      data.heroName ? `${data.heroName.toUpperCase()} · TRACKO` : "TRACKO",
      W / 2,
      H - 70,
    );
    ctx.letterSpacing = "0px";

    return canvas;
  }

  async function share() {
    setBusy(true);
    setNote(null);
    sfx.done();
    try {
      const canvas = draw();
      if (!canvas) throw new Error("Could not draw the card");

      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("Could not build the image");

      const file = new File([blob], `tracko-${data.weekLabel.toLowerCase().replace(/\s+/g, "-")}.png`, {
        type: "image/png",
      });

      // iOS only reliably hands a file to Instagram through the share sheet;
      // a download link is the desktop path.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${data.weekLabel} — Tracko` });
        setNote("Shared.");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setNote("Saved to your downloads.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setNote(err instanceof Error ? err.message : "Could not share it");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card border-violet/35 bg-violet/8 p-4">
      <h2 className="text-[11px] font-black tracking-[0.16em] text-violet uppercase">
        Your week, ready to post
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-snug font-semibold text-muted">
        You need two posts a week anyway. This makes one of them for you.
      </p>
      <button
        onClick={share}
        disabled={busy}
        className="press mt-3 w-full rounded-2xl border-violet/60 bg-violet py-3.5 text-[13px] font-black tracking-wide text-ink uppercase disabled:opacity-60"
      >
        {busy ? "Making it…" : "Make my week card"}
      </button>
      {note && <p className="mt-2 text-[12px] font-bold text-grass">{note}</p>}
      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </section>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
