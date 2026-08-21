"use client";

import { useEffect, useState, useTransition } from "react";
import { updateReminders } from "@/app/actions";
import { isMuted, setMuted, sfx } from "@/lib/sfx";
import { isSpeechOn, primeVoices, setSpeechOn, speak, speechError, speechSupported } from "@/lib/speech";
import type { Config } from "@/lib/types";
import type { Theme } from "@/lib/theme";
import { CharacterPicker } from "./CharacterPicker";
import { ThemeToggle } from "./ThemeToggle";

export function HerSettings({ config, theme }: { config: Config; theme: Theme }) {
  const [morning, setMorning] = useState(config.reminderMorning);
  const [evening, setEvening] = useState(config.reminderEvening);
  const [on, setOn] = useState(config.remindersOn);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const [mute, setMute] = useState(false);
  const [voice, setVoice] = useState(false);
  const [canSpeak, setCanSpeak] = useState(true);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMute(isMuted());
    setVoice(isSpeechOn());
    setCanSpeak(speechSupported());
    primeVoices();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const dirty =
    morning !== config.reminderMorning ||
    evening !== config.reminderEvening ||
    on !== config.remindersOn;

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Reminders</h2>
        <Toggle label="Send me daily reminders" on={on} onChange={setOn} />
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1.5 block text-[11.5px] font-bold text-muted">Morning nudge</span>
            <input type="time" className={input} value={morning} onChange={(e) => setMorning(e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-[11.5px] font-bold text-muted">Evening check-in</span>
            <input type="time" className={input} value={evening} onChange={(e) => setEvening(e.target.value)} />
          </label>
        </div>
        <button
          onClick={() => {
            sfx.done();
            setSaved(false);
            start(async () => {
              await updateReminders({ reminderMorning: morning, reminderEvening: evening, remindersOn: on });
              setSaved(true);
            });
          }}
          disabled={!dirty || pending}
          className="press w-full rounded-xl border-grass-deep bg-grass py-3 text-[12.5px] font-black tracking-wide text-ink uppercase disabled:border-line disabled:bg-surface-2 disabled:text-faint"
        >
          {pending ? "Saving…" : saved && !dirty ? "Saved ✓" : "Save reminder times"}
        </button>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Look</h2>
        <ThemeToggle current={theme} />
      </section>

      <CharacterPicker />

      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Sound</h2>
        <Toggle
          label="Celebration sounds"
          on={!mute}
          onChange={(v) => {
            setMute(!v);
            setMuted(!v);
            if (v) sfx.done();
          }}
        />
        <Toggle
          label="Nimbus talks out loud"
          on={voice}
          onChange={(v) => {
            setVoice(v);
            setSpeechOn(v);
            if (v) speak("Nice one. This is how I will sound.", { force: true });
          }}
        />
        <p className="-mt-1 text-[11.5px] leading-snug font-semibold text-muted">
          Reads the speech bubble aloud each time you finish a habit. Uses your device&apos;s own
          voice — nothing to download.
        </p>
        {!canSpeak && (
          <p className="text-[11.5px] font-bold text-flame">
            This browser has no speech engine. Safari and Chrome both do.
          </p>
        )}
        <button
          onClick={() => {
            const started = speak("Four habits left. You are closer than you think.", { force: true });
            setVoiceNote(started ? null : (speechError() ?? "Your browser blocked it."));
            // Errors surface asynchronously, so check again once it should be talking.
            setTimeout(() => setVoiceNote(speechError()), 1200);
          }}
          className="press w-full rounded-xl border-line bg-surface-2 py-2.5 text-[12px] font-black tracking-wide text-text uppercase"
        >
          Hear it
        </button>
        {voiceNote && <p className="text-[11.5px] font-bold text-flame">{voiceNote}</p>}
      </section>
    </div>
  );
}

const input =
  "w-full rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-[14px] font-bold text-text outline-none focus:border-aqua";

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-3 py-1">
      <span className="text-left text-[14px] font-bold text-text">{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-grass" : "bg-surface-2"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}
