"use client";

import { useEffect, useMemo, useState } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { MOOD_INDEX, type CharacterProps } from "./contract";
import { SvgCharacter } from "./SvgCharacter";

type Props = CharacterProps & { src: string; stateMachine?: string };

export function RiveCharacter(props: Props) {
  const {
    mood = "happy",
    event = null,
    eventNonce = 0,
    talking = false,
    size = 108,
    className = "",
    src,
    stateMachine,
  } = props;

  // Load without naming a state machine so any community file works. Once it's
  // up we read the names the file actually has and drive the first one — no
  // configuration, no guessing at "State Machine 1".
  const { rive, RiveComponent } = useRive({ src, autoplay: true });

  const machine = useMemo(() => {
    const names = rive?.stateMachineNames ?? [];
    if (!names.length) return null;
    if (stateMachine && names.includes(stateMachine)) return stateMachine;
    return names.find((n) => n.toLowerCase().includes("nimbus")) ?? names[0];
  }, [rive, stateMachine]);

  useEffect(() => {
    if (rive && machine) rive.play(machine);
  }, [rive, machine]);

  // Inputs resolve to null on files that don't implement the contract; the
  // character still renders and animates, it just won't change expression.
  const moodInput = useStateMachineInput(rive, machine ?? "", "mood");
  const talkingInput = useStateMachineInput(rive, machine ?? "", "talking");
  const tickTrigger = useStateMachineInput(rive, machine ?? "", "tick");
  const celebrateTrigger = useStateMachineInput(rive, machine ?? "", "celebrate");

  // If the WASM runtime or the file never comes up — old device, blocked
  // network, wrong path — quietly go back to the drawn character rather than
  // leaving an empty box.
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (rive) return;
    const t = setTimeout(() => setFailed(true), 5000);
    return () => clearTimeout(t);
  }, [rive]);

  // Rive's API is imperative: you drive the state machine by assigning to the
  // input objects it hands back. That's the library's contract, not a mistake.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    if (moodInput) moodInput.value = MOOD_INDEX[mood];
  }, [mood, moodInput]);

  useEffect(() => {
    if (talkingInput) talkingInput.value = talking;
  }, [talking, talkingInput]);
  /* eslint-enable react-hooks/immutability */

  useEffect(() => {
    if (!event) return;
    if (event === "tick") tickTrigger?.fire();
    else celebrateTrigger?.fire();
  }, [event, eventNonce, tickTrigger, celebrateTrigger]);

  if (failed) return <SvgCharacter {...props} />;

  return (
    <div style={{ width: size, height: (size * 108) / 130 }} className={className}>
      <RiveComponent />
    </div>
  );
}
