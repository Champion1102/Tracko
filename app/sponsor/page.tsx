import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { currentRole } from "@/lib/auth";
import { coachConfigured, coachProviderNames } from "@/lib/coach";
import { prettyDay } from "@/lib/dates";
import { usingSupabase } from "@/lib/db";
import { money } from "@/lib/money";
import { loadState } from "@/lib/state";
import { CoachTester } from "@/components/CoachTester";
import { DealSettings } from "@/components/DealSettings";
import { DysonBuild } from "@/components/DysonBuild";
import { HabitIcon } from "@/components/HabitIcon";
import { HabitEditor } from "@/components/HabitEditor";
import { LetterEditor } from "@/components/LetterEditor";
import { Messages } from "@/components/Messages";
import { PromiseEditor } from "@/components/PromiseEditor";
import { PushSetup } from "@/components/PushSetup";
import { RewardImage } from "@/components/RewardImage";
import { SWRegister } from "@/components/SWRegister";

export const dynamic = "force-dynamic";

export default async function SponsorPage() {
  const role = await currentRole();
  if (!role) redirect("/login");
  if (role === "hero") redirect("/today");

  const s = await loadState();
  const { totals, todayScore, config, days } = s;
  const cur = config.currency;
  const done = todayScore.perHabit.filter((p) => p.done);
  const missing = todayScore.perHabit.filter((p) => !p.done);
  const recent = days.filter((d) => d.status !== "future").slice(-7).reverse();
  const her = config.heroName || "She";
  const maxPoints = totals.max;

  return (
    <div className="safe-top safe-bottom mx-auto max-w-md space-y-6 px-4 pt-5 pb-12">
      <SWRegister />

      <header className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-faint uppercase">
            Sponsor view
          </p>
          <h1 className="mt-0.5 text-2xl font-black text-text">
            {her}&apos;s {config.totalDays} days
          </h1>
          <p className="mt-1 text-[13px] font-bold text-muted">
            Day {totals.daysElapsed} · {prettyDay(s.today)}
          </p>
        </div>
        <form action={logoutAction}>
          <button className="text-[11px] font-black tracking-wide text-faint uppercase">
            Sign out
          </button>
        </form>
      </header>

      <section className="card p-4">
        <div className="flex items-center gap-4">
          {config.rewardImage ? (
            <RewardImage src={config.rewardImage} alt={config.rewardName} rewardPct={totals.rewardPct} size={110} />
          ) : (
            <DysonBuild rewardPct={totals.rewardPct} size={110} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.16em] text-faint uppercase">
              She&apos;s earned
            </p>
            <div className="text-[30px] leading-none font-black text-gold tabular-nums">
              {money(totals.earnedValue, cur)}
            </div>
            <p className="mt-0.5 text-[12px] font-bold text-muted">
              of {money(config.rewardPrice, cur)} · {totals.rewardPct.toFixed(1)}%
            </p>
            <div className="mt-2.5 h-3 overflow-hidden rounded-full border border-line bg-ink-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold"
                style={{ width: `${Math.max(totals.rewardPct, 1.5)}%` }}
              />
            </div>
            <p className={`mt-2 text-[11.5px] font-black uppercase ${totals.onTrack ? "text-grass" : "text-flame"}`}>
              {totals.onTrack ? "On track" : "Behind pace"}
            </p>
          </div>
        </div>
      </section>

      {(totals.yesterdayLost > 0 || totals.penaltyDays > 0) && (
        <section className="card border-flame/35 bg-flame/8 p-4">
          <p className="text-[10px] font-black tracking-[0.16em] text-flame uppercase">
            What slipping costs
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed font-bold text-text">
            {totals.yesterdayLost > 0 &&
              `Yesterday she left ${money(totals.yesterdayLost * totals.perPoint, cur)} on the table. `}
            {totals.penaltyDays > 0 &&
              `The penalty rule has taken ${money(totals.penaltyLost * totals.perPoint, cur)} across ${totals.penaltyDays} day${totals.penaltyDays === 1 ? "" : "s"}.`}
          </p>
        </section>
      )}

      <section className="grid grid-cols-4 gap-2">
        <Tile v={String(totals.currentStreak)} l="streak" tone="text-flame" />
        <Tile v={String(totals.perfectDays)} l="perfect" tone="text-grass" />
        <Tile v={String(totals.missedDays)} l="missed" tone="text-muted" />
        <Tile v={money(totals.actualPace * totals.perPoint, cur)} l="avg/day" tone="text-aqua" />
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Today</h2>
          <span className="text-[12px] font-black text-gold tabular-nums">
            {money(totals.todayValue, cur)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {done.map((p) => (
            <span key={p.habit.id} className="grid h-8 w-8 place-items-center rounded-lg bg-grass/20 text-grass">
              <HabitIcon icon={p.habit.icon} emoji={p.habit.emoji} size={17} />
            </span>
          ))}
          {missing.map((p) => (
            <span key={p.habit.id} className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-faint">
              <HabitIcon icon={p.habit.icon} emoji={p.habit.emoji} size={17} />
            </span>
          ))}
        </div>
        {missing.length > 0 && (
          <p className="mt-3 text-[12.5px] leading-snug font-semibold text-muted">
            Still open: {missing.map((p) => p.habit.name).join(", ")}.
          </p>
        )}
      </section>

      <Messages
        nudges={s.nudges}
        unread={s.unreadForSponsor.length}
        me="sponsor"
        otherName={config.heroName}
        startOpen
      />

      <section className="card p-4">
        <h2 className="mb-3 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Last 7 days
        </h2>
        <ul className="space-y-2">
          {recent.map((d) => (
            <li key={d.day} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[11.5px] font-bold text-faint">
                {prettyDay(d.day)}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${d.pct >= 99.5 ? "bg-grass" : d.pct >= 70 ? "bg-gold" : "bg-flame"}`}
                  style={{ width: `${Math.max(d.pct, 2)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-[11.5px] font-black text-text tabular-nums">
                {money(d.points * totals.perPoint, cur)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2.5">
        <h2 className="px-1 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Sealed letters
        </h2>
        <p className="px-1 text-[12.5px] leading-snug font-semibold text-muted">
          Write these now. She can&apos;t see them until she reaches the day, and once she opens one
          it locks.
        </p>
        {s.letters.map((l) => (
          <LetterEditor key={l.id} letter={l} daysElapsed={totals.daysElapsed} />
        ))}
      </section>

      <hr className="border-line-soft" />

      <div className="px-1">
        <h2 className="text-lg font-black text-text">Setup</h2>
        <p className="mt-1 text-[12.5px] font-semibold text-muted">
          Only you can see or change any of this. Her side has reminders and sound, nothing else.
        </p>
      </div>

      <PromiseEditor
        text={config.promiseText}
        signature={config.promiseSignature}
        signedAt={config.promiseAcceptedAt}
        heroName={config.heroName}
      />

      <DealSettings config={config} maxPoints={maxPoints} />
      <HabitEditor habits={s.allHabits} />

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Under the hood
        </h2>
        <Row
          label="Storage"
          value={usingSupabase() ? "Supabase" : "Local file"}
          note={
            usingSupabase()
              ? "Safe across devices and reinstalls."
              : "Development only. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to sync."
          }
          ok={usingSupabase()}
        />
        <Row
          label="Nimbus's writing"
          value={coachConfigured() ? (s.coach?.provider ?? "Ready") : "Built-in lines"}
          note={
            coachConfigured()
              ? `${coachProviderNames().join(" → ")}, tried in order. Written once a day${s.coach ? "" : " — first batch lands on the next 5am run"}.`
              : "Add GROQ_API_KEY to have the lines written fresh each morning."
          }
          ok={coachConfigured()}
        />
        <CoachTester enabled={coachConfigured()} />
      </section>

      <PushSetup vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
    </div>
  );
}

function Tile({ v, l, tone }: { v: string; l: string; tone: string }) {
  return (
    <div className="card p-2.5 text-center">
      <div className={`text-[15px] font-black tabular-nums ${tone}`}>{v}</div>
      <div className="text-[9px] font-black tracking-wide text-faint uppercase">{l}</div>
    </div>
  );
}

function Row({ label, value, note, ok }: { label: string; value: string; note: string; ok: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-text">{label}</span>
        <span className={`text-[12px] font-black ${ok ? "text-grass" : "text-faint"}`}>{value}</span>
      </div>
      <p className="mt-0.5 text-[11.5px] leading-snug font-semibold text-muted">{note}</p>
    </div>
  );
}
