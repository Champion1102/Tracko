import { redirect } from "next/navigation";
import { currentRole, needsPinSetup } from "@/lib/auth";
import { loadState } from "@/lib/state";
import { CelebrationStack } from "@/components/Celebration";
import { TabBar } from "@/components/TabBar";
import { SWRegister } from "@/components/SWRegister";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const role = await currentRole();
  if (!role) redirect("/login");
  if (role === "sponsor") redirect("/sponsor");

  const s = await loadState();
  if (needsPinSetup(s.config, role)) redirect("/set-pin");
  // She hasn't been through the welcome flow yet — nothing else should load
  // before she's named herself and made the promise.
  if (!s.config.onboardedAt) redirect("/welcome");

  return (
    <div className="min-h-dvh">
      <SWRegister />
      <TopBar totals={s.totals} config={s.config} unread={s.unreadForHero.length} />
      <main className="mx-auto max-w-md px-4 pt-4 pb-28">{children}</main>
      <TabBar badge={s.todayScore.perHabit.filter((p) => !p.done).length} />
      <CelebrationStack
        items={s.pending}
        rewardPct={s.totals.rewardPct}
        rewardImage={s.config.rewardImage}
        rewardName={s.config.rewardName}
      />
    </div>
  );
}
