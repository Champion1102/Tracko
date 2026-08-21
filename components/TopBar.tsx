import Link from "next/link";
import { Icon } from "@/components/Icon";
import { money } from "@/lib/money";
import type { Totals } from "@/lib/scoring";
import type { Config } from "@/lib/types";

export function TopBar({
  totals,
  config,
  unread,
}: {
  totals: Totals;
  config: Config;
  unread: number;
}) {
  const hot = totals.currentStreak > 0;

  return (
    <header className="safe-top sticky top-0 z-20 border-b border-line-soft bg-ink-2/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Icon.flame
            size={17}
            className={`${hot ? "text-flame" : "text-faint"} ${totals.currentStreak >= 3 ? "animate-flicker" : ""}`}
          />
          <span className={`text-[15px] font-black tabular-nums ${hot ? "text-flame" : "text-faint"}`}>
            {totals.currentStreak}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon.calendar size={16} className="text-muted" />
          <span className="text-[15px] font-black text-muted tabular-nums">
            {totals.daysElapsed}
            <span className="text-[11px] font-bold text-faint">/{config.totalDays}</span>
          </span>
        </div>

        <Link
          href="/reward"
          className="ml-auto flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 py-1.5 pr-3 pl-2.5"
        >
          <Icon.trophy size={15} className="text-gold" />
          <span className="text-[14px] font-black text-gold tabular-nums">
            {money(totals.earnedValue, config.currency)}
          </span>
        </Link>

        {/* Beside the reward, not in the tab bar — a seventh tab crowded the
            row, and this belongs next to the other money on screen. */}
        <Link
          href="/money"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-violet/35 bg-violet/12"
          aria-label="Money"
          title="Money"
        >
          <Icon.wallet size={16} className="text-violet" />
        </Link>

        {unread > 0 && (
          <Link
            href="/today#messages"
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rose/35 bg-rose/12"
            aria-label={`${unread} unread messages`}
          >
            <Icon.mail size={16} className="text-rose" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose ring-2 ring-ink-2" />
          </Link>
        )}
      </div>
    </header>
  );
}
