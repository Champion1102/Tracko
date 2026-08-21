export type Part = { id: string; label: string; at: number };

/** The reward assembles itself as the meter fills. `at` is % of reward progress. */
export const DYSON_PARTS: Part[] = [
  { id: "handle", label: "Handle", at: 0 },
  { id: "motor", label: "Digital motor", at: 13 },
  { id: "filter", label: "Filter cage", at: 26 },
  { id: "cable", label: "Power cable", at: 38 },
  { id: "barrel", label: "Main barrel", at: 50 },
  { id: "smooth", label: "Smoothing brush", at: 63 },
  { id: "round", label: "Volumising brush", at: 76 },
  { id: "curl", label: "Curling barrels", at: 88 },
  { id: "case", label: "Presentation case", at: 100 },
];

export function partsUnlocked(rewardPct: number) {
  return DYSON_PARTS.map((p) => ({ ...p, unlocked: rewardPct >= p.at }));
}

export function nextPart(rewardPct: number) {
  return DYSON_PARTS.find((p) => rewardPct < p.at) ?? null;
}
