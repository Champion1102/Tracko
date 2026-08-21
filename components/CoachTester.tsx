"use client";

import { useState } from "react";
import { sfx } from "@/lib/sfx";

export function CoachTester({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ provider: string; sample: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) return null;

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/coach/generate", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      sfx.done();
      setResult({ provider: json.provider ?? "unknown", sample: json.sample ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1">
      <button
        onClick={run}
        disabled={busy}
        className="press w-full rounded-xl border-line bg-surface-2 py-2.5 text-[12px] font-black tracking-wide text-text uppercase disabled:opacity-60"
      >
        {busy ? "Writing…" : "Write today's lines now"}
      </button>
      {result && (
        <div className="mt-2">
          <p className="mb-1 text-[10px] font-black tracking-[0.16em] text-faint uppercase">
            Written by {result.provider}
          </p>
          <ul className="space-y-1">
            {result.sample.map((t) => (
              <li key={t} className="text-[12px] leading-snug font-bold text-grass">
                “{t}”
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="mt-2 text-[12px] font-bold text-flame">{error}</p>}
    </div>
  );
}
