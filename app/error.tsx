"use client";

import { useEffect } from "react";

/**
 * Catches a failed database read. Before this, a failed read was quietly
 * treated as an empty app; now it fails loudly and offers a retry, and
 * nothing is ever written on the way.
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="safe-top mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-4xl">🌧️</p>
      <h1 className="mt-4 text-xl font-black text-text">Couldn&apos;t reach your data</h1>
      <p className="mt-2 text-[13.5px] font-bold text-muted">
        Nothing was lost — the connection just dropped. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="press mt-6 w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase"
      >
        Try again
      </button>
    </div>
  );
}
