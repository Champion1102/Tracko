"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/Icon";
import { sfx } from "@/lib/sfx";

/**
 * Everything that isn't a daily stop lives here, so the tab bar can stay
 * small: Today, Journey, Nimbus, Reward down there — the rest behind this.
 *
 * The overlay renders through a portal on <body>: the top bar's
 * backdrop-blur makes it a containing block for fixed descendants, which
 * left the drawer clipped to the header and see-through.
 */
export function SideNav({ sponsorName, unread }: { sponsorName: string; unread: number }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Escape closes; the page behind shouldn't scroll while the drawer is up.
  // Locking scroll removes the scrollbar, so pad the body by its width or
  // everything visibly shifts on open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  const items = [
    {
      href: "/messages",
      label: sponsorName || "Sponsor",
      blurb: "Notes between you two",
      icon: Icon.mail,
      tint: "bg-rose/15 text-rose",
      badge: unread > 0,
    },
    { href: "/stats", label: "Stats", blurb: "Streaks, heatmap, what sticks", icon: Icon.chart, tint: "bg-aqua/15 text-aqua", badge: false },
    { href: "/money", label: "Money", blurb: "Spending, verdicts", icon: Icon.wallet, tint: "bg-violet/15 text-violet", badge: false },
    { href: "/gallery", label: "Gallery", blurb: "Proof photos, day by day", icon: Icon.photos, tint: "bg-grass/15 text-grass", badge: false },
    { href: "/settings", label: "You", blurb: "Reminders, sound, theme, PIN", icon: Icon.person, tint: "bg-gold/15 text-gold", badge: false },
  ];

  return (
    <>
      <button
        onClick={() => {
          sfx.tick();
          setOpen(true);
        }}
        aria-label="Menu"
        aria-expanded={open}
        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-muted"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose ring-2 ring-ink-2" />
        )}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 bg-ink/70"
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 36 }}
                  className="safe-top fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-ink-2 shadow-2xl"
                >
                  <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <span className="text-[11px] font-black tracking-[0.2em] text-faint uppercase">
                      More
                    </span>
                    <button
                      onClick={() => {
                        sfx.tick();
                        setOpen(false);
                      }}
                      aria-label="Close"
                      className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-muted"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>

                  <nav className="flex flex-col gap-1 px-3 py-2">
                    {items.map((item) => {
                      const active = path === item.href;
                      const Glyph = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            sfx.tick();
                            setOpen(false);
                          }}
                          className={`flex items-center gap-3.5 rounded-2xl px-3 py-3 ${
                            active ? "bg-surface-2" : ""
                          }`}
                        >
                          <span
                            className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tint}`}
                          >
                            <Glyph size={19} />
                            {item.badge && (
                              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose ring-2 ring-ink-2" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-[14px] font-black ${active ? "text-gold" : "text-text"}`}
                            >
                              {item.label}
                            </span>
                            <span className="block truncate text-[11px] font-bold text-faint">
                              {item.blurb}
                            </span>
                          </span>
                          <span className="text-faint">›</span>
                        </Link>
                      );
                    })}
                  </nav>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
