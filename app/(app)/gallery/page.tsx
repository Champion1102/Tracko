import Link from "next/link";
import { loadState } from "@/lib/state";
import { GalleryGrid } from "@/components/GalleryGrid";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const s = await loadState();
  const count = s.photos.length;

  return (
    <div className="space-y-5">
      <header className="px-1">
        <Link
          href="/journey"
          className="text-[11px] font-black tracking-[0.16em] text-faint uppercase"
        >
          ‹ Journey
        </Link>
        <h1 className="mt-1 text-2xl font-black text-text">Gallery</h1>
        <p className="mt-1 text-[13px] font-bold text-muted">
          {count
            ? `${count} photo${count === 1 ? "" : "s"} from the ${s.config.totalDays}.`
            : "Every photo you add on Today lands here."}
        </p>
      </header>

      <GalleryGrid />
    </div>
  );
}
