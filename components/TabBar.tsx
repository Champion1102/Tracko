"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { sfx } from "@/lib/sfx";

// The four daily stops. Messages, Money, Gallery and You live in the drawer.
const TABS = [
  { href: "/today", label: "Today", icon: Icon.today },
  { href: "/progress", label: "Progress", icon: Icon.chart },
  { href: "/journal", label: "Journal", icon: Icon.book },
  { href: "/chat", label: "Nimbus", icon: Icon.chat },
];

export function TabBar() {
  const path = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-ink-2/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active = path === t.href;
          const Glyph = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => sfx.tick()}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
                active ? "text-text" : "text-faint"
              }`}
            >
              <Glyph size={21} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
