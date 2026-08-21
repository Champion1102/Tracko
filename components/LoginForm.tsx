"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { sfx } from "@/lib/sfx";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-3" onSubmit={() => sfx.tick()}>
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        placeholder="Enter your PIN"
        required
        className="w-full rounded-2xl border-2 border-line bg-ink-2 px-4 py-4 text-center text-xl font-black tracking-[0.4em] text-text outline-none focus:border-aqua"
      />
      <button
        disabled={pending}
        className="press w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase disabled:opacity-60"
      >
        {pending ? "…" : "Let me in"}
      </button>
      {state?.error && (
        <p className="text-[12.5px] font-bold text-flame">{state.error}</p>
      )}
    </form>
  );
}
