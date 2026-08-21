"use client";

import { useEffect, useId, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import type { CharacterProps } from "./contract";
import { DRAWN, type DrawnId } from "./faces";

/**
 * The hand-drawn cast. Same props and events as the Rive path, so nothing
 * downstream knows or cares which is mounted.
 */
export function SvgCharacter({
  face = "nimbus",
  mood = "happy",
  event = null,
  eventNonce = 0,
  talking = false,
  size = 108,
  className = "",
}: CharacterProps & { face?: DrawnId }) {
  const controls = useAnimationControls();
  const [mouthOpen, setMouthOpen] = useState(false);
  // Gradient ids must be unique or several characters on one page share fills.
  const uid = useId().replace(/[:]/g, "");

  useEffect(() => {
    if (!event) return;
    if (event === "tick") {
      controls.start({ scale: [1, 1.12, 1], transition: { duration: 0.32 } });
    } else if (event === "complete") {
      controls.start({
        y: [0, -18, 0],
        scale: [1, 1.08, 1],
        transition: { duration: 0.5, ease: "easeOut" },
      });
    } else {
      controls.start({
        rotate: [0, -8, 8, -5, 0],
        scale: [1, 1.2, 1],
        transition: { duration: 0.8 },
      });
    }
  }, [event, eventNonce, controls]);

  // Cheap lip-sync: flap the mouth while speech synthesis is running. The flag
  // is only read when `talking` is true, so it needs no reset.
  useEffect(() => {
    if (!talking) return;
    const id = setInterval(() => setMouthOpen((v) => !v), 140);
    return () => clearInterval(id);
  }, [talking]);

  const Body = (DRAWN[face] ?? DRAWN.nimbus).Body;

  return (
    <motion.svg
      animate={controls}
      viewBox="0 0 130 108"
      width={size}
      height={(size * 108) / 130}
      className={className}
      role="img"
      aria-label={`${DRAWN[face]?.name ?? "Nimbus"} looking ${mood}`}
    >
      <Body mood={mood} mouthOpen={talking && mouthOpen} id={uid} />
    </motion.svg>
  );
}
