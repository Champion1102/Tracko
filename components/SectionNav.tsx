"use client";

import { useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";

export type Section = { id: string; label: string };

/**
 * Today is a long page by design — she should see the whole day at once.
 * This gives her a way to jump without the scroll, and tracks which section
 * she's actually looking at.
 */
export function SectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // Bias the band towards the top so the heading you just scrolled to wins.
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [sections]);

  function jump(id: string) {
    sfx.tick();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <div className="safe-top sticky top-[52px] z-10 -mx-4 mb-1 border-b border-line-soft bg-ink/85 px-4 py-2 backdrop-blur-xl">
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => jump(s.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-black tracking-wide whitespace-nowrap uppercase transition-colors ${
              active === s.id
                ? "bg-gold text-ink"
                : "border border-line-soft bg-surface-2 text-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
