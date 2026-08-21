import { redirect } from "next/navigation";
import { currentRole, needsPinSetup } from "@/lib/auth";
import { db } from "@/lib/db";
import { Character } from "@/components/character";
import { SetPinForm } from "@/components/SetPinForm";

export const dynamic = "force-dynamic";

export default async function SetPinPage() {
  const role = await currentRole();
  if (!role) redirect("/login");

  const { config } = await db().read();
  const first = needsPinSetup(config, role);

  return (
    <div className="safe-top safe-bottom grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-xs text-center">
        <div className="mb-2 grid place-items-center">
          <div className="animate-float">
            <Character mood="happy" size={120} />
          </div>
        </div>
        <h1 className="text-2xl font-black text-text">
          {first ? "Pick your PIN" : "Change your PIN"}
        </h1>
        <p className="mt-1.5 mb-7 text-[13px] leading-snug font-bold text-muted">
          {first
            ? "Six to eight digits, just for you. This replaces the one you were given — only you'll know it."
            : "Six to eight digits. You'll use the new one next time you sign in."}
        </p>
        <SetPinForm mode={first ? "first" : "change"} />
      </div>
    </div>
  );
}
