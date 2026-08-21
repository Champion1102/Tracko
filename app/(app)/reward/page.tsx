import { loadState } from "@/lib/state";
import { money } from "@/lib/money";
import { DysonBuild } from "@/components/DysonBuild";
import { LetterCard } from "@/components/LetterCard";
import { Character } from "@/components/character";
import { RewardImage } from "@/components/RewardImage";

export const dynamic = "force-dynamic";

export default async function RewardPage() {
  const s = await loadState();
  const { totals, config, parts, nextPart } = s;
  const cur = config.currency;

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-b from-gold/10 to-transparent px-4 pt-5 pb-1 text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-gold uppercase">The prize</p>
          <h1 className="mt-1 text-2xl font-black text-text">{config.rewardName}</h1>
          <p className="mt-0.5 text-[13px] font-bold text-faint tabular-nums">
            {money(config.rewardPrice, cur)}
          </p>
        </div>

        <div className="grid place-items-center px-4 py-2">
          {config.rewardImage ? (
            <RewardImage
              src={config.rewardImage}
              alt={config.rewardName}
              rewardPct={totals.rewardPct}
              size={290}
            />
          ) : (
            <DysonBuild rewardPct={totals.rewardPct} size={290} />
          )}
        </div>

        <div className="px-5 pt-3 pb-5">
          <p className="text-[10px] font-black tracking-[0.16em] text-faint uppercase">
            Earned so far
          </p>
          <div className="mt-0.5 mb-2.5 flex items-baseline gap-2">
            <span className="text-[40px] leading-none font-black text-gold tabular-nums">
              {money(totals.earnedValue, cur)}
            </span>
            <span className="text-[13px] font-bold text-faint tabular-nums">
              of {money(config.rewardPrice, cur)}
            </span>
          </div>

          <div className="h-4 overflow-hidden rounded-full border border-line bg-ink-2">
            <div
              className="shimmer h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-[width] duration-700"
              style={{ width: `${Math.max(totals.rewardPct, 1.5)}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <p className="text-[12.5px] font-bold text-muted">
              {totals.unlocked
                ? "Unlocked. Go and collect it."
                : `${money(config.rewardPrice - totals.earnedValue, cur)} still to earn.`}
            </p>
            <p className="text-[12.5px] font-black text-gold tabular-nums">
              {totals.rewardPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>

      <section className="card flex items-center gap-3 border-gold/30 bg-gold/6 p-4">
        <span className="shrink-0 animate-float">
          <Character
            role="reward"
            mood={totals.onTrack ? "proud" : "worried"}
            size={72}
          />
        </span>
        <p className="text-[12.5px] leading-relaxed font-bold text-text">
          Every point you tick is worth{" "}
          <span className="text-gold tabular-nums">{money(totals.perPoint, cur)}</span>. A perfect
          day is <span className="text-gold tabular-nums">{money(totals.perPoint * 100, cur)}</span>{" "}
          straight into the {config.rewardName}.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <Tile label="Today" value={money(totals.todayValue, cur)} tone="text-grass" />
        <Tile label="Days left" value={String(totals.daysLeft)} tone="text-aqua" />
        <Tile
          label="Needed / day"
          value={money((totals.pointsToGo / Math.max(totals.daysLeft, 1)) * totals.perPoint, cur)}
          tone={totals.onTrack ? "text-grass" : "text-flame"}
        />
      </section>

      <section
        className={`card p-4 ${totals.onTrack ? "border-grass/40 bg-grass/8" : "border-flame/40 bg-flame/8"}`}
      >
        <p
          className={`text-[10px] font-black tracking-[0.16em] uppercase ${totals.onTrack ? "text-grass" : "text-flame"}`}
        >
          {totals.onTrack ? "On track" : "Behind pace"}
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed font-bold text-text">
          {totals.onTrack
            ? `Averaging ${money(totals.actualPace * totals.perPoint, cur)} a day. Keep this exact pace and it's yours with room to spare.`
            : `You're averaging ${money(totals.actualPace * totals.perPoint, cur)} a day and you need ${money(totals.requiredPace * totals.perPoint, cur)}. That's about one extra habit.`}
        </p>
      </section>

      {!config.rewardImage && (
        <section>
          <h2 className="mb-3 px-1 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
            Parts unlocked
          </h2>
          <ul className="card divide-y divide-line-soft">
            {parts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-[13px] ${p.unlocked ? "text-grass" : "text-faint"}`}>
                  {p.unlocked ? "✓" : "○"}
                </span>
                <span
                  className={`flex-1 text-[14px] font-black ${p.unlocked ? "text-text" : "text-faint"}`}
                >
                  {p.label}
                </span>
                <span className="text-[11px] font-black text-faint tabular-nums">
                  {money((p.at / 100) * config.rewardPrice, cur)}
                </span>
              </li>
            ))}
          </ul>
          {nextPart && (
            <p className="mt-2 px-1 text-[12px] font-bold text-muted">
              Next piece at {nextPart.at}% — {nextPart.label}.
            </p>
          )}
        </section>
      )}

      {s.letters.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="px-1 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
            Sealed letters
          </h2>
          {s.letters.map((l) => (
            <LetterCard
              key={l.id}
              letter={l}
              daysElapsed={totals.daysElapsed}
              from={s.config.sponsorName}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card p-3 text-center">
      <div className={`text-[17px] font-black tabular-nums ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[9.5px] leading-tight font-black tracking-wide text-faint uppercase">
        {label}
      </div>
    </div>
  );
}
