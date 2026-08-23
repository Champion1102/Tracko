import { db } from "@/lib/db";
import { loadState } from "@/lib/state";
import { ChatThread, type NudgeWithUrl } from "@/components/ChatThread";

export const dynamic = "force-dynamic";

/** The thread with her, full height — the same one she sees at /messages. */
export default async function SponsorChatPage() {
  const s = await loadState();
  const store = db();

  const nudges: NudgeWithUrl[] = await Promise.all(
    s.nudges.map(async (n) => ({
      ...n,
      imageUrl: n.image ? await store.mediaUrl(n.image) : null,
    })),
  );

  return (
    <div className="card h-[calc(100dvh-15.5rem)] min-h-[380px] overflow-hidden">
      <ChatThread
        nudges={nudges}
        unread={s.unreadForSponsor.length}
        me="sponsor"
        otherName={s.config.heroName || "Her"}
      />
    </div>
  );
}
