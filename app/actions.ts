"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import {
  currentRole,
  endSession,
  needsPinSetup,
  setPin,
  startSession,
  validatePin,
  verifyPin,
} from "@/lib/auth";
import { clearAttempts, takeAttempt } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { diffDays, todayInTz } from "@/lib/dates";
import { detectCelebrations } from "@/lib/scoring";
import { sendPush } from "@/lib/push";
import type { Store } from "@/lib/db";
import type { Config, DB, Entry, Habit, JournalMood, Role } from "@/lib/types";

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

  // Throttle by client IP before doing any PIN work, so a script can't grind
  // through the keyspace. x-forwarded-for's first hop is the real client
  // behind Vercel's proxy; fall back to a shared key if it's somehow absent.
  const fwd = (await headers()).get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || "unknown";
  const gate = takeAttempt(`login:${ip}`);
  if (!gate.ok) {
    const mins = Math.ceil(gate.retryAfterSec / 60);
    return { error: `Too many tries. Try again in ${mins} min.` };
  }

  // One read, and a failed one is "try again" — never a reason to treat the
  // app as fresh. Nothing is written before the config is known to be real.
  let config: Config;
  try {
    ({ config } = await db().read());
  } catch (err) {
    console.error("login: database read failed", err);
    return { error: "Couldn't reach the database. Try again in a moment." };
  }

  const role = await verifyPin(pin, config);
  if (!role) return { error: "That PIN doesn't match." };

  clearAttempts(`login:${ip}`);
  await startSession(role);

  // Still on the bootstrap PIN handed to them — make them choose their own.
  if (needsPinSetup(config, role)) redirect("/set-pin");
  if (role === "sponsor") redirect("/sponsor");
  redirect(config.onboardedAt ? "/today" : "/welcome");
}

/** Set the logged-in user's own PIN. The session cookie already proves who
 *  they are, so no current PIN is required — this is the first-run claim and
 *  the Settings "change PIN" both. */
