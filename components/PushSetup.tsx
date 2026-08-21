"use client";

import { useEffect, useState } from "react";
import { isIOS, isStandalone, urlBase64ToUint8Array } from "@/lib/pwa";
import { sfx } from "@/lib/sfx";

type Step = "checking" | "install" | "ready" | "granted" | "denied" | "unsupported";

/** Chrome fires this when the app is installable; Safari never does. */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };

export function PushSetup({ vapidKey }: { vapidKey: string }) {
  const [step, setStep] = useState<Step>("checking");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallEvent | null>(null);

  // Android and desktop Chrome offer a real one-tap install. Capture the event
  // so we can trigger it from our own button instead of the browser's.
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Feature detection needs the real browser, so it can only run after mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    // iOS refuses push in the browser tab — Home Screen install is mandatory.
    if (isIOS() && !isStandalone()) return setStep("install");
    if (!supported) return setStep("unsupported");
    if (Notification.permission === "granted") return setStep("granted");
    if (Notification.permission === "denied") return setStep("denied");
    setStep("ready");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStep(permission === "denied" ? "denied" : "ready");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save");

      sfx.done();
      setStep("granted");
      setMsg("You're subscribed on this device.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const res = await fetch("/api/push/test", { method: "POST" });
    const json = await res.json();
    setMsg(res.ok ? `Sent to ${json.sent} device(s).` : json.error);
    setBusy(false);
  }

  if (!vapidKey) {
    return (
      <Box tone="line">
        <p className="text-[13px] font-bold text-muted">
          Notifications aren&apos;t configured yet — add your VAPID keys to <code>.env.local</code>{" "}
          and restart.
        </p>
      </Box>
    );
  }

  if (step === "install") {
    return (
      <Box tone="gold">
        <p className="text-[10px] font-black tracking-[0.16em] text-gold uppercase">
          One-time setup
        </p>
        <h3 className="mt-1 text-lg font-black text-text">Add Tracko to your Home Screen</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed font-semibold text-muted">
          iPhone only allows notifications for apps installed to the Home Screen. Takes ten seconds:
        </p>
        <ol className="mt-3 space-y-2">
          {[
            ["1", "Tap the Share button at the bottom of Safari"],
            ["2", "Scroll down and tap “Add to Home Screen”"],
            ["3", "Tap Add, then open Tracko from your Home Screen"],
            ["4", "Come back here and turn notifications on"],
          ].map(([n, text]) => (
            <li key={n} className="flex gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-[11px] font-black text-ink">
                {n}
              </span>
              <span className="text-[13px] leading-snug font-bold text-text">{text}</span>
            </li>
          ))}
        </ol>
      </Box>
    );
  }

  if (step === "denied") {
    return (
      <Box tone="flame">
        <h3 className="text-[15px] font-black text-text">Notifications are blocked</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed font-semibold text-muted">
          Open iPhone Settings → Notifications → Tracko and switch Allow Notifications back on.
        </p>
      </Box>
    );
  }

  if (step === "unsupported") {
    return (
      <Box tone="line">
        <p className="text-[13px] font-bold text-muted">
          This browser doesn&apos;t support push notifications. Try Safari on iOS 16.4 or newer, or
          Chrome on Android.
        </p>
      </Box>
    );
  }

  return (
    <Box tone={step === "granted" ? "grass" : "line"}>
      {installPrompt && !isStandalone() && (
        <div className="mb-3 rounded-xl border border-gold/35 bg-gold/10 p-3">
          <p className="text-[13px] font-black text-text">Install Tracko</p>
          <p className="mt-0.5 text-[12px] leading-snug font-semibold text-muted">
            Puts it on your home screen and keeps it out of a browser tab.
          </p>
          <button
            onClick={async () => {
              await installPrompt.prompt();
              setInstallPrompt(null);
            }}
            className="press mt-2.5 w-full rounded-xl border-gold-deep bg-gold py-2.5 text-[12px] font-black tracking-wide text-ink uppercase"
          >
            Install
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-black text-text">
            {step === "granted" ? "Notifications on ✓" : "Daily reminders"}
          </h3>
          <p className="mt-0.5 text-[12.5px] font-semibold text-muted">
            {step === "granted"
              ? "Morning nudge, evening check-in, Sunday recap."
              : "A morning nudge and an evening check-in. Never more than three a day."}
          </p>
        </div>
        <button
          disabled={busy}
          onClick={step === "granted" ? test : enable}
          className={`press shrink-0 rounded-xl px-4 py-2.5 text-[12px] font-black tracking-wide uppercase ${
            step === "granted"
              ? "border-line bg-surface-2 text-text"
              : "border-grass-deep bg-grass text-ink"
          }`}
        >
          {busy ? "…" : step === "granted" ? "Test" : "Turn on"}
        </button>
      </div>
      {msg && <p className="mt-2.5 text-[12px] font-bold text-aqua">{msg}</p>}
    </Box>
  );
}

const TONES = {
  gold: "border-gold/45 bg-gold/8",
  grass: "border-grass/45 bg-grass/8",
  flame: "border-flame/45 bg-flame/8",
  line: "",
} as const;

function Box({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return <section className={`card p-4 ${TONES[tone]}`}>{children}</section>;
}
