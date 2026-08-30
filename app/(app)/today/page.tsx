import { addDays, dayMonth, isBirthday, weekdayName } from "@/lib/dates";
import { db } from "@/lib/db";
import { loadState } from "@/lib/state";
import { BirthdayBanner } from "@/components/BirthdayBanner";
import { DayRing } from "@/components/DayRing";
import { TickRow, type RowPhoto } from "@/components/TickRow";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const s = await loadState();
  const { todayScore, config } = s;
  const birthday = isBirthday(s.today, config.heroBirthday);
  const allDone = todayScore.total > 0 && todayScore.done === todayScore.total;

  // Signed URLs for today's habit photos, resolved on the server so every row
  // paints complete on first load.
  const store = db();
  const photosByHabit = new Map<string, RowPhoto[]>();
  await Promise.all(
    s.photos
      .filter((p) => p.day === s.today && p.habitId)
      .map(async (p) => {
        const url = await store.photoUrl(p);
        if (!url) return;
        const list = photosByHabit.get(p.habitId!) ?? [];
        list.push({ id: p.id, url });
        photosByHabit.set(p.habitId!, list);
      }),
  );

  // Rolling week ending today, for the glanceable strip.
  const byDay = new Map(s.days.map((d) => [d.day, d]));
  const strip = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(s.today, i - 6);
    return { day, score: byDay.get(day) };
  });

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between px-1 pt-1">
        <div>
          <h1 className="text-[26px] leading-none font-black text-text">{weekdayName(s.today)}</h1>
          <p className="mt-1.5 text-[13px] font-bold text-muted">
            {dayMonth(s.today)} · Day {todayScore.index} of {config.totalDays}
          </p>
        </div>
        <DayRing pct={todayScore.pct} status={todayScore.status} size={48} stroke={4}>
          <span
            className={`text-[11.5px] font-black tabular-nums ${allDone ? "text-white" : "text-text"}`}
          >
            {todayScore.done}/{todayScore.total}
          </span>
        </DayRing>
      </header>

      <section className="flex justify-between px-1" aria-label="The last seven days">
        {strip.map(({ day, score }) => (
          <span key={day} className="flex flex-col items-center gap-1.5">
            <span
              className={`text-[10px] font-bold ${day === s.today ? "text-text" : "text-faint"}`}
            >
              {weekdayName(day).slice(0, 1)}
            </span>
            <DayRing
              pct={score?.pct ?? 0}
              status={score?.status ?? "future"}
              size={30}
              stroke={3}
              today={day === s.today}
            />
          </span>
        ))}
      </section>

      {birthday && <BirthdayBanner name={config.heroName} />}

      <section className="card divide-y divide-line-soft">
        {todayScore.perHabit.map((p) => (
          <TickRow key={p.habit.id} p={p} day={s.today} photos={photosByHabit.get(p.habit.id)} />
        ))}
      </section>

      {allDone && (
        <p className="pb-2 text-center text-[13px] font-bold text-muted">
          That&apos;s everything. Go rest. ✨
        </p>
      )}
    </div>
  );
}
