import { addDays, isBirthday, prettyDay } from "@/lib/dates";
import { money } from "@/lib/money";
import { loadState } from "@/lib/state";
import type { DayScore } from "@/lib/scoring";
import { BirthdayBanner } from "@/components/BirthdayBanner";
import { CoachBubble } from "@/components/CoachBubble";
import { DoneStack } from "@/components/DoneStack";
import { HabitRow } from "@/components/HabitRow";
import { PhotoStrip } from "@/components/PhotoStrip";
import { ProgressRing } from "@/components/ProgressRing";
import { QuickLogBar } from "@/components/QuickLogBar";
import { SectionNav } from "@/components/SectionNav";
import { WeeklyCard } from "@/components/WeeklyCard";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const s = await loadState();
  const { todayScore, thisWeek, totals, config } = s;
  const cur = config.currency;
  const birthday = isBirthday(s.today, config.heroBirthday);

  const remaining = todayScore.perHabit.filter((p) => !p.done);
  const done = todayScore.perHabit.filter((p) => p.done);
  const openValue = remaining.reduce((n, p) => n + p.habit.points, 0) * totals.perPoint;
  const ringColor =
    todayScore.pct >= 99.5
      ? "var(--color-grass)"
      : todayScore.pct >= 70
        ? "var(--color-gold)"
        : "var(--color-flame)";

  const valueToday = (habitId: string) =>
    s.entries.find((e) => e.habitId === habitId && e.day === s.today)?.value ?? 0;

  // Rolling week ending today, for the glanceable consistency strip.
  const byDay = new Map(s.days.map((d) => [d.day, d]));
  const strip = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(s.today, i - 6);
    return { day, score: byDay.get(day) };
  });

  const sections = [
    { id: "sec-day", label: "Day" },
    { id: "sec-habits", label: "Habits" },
    { id: "sec-photos", label: "Photos" },
    ...(thisWeek.perHabit.length ? [{ id: "sec-week", label: "Week" }] : []),
  ];

  return (
    <div className="space-y-4 pb-16">
      <SectionNav sections={sections} />

      {birthday && <BirthdayBanner name={config.heroName} rewardName={config.rewardName} />}

      <section id="sec-day" className="card scroll-mt-28 p-4">
        <div className="flex items-center gap-3.5">
          <ProgressRing pct={todayScore.pct} size={76} stroke={8} color={ringColor}>
            <div className="text-[13px] leading-none font-black text-text tabular-nums">
              {Math.round(todayScore.pct)}%
            </div>
          </ProgressRing>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.16em] text-faint uppercase">
              Day {todayScore.index} · {prettyDay(s.today)}
            </p>
            <p className="mt-0.5 text-[24px] leading-none font-black text-gold tabular-nums">
              {money(totals.todayValue, cur)}
            </p>
            <p className="mt-1 text-[12px] leading-snug font-bold text-muted tabular-nums">
              {remaining.length === 0
                ? "Everything done. Full day banked."
                : `earned · ${money(openValue, cur)} still open`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex justify-between gap-1 border-t border-line-soft pt-3">
          {strip.map(({ day, score }) => (
            <WeekDot key={day} day={day} score={score} today={s.today} />
          ))}
        </div>
      </section>

      {remaining.length > 0 ? (
        <div
          className={`card flex items-center gap-2.5 px-3.5 py-2.5 ${
            remaining.length <= 2 ? "border-gold/45 bg-gold/12" : "border-gold/25 bg-gold/8"
          }`}
        >
          <span className="text-[16px]" aria-hidden>
            {remaining.length <= 2 ? "⚡" : "🎯"}
          </span>
          <span className="flex-1 text-[12.5px] leading-snug font-black text-gold tabular-nums">
            {remaining.length <= 2
              ? `Almost — ${remaining.length} ${remaining.length === 1 ? "tap" : "taps"} from a perfect day, worth ${money(openValue, cur)}.`
              : `${remaining.length} left today = ${money(openValue, cur)}. Chip away.`}
          </span>
        </div>
      ) : (
        <div className="card flex items-center gap-2.5 border-grass/40 bg-grass/10 px-3.5 py-2.5">
          <span className="text-[16px]" aria-hidden>
            🏆
          </span>
          <span className="flex-1 text-[12.5px] leading-snug font-black text-grass">
            Perfect day banked. The streak lives another night.
          </span>
        </div>
      )}

      {totals.yesterdayLost > 0 && (
        <a
          href="/journey"
          className="card flex items-center gap-3 border-flame/35 bg-flame/8 px-4 py-2.5"
        >
          <span className="text-[14px] font-black text-flame tabular-nums">
            −{money(totals.yesterdayLost * totals.perPoint, cur)}
          </span>
          <span className="flex-1 text-[12px] leading-snug font-bold text-muted">
            left on the table yesterday. Still editable until tonight.
          </span>
          <span className="text-faint">›</span>
        </a>
      )}

      <CoachBubble mood={s.mascot.mood} text={s.mascot.text} coach={s.coach} size={64} />

      <section id="sec-habits" className="space-y-2.5 scroll-mt-28">
        {remaining.length > 0 && (
          <>
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
                Still to do
              </h2>
              <span className="text-[11px] font-black text-gold tabular-nums">
                {remaining.length} · {money(openValue, cur)}
              </span>
            </div>
            <div className="card divide-y divide-line-soft">
              {remaining.map((p) => (
                <HabitRow
                  key={p.habit.id}
                  p={p}
                  day={s.today}
                  perPoint={totals.perPoint}
                  currency={cur}
                  idealBedtime={config.idealBedtime}
                  idealWakeTime={config.idealWakeTime}
                />
              ))}
            </div>
          </>
        )}

        <DoneStack
          items={done}
          day={s.today}
          perPoint={totals.perPoint}
          currency={cur}
          idealBedtime={config.idealBedtime}
          idealWakeTime={config.idealWakeTime}
        />
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

      <QuickLogBar items={remaining} day={s.today} />
    </div>
  );
}

/** One day of the rolling week strip: weekday letter over a status dot. */
function WeekDot({ day, score, today }: { day: string; score?: DayScore; today: string }) {
  const [y, m, d] = day.split("-").map(Number);
  const letter = "SMTWTFS"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const isToday = day === today;

  const dot = !score
    ? "bg-surface-2"
    : score.status === "perfect" || score.status === "strong" || score.status === "kept"
      ? "bg-grass"
      : score.status === "frozen"
        ? "bg-aqua"
        : score.status === "partial"
          ? "bg-gold"
          : score.status === "missed"
            ? "bg-flame/70"
            : "bg-surface-2";

  return (
    <span className="flex flex-1 flex-col items-center gap-1.5">
      <span
        className={`text-[9px] font-black tracking-wide uppercase ${isToday ? "text-text" : "text-faint"}`}
      >
        {letter}
      </span>
      <span
        className={`h-[18px] w-[18px] rounded-full ${
          isToday ? `ring-2 ring-gold ring-offset-2 ring-offset-surface ${dot}` : dot
        }`}
      />
    </span>
  );
}
