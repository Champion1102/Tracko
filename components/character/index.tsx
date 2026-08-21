"use client";

import dynamic from "next/dynamic";
import { useCast } from "@/lib/characterStore";
import { type CharacterProps } from "./contract";
import { parseDrawn } from "./faces";
import { SvgCharacter } from "./SvgCharacter";

/**
 * The Rive runtime is lazy, and each page mounts only the roles it uses, so a
 * heavier Rive character in one corner costs nothing on Today.
 */
const RiveCharacter = dynamic(
  () => import("./RiveCharacter").then((m) => m.RiveCharacter),
  { ssr: false, loading: () => null },
);

export function Character({ role = "companion", ...props }: CharacterProps) {
  const cast = useCast();
  const value = cast[role];
  const drawn = parseDrawn(value);

  if (drawn) return <SvgCharacter {...props} face={drawn} />;
  return <RiveCharacter {...props} src={value} />;
}

export type { CharacterProps, CharacterEvent } from "./contract";
