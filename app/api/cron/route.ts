import { NextResponse } from "next/server";
import { buildCoachContext, coachConfigured, generateCoachPack, pickLine } from "@/lib/coach";
import { db } from "@/lib/db";
import { loadState } from "@/lib/state";
import { addDays, timeInTz, todayInTz } from "@/lib/dates";
import { sendPush } from "@/lib/push";
import { computeTotals, indexEntries, scoreDay } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/**
 * Hit this every ~15 minutes from any scheduler. Each slot fires at most once
 * per day, so a late or duplicated invocation is harmless.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization");
    const query = new URL(req.url).searchParams.get("key");
    if (header !== `Bearer ${secret}` && query !== secret) {
      return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    }
  }

  const store = db();
  const data = await store.read();
  const { config } = data;
  if (!config.remindersOn) return NextResponse.json({ ok: true, skipped: "reminders off" });

  const today = todayInTz(config.timezone);
  const now = timeInTz(config.timezone);
  const log = { ...(config.notifyLog ?? {}) };
  const fired: string[] = [];

  const index = indexEntries(data.entries);
  const day = scoreDay(config, data.habits, index, today, today);
  const { totals, days } = computeTotals(config, data.habits, data.entries, today);
  const remaining = day.perHabit.filter((p) => !p.done);
  const name = config.heroName;

  const due = (slot: string, at: string) => now >= at && log[slot] !== today;

  // Write the day's lines before the first reminder goes out, so the morning
  // push can use a fresh one.
  if (coachConfigured() && due("coach", "05:00")) {
    log.coach = today;
    fired.push("coach");
    const result = await generateCoachPack(buildCoachContext(await loadState()), today);
    if (result.ok) {
      await store.setCoachPack(result.pack);
      data.coach = result.pack;
    }
  }

  const coachPack = data.coach?.day === today ? data.coach : null;
  const line = (slot: "morning" | "evening") =>
    pickLine(coachPack, slot, totals.daysElapsed)?.text ?? null;

  if (due("morning", config.reminderMorning)) {
    log.morning = today;
    fired.push("morning");
    await sendPush("hero", {
      title:
        totals.currentStreak > 0
          ? `Day ${day.index} · ${totals.currentStreak} in a row`
          : `Day ${day.index} of ${config.totalDays}`,
      body:
        line("morning") ??
        (totals.currentStreak >= 7
          ? `Don't break it now${name ? `, ${name}` : ""}. Ten ticks waiting.`
          : `${day.total} things today. Start with water.`),
      url: "/today",
      tag: "morning",
    });
  }

  if (due("evening", config.reminderEvening) && remaining.length > 0) {
    log.evening = today;
    fired.push("evening");
    const list = remaining
      .slice(0, 3)
      .map((p) => p.habit.name.toLowerCase())
      .join(", ");
    await sendPush("hero", {
      title:
        remaining.length === 1
          ? "One habit left today"
          : `${remaining.length} habits left today`,
      body:
        line("evening") ??
        (totals.currentStreak > 0
          ? `${list}${remaining.length > 3 ? "…" : ""} — your ${totals.currentStreak}-day streak is on the line.`
          : `${list}${remaining.length > 3 ? "…" : ""}. Still time.`),
      url: "/today",
      tag: "evening",
    });
  }

  // Sunday evening recap for both of them.
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: config.timezone,
    weekday: "short",
  }).format(new Date());

  if (weekday === "Sun" && due("recap", "19:00")) {
    log.recap = today;
    fired.push("recap");
    const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const good = days.filter(
      (d) => week.includes(d.day) && (d.status === "perfect" || d.status === "kept"),
    ).length;
    const body = `${good} of 7 good days this week · ${totals.daysDone} days done so far · ${totals.currentStreak}-day streak.`;
    await sendPush("hero", { title: "Your week", body, url: "/progress", tag: "recap" });
    await sendPush("sponsor", {
      title: `${name || "Her"} week`,
      body,
      url: "/sponsor",
      tag: "recap",
    });
  }

  if (fired.length) await store.patchConfig({ notifyLog: log });
  return NextResponse.json({ ok: true, now, today, fired });
}
