import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SideNav } from "@/components/SideNav";

/** Just the drawer, and the unread pill when there's something waiting. */
export function TopBar({ sponsorName, unread }: { sponsorName: string; unread: number }) {
  return (
    <header className="safe-top sticky top-0 z-20 bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        <SideNav sponsorName={sponsorName} unread={unread} />
        {unread > 0 && (
          <Link
            href="/messages"
            className="flex items-center gap-1.5 rounded-full bg-rose/12 py-1.5 pr-3 pl-2.5"
            aria-label={`${unread} unread message${unread === 1 ? "" : "s"}`}
          >
            <Icon.mail size={15} className="text-rose" />
            <span className="text-[12px] font-bold text-rose tabular-nums">{unread}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
