import { chatConfigured } from "@/lib/coach";
import { db } from "@/lib/db";
import { loadState } from "@/lib/state";
import { ChatRoom } from "@/components/ChatRoom";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const s = await loadState();
  const { chat } = await db().read();

  if (!chatConfigured()) {
    return (
      <div className="card p-5 text-center">
        <h1 className="text-lg font-black text-text">Nimbus can&apos;t talk yet</h1>
        <p className="mt-2 text-[13px] leading-relaxed font-semibold text-muted">
          Add a provider key (Mistral is the most generous) to <code>.env.local</code> and restart.
        </p>
      </div>
    );
  }

  return (
    <ChatRoom
      initial={chat}
      heroName={s.config.heroName}
      sponsorName={s.config.sponsorName}
    />
  );
}
