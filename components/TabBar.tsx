"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { sfx } from "@/lib/sfx";

const TABS = [
  { href: "/today", label: "Today", icon: Icon.today },
  { href: "/journey", label: "Journey", icon: Icon.journey },
  { href: "/chat", label: "Nimbus", icon: Icon.chat },
  { href: "/reward", label: "Reward", icon: Icon.trophy },
  { href: "/stats", label: "Stats", icon: Icon.chart },
  { href: "/settings", label: "You", icon: Icon.person },
];

export function TabBar({ badge = 0 }: { badge?: number }) {
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
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-black tracking-wide uppercase transition-colors ${
                active ? "text-gold" : "text-faint"
              }`}
            >
              <span className="relative grid h-[20px] w-[20px] place-items-center">
                <Glyph size={20} />
                {t.href === "/today" && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-rose px-[3px] text-[9px] leading-none font-black text-white ring-2 ring-ink-2">
                    {badge}
                  </span>
                )}
              </span>
              {t.label}
              {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gold" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
