"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { completeOnboarding } from "@/app/actions";
import { Character } from "@/components/character";
import { HabitIcon } from "@/components/HabitIcon";
import { PushSetup } from "@/components/PushSetup";
import { RewardImage } from "@/components/RewardImage";
import { money } from "@/lib/money";
import { sfx } from "@/lib/sfx";
import type { Habit } from "@/lib/types";
import { HoldToSeal } from "./HoldToSeal";
import { SignaturePad } from "./SignaturePad";

export type WelcomeProps = {
  sponsorName: string;
  rewardName: string;
  rewardPrice: number;
  rewardImage: string;
  currency: string;
  totalDays: number;
  promiseText: string;
  perPoint: number;
  habits: Pick<Habit, "id" | "name" | "emoji" | "icon" | "points" | "cadence">[];
  vapidKey: string;
};

const STEPS = ["hello", "name", "birthday", "deal", "habits", "promise", "notify", "go"] as const;
type Step = (typeof STEPS)[number];

export function Welcome(props: WelcomeProps) {
  const [step, setStep] = useState<Step>("hello");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [signature, setSignature] = useState("");
  const [sealed, setSealed] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const index = STEPS.indexOf(step);
  const go = (next: Step) => {
    sfx.tick();
    setStep(next);
  };

  function finish() {
    confetti({
      particleCount: 140,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#F3CB84", "#63D471", "#F2809E", "#AE8DE4"],
      disableForReducedMotion: true,
    });
    start(async () => {
      await completeOnboarding({ name, birthday, signature });
      router.replace("/today");
    });
  }

  return (
    <div className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-md flex-col px-6 py-6">
      {/* progress */}
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i <= index ? "bg-gold" : "bg-surface-2"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-1 flex-col"
        >
          {step === "hello" && (
            <Panel
              mood="hype"
              eyebrow="Hello"
              title="I'm Nimbus."
              body={`${props.sponsorName || "Someone"} built this for you and asked me to look after it. It'll take a minute to set up, and then we start.`}
              cta="Alright"
              onNext={() => go("name")}
            />
          )}

          {step === "name" && (
            <Panel
              mood="happy"
              eyebrow="First things first"
              title="What should I call you?"
              body="I'll use it sparingly. Nobody likes an app that says your name every five seconds."
              cta="That's me"
              ctaDisabled={!name.trim()}
              onNext={() => go("birthday")}
            >
              <input
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && go("birthday")}
                placeholder="Your name"
                className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-4 text-center text-xl font-black text-text outline-none focus:border-gold"
              />
            </Panel>
          )}

          {step === "birthday" && (
            <Panel
              mood="cheeky"
              eyebrow={name ? `Alright, ${name}` : "Alright"}
              title="When's your birthday?"
              body="Only so I know which day to stop nagging you and throw confetti instead."
              cta={birthday ? "Noted" : "Skip this"}
              onNext={() => go("deal")}
            >
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-4 text-center text-lg font-black text-text outline-none focus:border-gold"
              />
            </Panel>
          )}

          {step === "deal" && (
            <div className="flex flex-1 flex-col">
              <Eyebrow>What you&apos;re playing for</Eyebrow>

              {/* The photo leads. Showing it at 4% during onboarding shows her
                  nothing — the animation demonstrates the mechanic and then
                  leaves the actual prize on screen. */}
              <div className="mt-3 grid place-items-center">
                {props.rewardImage ? (
                  <RewardImage
                    src={props.rewardImage}
                    alt={props.rewardName}
                    rewardPct={100}
                    size={250}
                    animate
                  />
                ) : (
                  <Character role="reward" mood="proud" size={150} />
                )}
              </div>

              <h1 className="mt-3 text-center text-[26px] leading-tight font-black text-text">
                {props.rewardName}
              </h1>
              <p className="mt-1 text-center text-[15px] font-black text-gold tabular-nums">
                {money(props.rewardPrice, props.currency)}
              </p>

              <div className="mt-5 space-y-2.5">
                <Fact
                  k={`${props.totalDays} days`}
                  v="from the day you start. That's the whole deal."
                />
                <Fact
                  k={money(props.perPoint * 100, props.currency)}
                  v="is what a full day is worth. Every habit you tick uncovers a piece of that picture."
                />
                <Fact
                  k="Mostly, not perfectly"
                  v="— miss a day and you slow down. You don't lose."
                />
              </div>

              <Next onClick={() => go("habits")}>Show me the habits</Next>
            </div>
          )}

          {step === "habits" && (
            <div className="flex flex-1 flex-col">
              <Eyebrow>Every day</Eyebrow>
              <h1 className="mt-1 mb-4 text-3xl leading-tight font-black text-text">
                These are yours.
              </h1>

              <ul className="flex-1 space-y-2 overflow-y-auto">
                {props.habits.map((h, i) => (
                  <motion.li
                    key={h.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055 }}
                    className="card flex items-center gap-3 p-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                      <HabitIcon icon={h.icon} emoji={h.emoji} size={18} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-black text-text">
                      {h.name}
                    </span>
                    <span className="shrink-0 text-[12.5px] font-black text-gold tabular-nums">
                      {money(h.points * props.perPoint, props.currency)}
                      {h.cadence === "weekly" ? " ea" : ""}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <p className="mt-3 text-[12.5px] leading-snug font-semibold text-faint">
                Want one changed or dropped? Ask {props.sponsorName || "whoever set this up"} —
                they hold the rules so the finish line can&apos;t move.
              </p>
              <Next onClick={() => go("promise")}>I&apos;m in</Next>
            </div>
          )}

          {step === "promise" && (
            <div className="flex flex-1 flex-col">
              <Eyebrow>One last thing</Eyebrow>
              <h1 className="mt-1 text-3xl leading-tight font-black text-text">The promise.</h1>
              <p className="mt-1.5 mb-4 text-[13px] font-bold text-muted">
                Read it properly. Then sign it — this stays in the app for all{" "}
                {props.totalDays} days.
              </p>

              <div className="card mb-4 p-4">
                <p className="text-[14px] leading-relaxed font-bold whitespace-pre-line text-text">
                  {props.promiseText}
                </p>
              </div>

              <SignaturePad onChange={setSignature} />

              <div className="mt-4">
                <HoldToSeal
                  label={sealed ? "Sealed ✓" : "Hold to seal it"}
                  disabled={!signature || sealed}
                  onDone={() => setSealed(true)}
                />
                {!signature && (
                  <p className="mt-2 text-center text-[11.5px] font-bold text-faint">
                    Sign above first.
                  </p>
                )}
              </div>

              {sealed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Next onClick={() => go("notify")}>Done</Next>
                </motion.div>
              )}
            </div>
          )}

          {step === "notify" && (
            <div className="flex flex-1 flex-col">
              <Eyebrow>So I can reach you</Eyebrow>
              <h1 className="mt-1 mb-2 text-3xl leading-tight font-black text-text">
                Two nudges a day.
              </h1>
              <p className="mb-4 text-[13.5px] leading-relaxed font-bold text-muted">
                One in the morning, one in the evening if anything&apos;s still open. Plus whenever{" "}
                {props.sponsorName || "your friend"} sends you something. Never more than that.
              </p>

              <PushSetup vapidKey={props.vapidKey} />

              <Next onClick={() => go("go")}>Continue</Next>
              <button
                onClick={() => go("go")}
                className="w-full py-3 text-[11.5px] font-black tracking-wide text-faint uppercase"
              >
                I&apos;ll do this later
              </button>
            </div>
          )}

          {step === "go" && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="animate-float">
                <Character mood="hype" size={150} event="celebrate" />
              </div>
              <p className="mt-6 text-[10px] font-black tracking-[0.24em] text-gold uppercase">
                Day 1 of {props.totalDays}
              </p>
              <h1 className="mt-2 text-3xl leading-tight font-black text-text">
                {name ? `Right then, ${name}.` : "Right then."}
              </h1>
              <p className="mt-3 max-w-[30ch] text-[14px] leading-relaxed font-bold text-muted">
                Nothing to catch up on, nothing to fix. Just today. I&apos;ll be here.
              </p>

              <button
                onClick={finish}
                disabled={pending}
                className="press mt-8 w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase disabled:opacity-60"
              >
                {pending ? "One second…" : "Start"}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-[14px] leading-relaxed font-bold text-muted">
      <span className="text-text">{k}</span> {v}
    </p>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black tracking-[0.24em] text-gold uppercase">{children}</p>
  );
}

function Next({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="press mt-6 w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase"
    >
      {children}
    </button>
  );
}

function Panel({
  mood,
  eyebrow,
  title,
  body,
  cta,
  ctaDisabled,
  onNext,
  children,
}: {
  mood: "happy" | "hype" | "cheeky";
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  ctaDisabled?: boolean;
  onNext: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-4 animate-float">
          <Character mood={mood} size={128} />
        </div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-1 text-3xl leading-tight font-black text-text">{title}</h1>
        <p className="mt-3 text-[14px] leading-relaxed font-bold text-muted">{body}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
      <button
        onClick={onNext}
        disabled={ctaDisabled}
        className="press mt-6 w-full rounded-2xl border-grass-deep bg-grass py-4 text-[13px] font-black tracking-wide text-ink uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
      >
        {cta}
      </button>
    </div>
  );
}