export async function setOwnPin(_prev: unknown, formData: FormData) {
  const role = await currentRole();
  if (!role) redirect("/login");

  const pin = String(formData.get("pin") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  const problem = validatePin(pin);
  if (problem) return { error: problem };
  if (pin !== confirm) return { error: "Those two don't match." };

  await setPin(role, pin);
  refresh();

  const { config } = await db().read();
  if (role === "sponsor") redirect("/sponsor");
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

/** Merge a just-written entry into the in-memory snapshot, so celebration
 *  detection can run on it without a second full database read. */
function applyEntry(data: DB, entry: Entry) {
  const i = data.entries.findIndex((e) => e.habitId === entry.habitId && e.day === entry.day);
  if (i >= 0) data.entries[i] = entry;
  else data.entries.push(entry);
}

async function afterLog(store: Store, data: DB) {
  const today = todayInTz(data.config.timezone);
  const existing = new Set(data.celebrations.map((c) => c.key));
  const fresh = detectCelebrations(data.config, data.habits, data.entries, today, existing);
  if (fresh.length) {
    await store.addCelebrations(fresh);
    const best = fresh[fresh.length - 1];
    // After the response is sent — a tick shouldn't wait on push delivery.
    after(() =>
      sendPush(
        "sponsor",
        {
          title: `${data.config.heroName || "She"} just hit: ${best.title}`,
          body: best.body,
          url: "/sponsor",
          tag: best.key,
        },
        data.pushSubs,
      ),
    );
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
  applyEntry(data, entry);
  await afterLog(store, data);
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

  const entry: Entry = {
    habitId,
    day,
    value: subDone.filter(Boolean).length,
    subDone,
    note: prev?.note,
    updatedAt: new Date().toISOString(),
  };
  await store.upsertEntry(entry);
  applyEntry(data, entry);
  await afterLog(store, data);
}

/** "" for nothing, otherwise a normalised http(s) URL — a bare
 *  "linkedin.com/posts/…" is what she'll actually paste. */
function normalizeUrl(raw: string): string {
  const text = raw.trim();
  if (!text) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString().slice(0, 500);
  } catch {
    return "";
  }
}

/** Link-proof habits: pasting a link is also the tick. Clearing keeps the tick. */
export async function setHabitLink(habitId: string, day: string, url: string) {
  await requireRole("hero");
  const store = db();
  const data = await store.read();
  const today = todayInTz(data.config.timezone);
  assertLoggable(day, today);

  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit) throw new Error("Unknown habit");

  const link = normalizeUrl(url);
  if (url.trim() && !link) throw new Error("That doesn't look like a link");

  const prev = data.entries.find((e) => e.habitId === habitId && e.day === day);
  const entry: Entry = {
    habitId,
    day,
    value: link ? Math.max(prev?.value ?? 0, 1) : (prev?.value ?? 0),
    subDone: prev?.subDone ?? [],
    note: link || undefined,
    updatedAt: new Date().toISOString(),
  };
  await store.upsertEntry(entry);
  applyEntry(data, entry);
  await afterLog(store, data);
}

export async function markSeen(keys: string[]) {
  await requireRole("hero", "sponsor");
  if (!keys.length) return;
  await db().markCelebrationsSeen(keys);
  refresh();
}

// ---------------------------------------------------------------- journal

const MOODS: JournalMood[] = [1, 2, 3, 4, 5];

/**
 * Autosaved from the editor, so this deliberately does NOT revalidate — a
 * refresh landing mid-sentence would hand the editor a stale body. The page
 * re-reads on the next navigation, which is soon enough for a diary.
 */
export async function saveJournal(day: string, body: string, mood: JournalMood | null) {
  await requireRole("hero");
  const store = db();
  const data = await store.read();
  const today = todayInTz(data.config.timezone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || diffDays(day, today) < 0) {
    throw new Error("Can't write a future day");
  }

  const text = body.trim().slice(0, 5000);
  const chosen = mood !== null && MOODS.includes(mood) ? mood : null;
  const prev = data.journal.find((j) => j.day === day);

  if (!text && chosen === null) {
    if (prev) await store.deleteJournal(day);
    return;
  }

  const now = new Date().toISOString();
  await store.upsertJournal({
    day,
    body: text,
    mood: chosen,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  });
}

export async function deleteJournal(day: string) {
  await requireRole("hero");
  await db().deleteJournal(day);
  refresh();
}

// ---------------------------------------------------------------- sponsor

/** Both directions go through here; the sender's role decides who gets pinged.
 *  FormData so a photo can ride along: `text` plus an optional `image` file
 *  (compressed client-side before it gets here). */
export async function sendMessage(formData: FormData) {
  const role = await requireRole("hero", "sponsor");
  const text = String(formData.get("text") ?? "").trim().slice(0, 400);
  const file = formData.get("image");
  const hasImage = file instanceof File && file.size > 0;
  if (!text && !hasImage) return;

  const store = db();
  const { config, pushSubs } = await store.read();

  const id = `n_${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  let image: string | undefined;
  if (hasImage) {
    if (!file.type.startsWith("image/")) throw new Error("Only images can be attached");
    // The client compresses to ~1400px JPEG; anything bigger means that step
    // was bypassed. Refuse rather than stuff megabytes into the bucket.
    if (file.size > 4_000_000) throw new Error("That image is too large");
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    image = `chat/${id}.${ext}`;
    await store.saveChatMedia(image, Buffer.from(await file.arrayBuffer()), file.type);
  }

  await store.addNudge({
    id,
    from: role,
    body: text,
    image,
    sentAt: new Date().toISOString(),
    readAt: null,
  });

  const toSponsor = role === "hero";
  // After the response is sent — sending shouldn't wait on push delivery.
  after(() =>
    sendPush(
      toSponsor ? "sponsor" : "hero",
      {
        title: toSponsor
          ? `${config.heroName || "She"} replied 💬`
          : `${config.sponsorName || "A message for you"} 💌`,
        body: text || "📷 Photo",
        url: toSponsor ? "/sponsor" : "/messages",
        tag: "message",
      },
      pushSubs,
    ),
  );
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

/** The frame of the challenge. Sponsor only — she doesn't move the clock. */
export async function updateDeal(patch: Partial<Config>) {
  await requireRole("sponsor");
  await db().patchConfig(patch);
  refresh();
}

/** Sponsor-only: pull Day 1 back to today, for when the deal was seeded or
 *  configured before she actually began. Nothing else is touched — anything
 *  logged before the new start date simply falls outside the window. */
export async function resetStartDate(): Promise<string> {
  await requireRole("sponsor");
  const store = db();
  const { config } = await store.read();
  const today = todayInTz(config.timezone);
  await store.patchConfig({ startDate: today });
  refresh();
  return today;
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
