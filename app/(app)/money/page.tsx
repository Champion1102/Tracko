import { db } from "@/lib/db";
import { loadState } from "@/lib/state";
import { MoneyTracker } from "@/components/MoneyTracker";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const s = await loadState();
  const { expenses } = await db().read();

  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-black text-text">Money</h1>
        <p className="mt-1 text-[13px] font-bold text-muted">
          Where it goes, and whether it was worth it. Only you can see this.
        </p>
      </header>

      <MoneyTracker initial={expenses} currency={s.config.currency} today={s.today} />
    </div>
  );
}
