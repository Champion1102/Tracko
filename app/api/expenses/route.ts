import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { todayInTz } from "@/lib/dates";
import { isCategoryId, isVerdict } from "@/lib/finance";
import type { Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_AMOUNT = 10_000_000;
const MAX_NOTE = 140;

/** Her money, her eyes. The sponsor holds the habit rules, not the wallet. */
async function requireHero() {
  return (await currentRole()) === "hero";
}

export async function GET() {
  if (!(await requireHero())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const { expenses, config } = await db().read();
  return NextResponse.json({ expenses, currency: config.currency });
}

export async function POST(req: Request) {
  if (!(await requireHero())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const body = (await req.json()) as {
    amount?: number;
    categoryId?: string;
    verdict?: string;
    note?: string;
    day?: string;
  };

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter an amount" }, { status: 400 });
  }
  if (amount > MAX_AMOUNT) {
    return NextResponse.json({ error: "That can't be right" }, { status: 400 });
  }
  if (!body.categoryId || !isCategoryId(body.categoryId)) {
    return NextResponse.json({ error: "Pick a category" }, { status: 400 });
  }
  if (!body.verdict || !isVerdict(body.verdict)) {
    return NextResponse.json({ error: "Pick a verdict" }, { status: 400 });
  }

  const store = db();
  const { config } = await store.read();
  const today = todayInTz(config.timezone);
  // Unlike habits, backdating is allowed — receipts surface late. The future
  // is still off-limits, since there's nothing honest to record there.
  const day = /^\d{4}-\d{2}-\d{2}$/.test(body.day ?? "") ? body.day! : today;
  if (day > today) {
    return NextResponse.json({ error: "That day hasn't happened yet" }, { status: 400 });
  }

  const expense: Expense = {
    id: `ex_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    day,
    amount,
    categoryId: body.categoryId,
    verdict: body.verdict,
    note: body.note?.trim().slice(0, MAX_NOTE) || undefined,
    createdAt: new Date().toISOString(),
  };

  await store.addExpense(expense);
  return NextResponse.json({ ok: true, expense });
}

export async function PATCH(req: Request) {
  if (!(await requireHero())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const { id, verdict } = (await req.json()) as { id?: string; verdict?: string };
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });
  if (!verdict || !isVerdict(verdict)) {
    return NextResponse.json({ error: "Bad verdict" }, { status: 400 });
  }
  await db().updateExpense(id, { verdict });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireHero())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });
  await db().deleteExpense(id);
  return NextResponse.json({ ok: true });
}
