"use client";

import { useActionState } from "react";
import { setOwnPin } from "@/app/actions";
import { sfx } from "@/lib/sfx";

const box =
  "w-full rounded-2xl border-2 border-line bg-ink-2 px-4 py-4 text-center text-xl font-black tracking-[0.4em] text-text outline-none focus:border-aqua";

export function SetPinForm({ mode }: { mode: "first" | "change" }) {
  const [state, action, pending] = useActionState(setOwnPin, null);

  return (
    <form action={action} className="space-y-3" onSubmit={() => sfx.tick()}>
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        placeholder="New PIN"
        minLength={6}
        maxLength={8}
        required
        className={box}
      />
      <input
        name="confirm"
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        placeholder="Again"
        minLength={6}
        maxLength={8}
        required
        className={box}
      />
      <button
        disabled={pending}
        className="press w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase disabled:opacity-60"
      >
        {pending ? "…" : mode === "first" ? "Make it mine" : "Update PIN"}
      </button>
      {state?.error && <p className="text-[12.5px] font-bold text-flame">{state.error}</p>}
    </form>
  );
}
