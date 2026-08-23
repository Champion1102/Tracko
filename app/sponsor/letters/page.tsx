import { loadState } from "@/lib/state";
import { LetterEditor } from "@/components/LetterEditor";

export const dynamic = "force-dynamic";

export default async function SponsorLettersPage() {
  const s = await loadState();

  return (
    <div className="space-y-2.5">
      <h2 className="px-1 text-[11px] font-black tracking-[0.16em] text-faint uppercase">
        Sealed letters
      </h2>
      <p className="px-1 text-[12.5px] leading-snug font-semibold text-muted">
        Write these now. She can&apos;t see them until she reaches the day, and once she opens one
        it locks.
      </p>
      {s.letters.map((l) => (
        <LetterEditor key={l.id} letter={l} daysElapsed={s.totals.daysElapsed} />
      ))}
    </div>
  );
}
