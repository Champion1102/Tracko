import { isBirthday, prettyDay } from "@/lib/dates";
import { money } from "@/lib/money";
import { loadState } from "@/lib/state";
import { BirthdayBanner } from "@/components/BirthdayBanner";
import { CoachBubble } from "@/components/CoachBubble";
import { HabitCard } from "@/components/HabitCard";
import { Messages } from "@/components/Messages";
import { PhotoStrip } from "@/components/PhotoStrip";
import { ProgressRing } from "@/components/ProgressRing";
import { SectionNav } from "@/components/SectionNav";
import { WeeklyCard } from "@/components/WeeklyCard";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const s = await loadState();
  const { todayScore, thisWeek, totals, config } = s;
  const cur = config.currency;
  const birthday = isBirthday(s.today, config.heroBirthday);

  const remaining = todayScore.perHabit.filter((p) => !p.done);
  const ringColor =
    todayScore.pct >= 99.5
      ? "var(--color-grass)"
      : todayScore.pct >= 70
        ? "var(--color-gold)"
        : "var(--color-flame)";

  const valueToday = (habitId: string) =>
    s.entries.find((e) => e.habitId === habitId && e.day === s.today)?.value ?? 0;

  const sections = [
    { id: "sec-day", label: "Day" },
    { id: "sec-habits", label: "Habits" },
    { id: "sec-photos", label: "Photos" },
    ...(thisWeek.perHabit.length ? [{ id: "sec-week", label: "Week" }] : []),
    ...(s.nudges.length ? [{ id: "messages", label: "Chat" }] : []),
  ];

  return (
    <div className="space-y-5">
      <SectionNav sections={sections} />

      {birthday && <BirthdayBanner name={config.heroName} rewardName={config.rewardName} />}

      <section id="sec-day" className="card flex items-center gap-4 scroll-mt-28 p-4">
        <ProgressRing pct={todayScore.pct} size={104} stroke={10} color={ringColor}>
          <div className="text-center">
            <div className="text-[15px] leading-none font-black text-text tabular-nums">
              {Math.round(todayScore.pct)}%
            </div>
            <div className="mt-0.5 text-[9px] font-black tracking-wide text-faint uppercase">
              today
            </div>
          </div>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.16em] text-faint uppercase">
            Day {todayScore.index} · {prettyDay(s.today)}
          </p>
          <h1 className="mt-1 text-[26px] leading-none font-black text-gold tabular-nums">
            {money(totals.todayValue, cur)}
          </h1>
          <p className="mt-1 text-[12.5px] leading-snug font-bold text-muted">
            {remaining.length === 0
              ? "Everything done. Full day banked."
              : `earned today · ${money(remaining.reduce((n, p) => n + p.habit.points, 0) * totals.perPoint, cur)} still on the table`}
          </p>
        </div>
      </section>

      {totals.yesterdayLost > 0 && (
        <a
          href="/journey"
          className="card flex items-center gap-3 border-flame/35 bg-flame/8 px-4 py-3"
        >
          <span className="text-[15px] font-black text-flame tabular-nums">
            −{money(totals.yesterdayLost * totals.perPoint, cur)}
          </span>
          <span className="flex-1 text-[12.5px] leading-snug font-bold text-muted">
            left on the table yesterday. It&apos;s still editable until tonight.
          </span>
          <span className="text-faint">›</span>
        </a>
      )}

      <CoachBubble mood={s.mascot.mood} text={s.mascot.text} coach={s.coach} />

      <Messages
        nudges={s.nudges}
        unread={s.unreadForHero.length}
        me="hero"
        otherName={config.sponsorName}
      />

      <section id="sec-habits" className="space-y-3 scroll-mt-28">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
            Every day
          </h2>
          <span className="text-[11px] font-black text-faint tabular-nums">
            {todayScore.perHabit.filter((p) => p.done).length}/{todayScore.perHabit.length} done
          </span>
        </div>
        {todayScore.perHabit.map((p) => (
          <HabitCard
            key={p.habit.id}
            p={p}
            day={s.today}
            perPoint={totals.perPoint}
            currency={cur}
            idealBedtime={config.idealBedtime}
            idealWakeTime={config.idealWakeTime}
          />
        ))}
      </section>

      <div id="sec-photos" className="scroll-mt-28">
        <PhotoStrip
          perPoint={totals.perPoint}
          currency={cur}
          bonusPoints={config.photoBonusPoints}
          max={config.photoMaxPerDay}
        />
      </div>

      {thisWeek.perHabit.length > 0 && (
        <section id="sec-week" className="space-y-3 scroll-mt-28">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
              {thisWeek.week.label} bonus
            </h2>
            <span className="text-[11px] font-black text-violet tabular-nums">
              {money(thisWeek.earned * totals.perPoint, cur)} of{" "}
              {money(thisWeek.max * totals.perPoint, cur)}
            </span>
          </div>
          {thisWeek.perHabit.map((row) => (
            <WeeklyCard
              key={row.habit.id}
              row={row}
              week={thisWeek.week}
              today={s.today}
              valueToday={valueToday(row.habit.id)}
              perPoint={totals.perPoint}
              currency={cur}
            />
          ))}
        </section>
      )}
    </div>
  );
}
