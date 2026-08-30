import { loadState } from "@/lib/state";
import { GalleryGrid } from "@/components/GalleryGrid";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const s = await loadState();
  const count = s.photos.length;
  const habits = Object.fromEntries(
    s.allHabits.map((h) => [h.id, { icon: h.icon ?? null, emoji: h.emoji, name: h.name }]),
  );

  return (
    <div className="space-y-5">
      <header className="px-1 pt-1">
        <h1 className="text-[26px] leading-none font-black text-text">Gallery</h1>
        <p className="mt-1.5 text-[13px] font-bold text-muted">
          {count
            ? `${count} photo${count === 1 ? "" : "s"} so far.`
            : "Photos you add from a habit land here."}
        </p>
      </header>

      <GalleryGrid habits={habits} />
    </div>
  );
}
