"use client";

import { useEffect, useState } from "react";
import { Character } from "@/components/character";
import { SvgCharacter } from "@/components/character/SvgCharacter";
import { DRAWN, DRAWN_IDS, drawnValue, parseDrawn } from "@/components/character/faces";
import {
  DEFAULT_CAST,
  ROLE_LABELS,
  resetCast,
  setRole,
  useCast,
  type CharacterRole,
} from "@/lib/characterStore";
import { sfx } from "@/lib/sfx";

type Found = { file: string; name: string };

const ROLES = Object.keys(ROLE_LABELS) as CharacterRole[];

export function CharacterPicker() {
  const cast = useCast();
  const [found, setFound] = useState<Found[]>([]);
  const [open, setOpen] = useState<CharacterRole | null>(null);
  const [mounted, setMounted] = useState(false);

  // Both of these are unavoidable post-mount reads: localStorage and the
  // server's file listing simply don't exist during render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
    fetch("/api/characters")
      .then((r) => (r.ok ? r.json() : { characters: [] }))
      .then((d) => setFound(d.characters ?? []))
      .catch(() => {});
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const options: Found[] = [
    ...DRAWN_IDS.map((id) => ({ file: drawnValue(id), name: DRAWN[id].name })),
    ...found,
  ];
  const nameFor = (file: string) =>
    options.find((o) => o.file === file)?.name ?? file.split("/").pop() ?? "—";

  const changed = mounted && JSON.stringify(cast) !== JSON.stringify(DEFAULT_CAST);

  // The saved cast lives in localStorage, so the server can't know it. Render
  // a stable placeholder until mount rather than guess and mismatch.
  if (!mounted) {
    return (
      <section className="card space-y-3 p-4">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Your cast</h2>
        <div className="h-[264px] animate-pulse rounded-2xl bg-surface-2/60" />
      </section>
    );
  }

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-black tracking-[0.16em] text-faint uppercase">Your cast</h2>
        {changed && (
          <button
            onClick={() => {
              sfx.tick();
              resetCast();
            }}
            className="text-[11px] font-black text-faint uppercase"
          >
            Reset
          </button>
        )}
      </div>
      <p className="-mt-1 text-[12px] leading-snug font-semibold text-muted">
        Different characters for different corners of the app. Tap one to swap it.
      </p>

      {ROLES.map((role) => {
        const isOpen = open === role;
        return (
          <div key={role} className="rounded-2xl border border-line-soft bg-surface-2/50">
            <button
              onClick={() => {
                sfx.tick();
                setOpen(isOpen ? null : role);
              }}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink-2">
                <Character role={role} mood="happy" size={52} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-black text-text">
                  {ROLE_LABELS[role].title}
                </span>
                <span className="block truncate text-[11.5px] font-bold text-muted">
                  {nameFor(cast[role])} · {ROLE_LABELS[role].blurb}
                </span>
              </span>
              <span className={`text-faint transition-transform ${isOpen ? "rotate-180" : ""}`}>
                ⌄
              </span>
            </button>

            {isOpen && (
              <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                {options.map((o) => {
                  const active = cast[role] === o.file;
                  return (
                    <button
                      key={o.file || "drawn"}
                      onClick={() => {
                        sfx.done();
                        setRole(role, o.file);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 ${
                        active ? "border-gold/60 bg-gold/12" : "border-line-soft bg-ink-2"
                      }`}
                    >
                      <span className="grid h-11 w-full place-items-center overflow-hidden">
                        <PreviewOf file={o.file} />
                      </span>
                      <span
                        className={`w-full truncate text-center text-[10px] font-black ${
                          active ? "text-gold" : "text-muted"
                        }`}
                      >
                        {o.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[11px] leading-relaxed font-semibold text-faint">
        Nimbus, Sprout, Ember and Luna are drawn for this app. The rest are Rive files by
        AnggaMotion, Patsom, design-QYBVX and hijenks72, used under CC BY — drop any other{" "}
        <code>.riv</code> into <code>public/characters/</code> and it appears here too.
      </p>
    </section>
  );
}

/** Previews mount the real character, so what she picks is what she gets. */
function PreviewOf({ file }: { file: string }) {
  const drawn = parseDrawn(file);
  if (drawn) return <SvgCharacter face={drawn} mood="happy" size={46} />;
  return <RivePreview file={file} />;
}

function RivePreview({ file }: { file: string }) {
  const [Comp, setComp] = useState<React.ComponentType<{ src: string; size: number; mood: "happy" }> | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    import("./character/RiveCharacter").then((m) => {
      if (alive) setComp(() => m.RiveCharacter as never);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!Comp) return <span className="text-[18px]">🎭</span>;
  return <Comp src={file} size={44} mood="happy" />;
}
