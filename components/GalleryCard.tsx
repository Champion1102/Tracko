import Link from "next/link";
import { Icon } from "@/components/Icon";

/**
 * The gallery used to live at the bottom of Journey, below the path map, where
 * nobody scrolled to it. It's a destination now — this is the door.
 */
export function GalleryCard({ count }: { count: number }) {
  return (
    <Link
      href="/gallery"
      className="press card flex items-center gap-3 p-4"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-gold">
        <Icon.photos size={21} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-black text-text">Gallery</span>
        <span className="block text-[12.5px] font-semibold text-muted">
          {count
            ? `${count} photo${count === 1 ? "" : "s"} so far`
            : "Your photos will collect here"}
        </span>
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-faint"
        aria-hidden
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
