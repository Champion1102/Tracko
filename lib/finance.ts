import type { Expense, SpendVerdict } from "./types";

/**
 * A fixed catalogue rather than user-defined categories. Free-text categories
 * fragment fast — "food", "Food", "eating out" become three buckets and the
 * breakdown stops meaning anything. Twelve covers a personal budget; the note
 * field carries the detail.
 */
export const CATEGORIES = [
  { id: "groceries", label: "Groceries", emoji: "🛒" },
  { id: "eatingout", label: "Eating out", emoji: "🍔" },
  { id: "transport", label: "Transport", emoji: "🚕" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "beauty", label: "Beauty", emoji: "💅" },
  { id: "health", label: "Health", emoji: "💊" },
  { id: "bills", label: "Bills", emoji: "🧾" },
  { id: "rent", label: "Rent", emoji: "🏠" },
  { id: "fun", label: "Fun", emoji: "🎬" },
  { id: "gifts", label: "Gifts", emoji: "🎁" },
  { id: "learning", label: "Learning", emoji: "📚" },
  { id: "other", label: "Other", emoji: "✨" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id as string, c]));

export function category(id: string) {
  return BY_ID.get(id) ?? { id: "other", label: "Other", emoji: "✨" };
}

export function isCategoryId(id: string): boolean {
  return BY_ID.has(id);
}

export const VERDICTS: {
  id: SpendVerdict;
  label: string;
  /** Past-tense summary label, for the totals row. */
  noun: string;
  tone: string;
}[] = [
  { id: "worth", label: "Worth it", noun: "Worth it", tone: "grass" },
  { id: "meh", label: "Meh", noun: "Meh", tone: "gold" },
  { id: "regret", label: "Regret", noun: "Regretted", tone: "flame" },
];

export function isVerdict(v: string): v is SpendVerdict {
  return v === "worth" || v === "meh" || v === "regret";
}

export type Summary = {
  total: number;
  count: number;
  byVerdict: Record<SpendVerdict, number>;
  byCategory: { id: string; label: string; emoji: string; total: number; count: number }[];
  /** Share of spend she marked a regret, 0–100. The number worth looking at. */
  regretPct: number;
};

export function summarise(expenses: Expense[]): Summary {
  const byVerdict: Record<SpendVerdict, number> = { worth: 0, meh: 0, regret: 0 };
  const cats = new Map<string, { total: number; count: number }>();
  let total = 0;

  for (const e of expenses) {
    total += e.amount;
    byVerdict[e.verdict] += e.amount;
    const cur = cats.get(e.categoryId) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    cats.set(e.categoryId, cur);
  }

  const byCategory = [...cats.entries()]
    .map(([id, v]) => ({ ...category(id), id, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);

  return {
    total,
    count: expenses.length,
    byVerdict,
    byCategory,
    regretPct: total > 0 ? (byVerdict.regret / total) * 100 : 0,
  };
}

/** Expenses falling inside a YYYY-MM month key, newest first. */
export function forMonth(expenses: Expense[], month: string): Expense[] {
  return expenses
    .filter((e) => e.day.startsWith(month))
    .sort((a, b) => b.day.localeCompare(a.day) || b.createdAt.localeCompare(a.createdAt));
}

/** Distinct YYYY-MM keys present in the data, newest first. */
export function monthsPresent(expenses: Expense[]): string[] {
  return [...new Set(expenses.map((e) => e.day.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
