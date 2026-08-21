"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { sfx } from "@/lib/sfx";

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

export function ThemeToggle({ current }: { current: Theme }) {
  const [theme, setTheme] = useState<Theme>(current);
  const router = useRouter();

  function choose(next: Theme) {
    sfx.tick();
    setTheme(next);

    // A year-long cookie so the server can render the right palette on every
    // future request, including the very first paint after a cold start.
    writeCookie(THEME_COOKIE, next);

    // Apply immediately as well — waiting for the round trip would flicker.
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);

    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = getComputedStyle(root).getPropertyValue("--color-ink").trim();
    if (meta && bg) meta.setAttribute("content", bg);

    // Keep the server's idea of the theme in sync for subsequent navigations.
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[14px] font-bold text-text">Appearance</span>
      <div className="flex rounded-xl border border-line bg-surface-2 p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className={`rounded-[9px] px-3 py-1.5 text-[12px] font-black transition-colors ${
              theme === o.value ? "bg-gold text-ink" : "text-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
