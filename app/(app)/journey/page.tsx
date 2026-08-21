import { addDays, prettyDay } from "@/lib/dates";
import { loadState } from "@/lib/state";
import { HabitCard } from "@/components/HabitCard";
import { PathMap, type Node } from "@/components/PathMap";
import { FreezeButton } from "@/components/FreezeButton";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Character } from "@/components/character";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const s = await loadState();
  const yesterday = addDays(s.today, -1);
  const yScore = s.days.find((d) => d.day === yesterday);
  const canRepair = yScore && yScore.status !== "future" && yScore.pct < 100;
  const freezesLeft = s.config.freezesTotal - s.config.freezeDays.length;

  const nodes: Node[] = s.days.map((d) => ({
    day: d.day,
    index: d.index,
    pct: d.pct,
    points: d.points,
    status: d.status,
    missed: d.perHabit
      .filter((p) => !p.done)
      .map((p) => ({ icon: p.habit.icon, emoji: p.habit.emoji, name: p.habit.name })),
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 px-1">
        <span className="shrink-0 animate-float">
          <Character role="reward" mood="happy" size={68} />
        </span>
        <div>
        <h1 className="text-2xl font-black text-text">The {s.config.totalDays}</h1>
        <p className="mt-1 text-[13px] font-bold text-muted">
          {s.totals.perfectDays} perfect · {s.totals.keptDays} kept · {s.totals.missedDays} missed
        </p>
        </div>
      </header>

      {canRepair && (
        <section className="card border-flame/45 bg-flame/8 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.16em] text-flame uppercase">
                Yesterday · {prettyDay(yesterday)}
              </p>
              <h2 className="mt-1 text-lg font-black text-text">
                {Math.round(yScore.points)}/100 — still fixable
              </h2>
              <p className="mt-1 text-[12.5px] font-semibold text-muted">
                Yesterday is the only day you can still edit. After tonight it locks.
              </p>
            </div>
            {freezesLeft > 0 && yScore.pct < 70 && (
              <FreezeButton day={yesterday} left={freezesLeft} />
            )}
          </div>

          <div className="mt-4 space-y-3">
            {yScore.perHabit
              .filter((p) => !p.done)
              .map((p) => (
                <HabitCard
                  key={p.habit.id}
                  p={p}
                  day={yesterday}
                  perPoint={s.totals.perPoint}
                  currency={s.config.currency}
                  idealBedtime={s.config.idealBedtime}
                  idealWakeTime={s.config.idealWakeTime}
                />
              ))}
          </div>
        </section>
      )}

      <section className="card px-2 py-4">
        <PathMap nodes={nodes} today={s.today} />
      </section>

      <PhotoGallery />
    </div>
  );
}
