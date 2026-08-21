import { notFound } from "next/navigation";
import { SvgCharacter } from "@/components/character/SvgCharacter";
import { DRAWN, DRAWN_IDS } from "@/components/character/faces";
import type { Mood } from "@/lib/mascot";

export const dynamic = "force-dynamic";

const MOODS: Mood[] = ["happy", "hype", "proud", "worried", "sleepy", "cheeky"];

/** Contact sheet for iterating on the drawn cast. Development only. */
export default function FacesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      {DRAWN_IDS.map((id) => (
        <section key={id}>
          <h2 className="mb-2 text-lg font-black text-text">
            {DRAWN[id].name} — <span className="text-[13px] font-bold text-muted">{DRAWN[id].blurb}</span>
          </h2>
          <div className="flex flex-wrap gap-4">
            {MOODS.map((mood) => (
              <div key={mood} className="text-center">
                <div className="grid h-[120px] w-[140px] place-items-center rounded-2xl bg-surface">
                  <SvgCharacter face={id} mood={mood} size={130} />
                </div>
                <p className="mt-1 text-[10px] font-black text-faint uppercase">{mood}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
