import type { Habit, HabitKind, Proof } from "../types";

const KINDS: HabitKind[] = ["binary", "counter", "checklist"];

/**
 * Habits saved before the simplification can still carry kinds that no longer
 * exist ("duration", "sleep") plus points and a cadence. Every one of those is
 * a single daily tick now, and the extra fields are dropped on the way in, so
 * both stores keep working on a database the SQL migration hasn't reached yet.
 */
export function normalizeHabit(raw: Record<string, unknown>): Habit {
  const kind = KINDS.includes(raw.kind as HabitKind) ? (raw.kind as HabitKind) : "binary";
  const proof =
    raw.proof === "photo" || raw.proof === "link" || raw.proof === "hours"
      ? (raw.proof as Proof)
      : undefined;
  const subItems = Array.isArray(raw.subItems) ? (raw.subItems as string[]) : undefined;

  const target =
    kind === "binary"
      ? 1
      : kind === "checklist"
        ? Math.max(subItems?.length ?? 1, 1)
        : Math.max(Math.round(Number(raw.target) || 1), 1);

  return {
    id: String(raw.id),
    slug: String(raw.slug ?? raw.id),
    name: String(raw.name ?? ""),
    blurb: String(raw.blurb ?? ""),
    emoji: String(raw.emoji ?? "✅"),
    icon: typeof raw.icon === "string" && raw.icon ? raw.icon : undefined,
    kind,
    target,
    unit: kind === "binary" ? "" : String(raw.unit ?? ""),
    subItems: kind === "checklist" ? subItems : undefined,
    proof,
    sortOrder: Number(raw.sortOrder ?? 0),
    active: raw.active !== false,
  };
}
