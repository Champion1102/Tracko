import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { buildCoachContext, coachConfigured, generateCoachPack } from "@/lib/coach";
import { db } from "@/lib/db";
import { loadState } from "@/lib/state";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Manual trigger so you don't have to wait for the 5am cron to see it work. */
export async function POST() {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!coachConfigured()) {
    return NextResponse.json(
      { error: "No provider key set — add GROQ_API_KEY to .env.local" },
      { status: 400 },
    );
  }

  const state = await loadState();
  const result = await generateCoachPack(buildCoachContext(state), state.today);

  if (!result.ok) {
    return NextResponse.json({ error: result.errors.join(" · ") }, { status: 502 });
  }

  await db().setCoachPack(result.pack);
  return NextResponse.json({
    ok: true,
    provider: result.provider,
    count: result.pack.lines.length,
    sample: result.pack.lines.slice(0, 3).map((l) => l.text),
  });
}
