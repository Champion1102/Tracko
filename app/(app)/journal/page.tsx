import { dayMonth, weekdayName } from "@/lib/dates";
import { loadState } from "@/lib/state";
import { JournalEditor, JournalList } from "@/components/Journal";

export const dynamic = "force-dynamic";

/** Her diary. Autosaves as she types; hers alone. */
export default async function JournalPage() {
  const s = await loadState();
  const todays = s.journal.find((j) => j.day === s.today) ?? null;
  const past = s.journal
    .filter((j) => j.day !== s.today)
    .sort((a, b) => b.day.localeCompare(a.day));

  return (
    <div className="space-y-5">
      <header className="px-1 pt-1">
        <h1 className="text-[26px] leading-none font-black text-text">Journal</h1>
        <p className="mt-1.5 text-[13px] font-bold text-muted">
          {weekdayName(s.today)}, {dayMonth(s.today)} · just for you
        </p>
      </header>

      <JournalEditor key={s.today} day={s.today} initial={todays} />

      {past.length === 0 && !todays && (
        <p className="px-1 text-[12.5px] leading-relaxed font-semibold text-faint">
          A line or two is plenty. Nobody else can read this — not even{" "}
          {s.config.sponsorName || "the person who set this up"}.
        </p>
      )}

      <JournalList entries={past} />
    </div>
  );
}
