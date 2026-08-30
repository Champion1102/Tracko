import type { JournalMood } from "./types";

/** The five journal moods, shared by the editor and the Progress readout. */
export const MOODS: { value: JournalMood; face: string; label: string }[] = [
  { value: 1, face: "😞", label: "Rough" },
  { value: 2, face: "😕", label: "Meh" },
  { value: 3, face: "😐", label: "Okay" },
  { value: 4, face: "🙂", label: "Good" },
  { value: 5, face: "😄", label: "Great" },
];

export const moodFace = (m: JournalMood | null) =>
  MOODS.find((x) => x.value === m)?.face ?? null;
