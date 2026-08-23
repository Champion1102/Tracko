import { db } from "@/lib/db";
import { loadState } from "@/lib/state";
import { ChatThread, type NudgeWithUrl } from "@/components/ChatThread";

export const dynamic = "force-dynamic";

/** The thread with the sponsor, moved off Today so logging stays the only
 *  thing on that screen. Reached from the drawer and the unread badge. */
export default async function MessagesPage() {
  const s = await loadState();
  const store = db();

  // Signed URLs for any photo messages, resolved together.
  const nudges: NudgeWithUrl[] = await Promise.all(
    s.nudges.map(async (n) => ({
      ...n,
      imageUrl: n.image ? await store.mediaUrl(n.image) : null,
    })),
  );

  return (
    <div className="card h-[calc(100dvh-10.5rem)] overflow-hidden">
      <ChatThread
        nudges={nudges}
        unread={s.unreadForHero.length}
        me="hero"
        otherName={s.config.sponsorName}
      />
    </div>
  );
}
