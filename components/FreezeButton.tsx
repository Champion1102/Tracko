"use client";

import { useState, useTransition } from "react";
import { spendFreeze } from "@/app/actions";
import { sfx } from "@/lib/sfx";

export function FreezeButton({ day, left }: { day: string; left: number }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (confirming) {
    return (
      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          disabled={pending}
          onClick={() => {
            sfx.done();
            start(() => void spendFreeze(day));
          }}
          className="press rounded-xl border-violet/60 bg-violet px-3 py-2 text-[11px] font-black text-ink uppercase"
        >
          Use it
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[11px] font-black text-faint uppercase"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        sfx.tick();
        setConfirming(true);
      }}
      className="press shrink-0 rounded-xl border-line bg-surface-2 px-3 py-2 text-center"
    >
      <span className="block text-base leading-none">❄️</span>
      <span className="mt-1 block text-[10px] font-black text-muted uppercase">
        {left} left
      </span>
    </button>
  );
}
