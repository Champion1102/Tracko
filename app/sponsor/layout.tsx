import { redirect } from "next/navigation";
import { currentRole, needsPinSetup } from "@/lib/auth";
import { prettyDay } from "@/lib/dates";
import { loadState } from "@/lib/state";
import { SponsorTabBar } from "@/components/SponsorTabBar";
import { SWRegister } from "@/components/SWRegister";

export const dynamic = "force-dynamic";

/** Shared frame for the sponsor console: auth, header, bottom nav. */
export default async function SponsorLayout({ children }: { children: React.ReactNode }) {
  const role = await currentRole();
  if (!role) redirect("/login");
  if (role === "hero") redirect("/today");

  const s = await loadState();
  if (needsPinSetup(s.config, role)) redirect("/set-pin");
  const her = s.config.heroName || "She";

  return (
    <div className="safe-top mx-auto max-w-md px-4 pt-5 pb-24">
      <SWRegister />

      {/* PIN, sign-out and appearance live under Setup → Account now. */}
      <header className="mb-5 px-1">
        <p className="text-[10px] font-black tracking-[0.2em] text-faint uppercase">
          Sponsor view
        </p>
        <h1 className="mt-0.5 text-2xl font-black text-text">
          {her}&apos;s {s.config.totalDays} days
        </h1>
        <p className="mt-1 text-[13px] font-bold text-muted">
          Day {s.totals.daysElapsed} · {prettyDay(s.today)}
        </p>
      </header>

      <main>{children}</main>

      <SponsorTabBar unread={s.unreadForSponsor.length} />
    </div>
  );
}
