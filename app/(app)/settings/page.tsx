import { logoutAction } from "@/app/actions";
import { money } from "@/lib/money";
import { cookies } from "next/headers";
import { loadState } from "@/lib/state";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { HabitIcon } from "@/components/HabitIcon";
import { HerSettings } from "@/components/HerSettings";
import { PromiseCard } from "@/components/PromiseCard";
import { PushSetup } from "@/components/PushSetup";
import { SWRegister } from "@/components/SWRegister";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await loadState();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const cur = s.config.currency;

  return (
    <div className="space-y-5">
      <SWRegister />

      <header className="px-1">
        <h1 className="text-2xl font-black text-text">
          {s.config.heroName ? `Hey ${s.config.heroName}` : "You"}
        </h1>
        <p className="mt-1 text-[13px] font-bold text-muted">
          Day {s.totals.daysElapsed} of {s.config.totalDays} · {money(s.totals.earnedValue, cur)}{" "}
          earned towards the {s.config.rewardName}.
        </p>
      </header>

      <PromiseCard
        text={s.config.promiseText}
        signature={s.config.promiseSignature}
        signedAt={s.config.promiseAcceptedAt}
        name={s.config.heroName}
        daysElapsed={s.totals.daysElapsed}
        earned={s.totals.earnedValue}
        currency={cur}
      />

      <PushSetup vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      <HerSettings config={s.config} theme={theme} />

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
            Your habits
          </h2>
          <span className="text-[11px] font-black text-gold tabular-nums">
            {money(100 * s.totals.perPoint, cur)} a perfect day
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {s.habits.map((h) => (
            <li key={h.id} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                <HabitIcon icon={h.icon} emoji={h.emoji} size={17} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-text">
                {h.name}
              </span>
              <span className="shrink-0 text-[12px] font-black text-muted tabular-nums">
                {money(h.points * s.totals.perPoint, cur)}
                {h.cadence === "weekly" ? " ea" : ""}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11.5px] leading-snug font-semibold text-faint">
          Want one changed, added or dropped? Ask {s.config.sponsorName || "whoever set this up"} —
          they hold the rules so the finish line can&apos;t move.
        </p>
      </section>

      <form action={logoutAction}>
        <button className="w-full py-3 text-[12px] font-black tracking-wide text-faint uppercase">
          Sign out
        </button>
      </form>
    </div>
  );
}
