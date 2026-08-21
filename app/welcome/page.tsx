import { redirect } from "next/navigation";
import { currentRole, needsPinSetup } from "@/lib/auth";
import { loadState } from "@/lib/state";
import { Welcome } from "@/components/onboarding/Welcome";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const role = await currentRole();
  if (!role) redirect("/login");
  if (role === "sponsor") redirect("/sponsor");

  const s = await loadState();
  if (needsPinSetup(s.config, role)) redirect("/set-pin");
  if (s.config.onboardedAt) redirect("/today");

  return (
    <Welcome
      sponsorName={s.config.sponsorName}
      rewardName={s.config.rewardName}
      rewardPrice={s.config.rewardPrice}
      rewardImage={s.config.rewardImage}
      currency={s.config.currency}
      totalDays={s.config.totalDays}
      promiseText={s.config.promiseText}
      perPoint={s.totals.perPoint}
      habits={s.habits.map((h) => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        icon: h.icon,
        points: h.points,
        cadence: h.cadence,
      }))}
      vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
    />
  );
}
