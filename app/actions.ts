"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentRole, endSession, roleForPin, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { diffDays, todayInTz } from "@/lib/dates";
import { detectCelebrations } from "@/lib/scoring";
import { sendPush } from "@/lib/push";
import type { Config, Entry, Habit, Role } from "@/lib/types";

async function requireRole(...roles: Role[]): Promise<Role> {
  const role = await currentRole();
  if (!role || !roles.includes(role)) throw new Error("Not allowed");
  return role;
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- auth

export async function loginAction(_prev: unknown, formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const role = roleForPin(pin);
  if (!role) return { error: "That PIN doesn't match." };
  await startSession(role);
  if (role === "sponsor") redirect("/sponsor");

  const { config } = await db().read();
  redirect(config.onboardedAt ? "/today" : "/welcome");
}

export async function logoutAction() {
  await endSession();
  redirect("/login");
}

// ---------------------------------------------------------------- logging

/** Backfill is limited to yesterday, and the future is always off-limits. */
function assertLoggable(day: string, today: string) {
  const delta = diffDays(day, today);
  if (delta < 0) throw new Error("Can't log a future day");
  if (delta > 1) throw new Error("You can only edit today and yesterday");
}

async function afterLog() {
  const store = db();
  const data = await store.read();
  const today = todayInTz(data.config.timezone);
  const existing = new Set(data.celebrations.map((c) => c.key));
  const fresh = detectCelebrations(data.config, data.habits, data.entries, today, existing);
  if (fresh.length) {
    await store.addCelebrations(fresh);
    const best = fresh[fresh.length - 1];
    await sendPush("sponsor", {
      title: `${data.config.heroName || "She"} just hit: ${best.title}`,
      body: best.body,
      url: "/sponsor",
      tag: best.key,
    });
  }
  refresh();
}

export async function setHabitValue(habitId: string, day: string, value: number) {
  await requireRole("hero");
  const store = db();
  const data = await store.read();
  const today = todayInTz(data.config.timezone);
  assertLoggable(day, today);

  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit) throw new Error("Unknown habit");

  const prev = data.entries.find((e) => e.habitId === habitId && e.day === day);
  const entry: Entry = {
    habitId,
    day,
    value: Math.max(0, value),
    subDone: prev?.subDone ?? new Array(habit.subItems?.length ?? 0).fill(false),
    note: prev?.note,
    updatedAt: new Date().toISOString(),
  };
  await store.upsertEntry(entry);
  await afterLog();
}

export async function toggleSubItem(habitId: string, day: string, idx: number) {
  await requireRole("hero");
  const store = db();
  const data = await store.read();
  const today = todayInTz(data.config.timezone);
  assertLoggable(day, today);

  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit?.subItems) throw new Error("Not a checklist habit");

  const prev = data.entries.find((e) => e.habitId === habitId && e.day === day);
  const subDone = [...(prev?.subDone ?? new Array(habit.subItems.length).fill(false))];
  subDone[idx] = !subDone[idx];

  await store.upsertEntry({
    habitId,
    day,
    value: subDone.filter(Boolean).length,
    subDone,
    note: prev?.note,
    updatedAt: new Date().toISOString(),
  });
  await afterLog();
}

export async function setSleepTimes(
  habitId: string,
  day: string,
  bedtime: string,
  wakeTime: string,
) {
  await requireRole("hero");
  const store = db();
  const data = await store.read();
  const today = todayInTz(data.config.timezone);
  assertLoggable(day, today);

  const habit = data.habits.find((h) => h.id === habitId);
  if (habit?.kind !== "sleep") throw new Error("Not a sleep habit");

  const prev = data.entries.find((e) => e.habitId === habitId && e.day === day);
  await store.upsertEntry({
    habitId,
    day,
    // `value` stays as a rough "logged at all" flag; the times are the truth.
    value: bedtime && wakeTime ? 1 : 0,
    subDone: prev?.subDone ?? [],
    bedtime: bedtime || undefined,
    wakeTime: wakeTime || undefined,
    note: prev?.note,
    updatedAt: new Date().toISOString(),
  });
  await afterLog();
}

