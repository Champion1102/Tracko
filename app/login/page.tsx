import { LoginForm } from "@/components/LoginForm";
import { Character } from "@/components/character";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="safe-top safe-bottom grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-xs text-center">
        <div className="mb-2 grid place-items-center">
          <div className="animate-float">
            <Character mood="hype" size={132} />
          </div>
        </div>
        <h1 className="text-3xl font-black text-text">Tracko</h1>
        <p className="mt-1.5 mb-8 text-[13.5px] font-bold text-muted">
          Ten habits. Ninety days. One Dyson.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
