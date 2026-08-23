import { cookies } from "next/headers";
import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { coachConfigured, coachProviderNames } from "@/lib/coach";
import { usingSupabase } from "@/lib/db";
import { loadState } from "@/lib/state";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CoachTester } from "@/components/CoachTester";
import { DealSettings } from "@/components/DealSettings";
import { HabitEditor } from "@/components/HabitEditor";
import { PromiseEditor } from "@/components/PromiseEditor";
import { PushSetup } from "@/components/PushSetup";

export const dynamic = "force-dynamic";

export default async function SponsorSetupPage() {
  const s = await loadState();
  const { config } = s;
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <div className="space-y-6">
      <div className="px-1">
        <h2 className="text-lg font-black text-text">Setup</h2>
        <p className="mt-1 text-[12.5px] font-semibold text-muted">
          Only you can see or change any of this. Her side has reminders and sound, nothing else.
        </p>
      </div>

      <PromiseEditor
        text={config.promiseText}
        signature={config.promiseSignature}
        signedAt={config.promiseAcceptedAt}
        heroName={config.heroName}
      />

      <DealSettings config={config} maxPoints={s.totals.max} />
      <HabitEditor habits={s.allHabits} />

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">
          Under the hood
        </h2>
        <Row
          label="Storage"
          value={usingSupabase() ? "Supabase" : "Local file"}
          note={
            usingSupabase()
              ? "Safe across devices and reinstalls."
              : "Development only. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to sync."
          }
          ok={usingSupabase()}
        />
        <Row
          label="Nimbus's writing"
          value={coachConfigured() ? (s.coach?.provider ?? "Ready") : "Built-in lines"}
          note={
            coachConfigured()
              ? `${coachProviderNames().join(" → ")}, tried in order. Written once a day${s.coach ? "" : " — first batch lands on the next 5am run"}.`
              : "Add GROQ_API_KEY to have the lines written fresh each morning."
          }
          ok={coachConfigured()}
        />
        <CoachTester enabled={coachConfigured()} />
      </section>

      <PushSetup vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Look</h2>
        <ThemeToggle current={theme} />
      </section>

      <section className="card space-y-1 p-2">
        <Link
          href="/set-pin"
          className="flex items-center justify-between gap-3 rounded-xl px-3 py-3"
        >
          <span>
            <span className="block text-[14px] font-bold text-text">Change your PIN</span>
            <span className="block text-[11.5px] font-semibold text-faint">
              Six to eight digits, only you know it
            </span>
          </span>
          <span className="text-faint">›</span>
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left">
            <span>
              <span className="block text-[14px] font-bold text-flame">Sign out</span>
              <span className="block text-[11.5px] font-semibold text-faint">
                On this device
              </span>
            </span>
            <span className="text-faint">›</span>
          </button>
        </form>
      </section>
    </div>
  );
}

function Row({ label, value, note, ok }: { label: string; value: string; note: string; ok: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-text">{label}</span>
        <span className={`text-[12px] font-black ${ok ? "text-grass" : "text-faint"}`}>{value}</span>
      </div>
      <p className="mt-0.5 text-[11.5px] leading-snug font-semibold text-muted">{note}</p>
    </div>
  );
}