export async function markSeen(keys: string[]) {
  await requireRole("hero", "sponsor");
  if (!keys.length) return;
  await db().markCelebrationsSeen(keys);
  refresh();
}

export async function spendFreeze(day: string) {
  await requireRole("hero");
  const store = db();
  const { config } = await store.read();
  if (config.freezeDays.includes(day)) return;
  if (config.freezeDays.length >= config.freezesTotal) throw new Error("No freezes left");
  await store.patchConfig({ freezeDays: [...config.freezeDays, day] });
  refresh();
}

// ---------------------------------------------------------------- sponsor

/** Both directions go through here; the sender's role decides who gets pinged. */
export async function sendMessage(body: string) {
  const role = await requireRole("hero", "sponsor");
  const text = body.trim().slice(0, 400);
  if (!text) return;

  const store = db();
  await store.addNudge({
    id: `n_${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    from: role,
    body: text,
    sentAt: new Date().toISOString(),
    readAt: null,
  });

  const { config } = await store.read();
  const toSponsor = role === "hero";
  await sendPush(toSponsor ? "sponsor" : "hero", {
    title: toSponsor
      ? `${config.heroName || "She"} replied 💬`
      : `${config.sponsorName || "A message for you"} 💌`,
    body: text,
    url: toSponsor ? "/sponsor" : "/today",
    tag: "message",
  });
  refresh();
}

export async function markNudgesRead() {
  const role = await requireRole("hero", "sponsor");
  await db().markNudgesRead(role);
  refresh();
}

export async function saveLetter(id: string, title: string, body: string) {
  await requireRole("sponsor");
  const store = db();
  const { letters } = await store.read();
  const letter = letters.find((l) => l.id === id);
  if (!letter) throw new Error("Unknown letter");
  if (letter.openedAt) throw new Error("She's already read this one");
  await store.upsertLetter({ ...letter, title: title.trim(), body: body.trim() });
  refresh();
}

export async function openLetter(id: string) {
  await requireRole("hero");
  await db().openLetter(id);
  refresh();
}

// ------------------------------------------------------------- onboarding

/** Everything she fills in on day one, saved in one go at the end. */
export async function completeOnboarding(input: {
  name: string;
  birthday: string;
  signature: string;
}) {
  await requireRole("hero");

  const name = input.name.trim().slice(0, 40);
  if (!name) throw new Error("Name is required");

  // A signature is a PNG data URL. Cap it so a pathological canvas can't be
  // used to stuff megabytes into the config row.
  const signature = input.signature.startsWith("data:image/png;base64,")
    ? input.signature.slice(0, 400_000)
    : "";

  const now = new Date().toISOString();
  await db().patchConfig({
    heroName: name,
    heroBirthday: /^\d{4}-\d{2}-\d{2}$/.test(input.birthday) ? input.birthday : "",
    promiseSignature: signature,
    promiseAcceptedAt: now,
    onboardedAt: now,
  });
  refresh();
}

/** Sponsor-only: lets her go through the welcome flow again. */
export async function resetOnboarding() {
  await requireRole("sponsor");
  await db().patchConfig({ onboardedAt: null, promiseAcceptedAt: null, promiseSignature: "" });
  refresh();
}

// ---------------------------------------------------------------- settings

/** Hers to control: when the phone buzzes. */
export async function updateReminders(
  patch: Pick<Config, "reminderMorning" | "reminderEvening" | "remindersOn">,
) {
  await requireRole("hero", "sponsor");
  await db().patchConfig({
    reminderMorning: patch.reminderMorning,
    reminderEvening: patch.reminderEvening,
    remindersOn: patch.remindersOn,
  });
  refresh();
}

/**
 * The terms of the deal. Sponsor only — she is the one being held to these,
 * so letting her move the finish line would make the whole thing meaningless.
 */
export async function updateDeal(patch: Partial<Config>) {
  await requireRole("sponsor");
  await db().patchConfig(patch);
  refresh();
}

export async function saveHabit(habit: Habit) {
  await requireRole("sponsor");
  await db().upsertHabit(habit);
  refresh();
}

export async function deleteHabit(id: string) {
  await requireRole("sponsor");
  await db().deleteHabit(id);
  refresh();
}
