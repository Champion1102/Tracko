/**
 * Fills .data/tracko.json with a few weeks of plausible history so you can see
 * every screen in a realistic state. Development only — never run this against
 * Supabase.
 */
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const DAYS_IN = 24;
const TOTAL_DAYS = 100;

const DAILY = [
  ["h_sugar", "binary", 1, 0.78],
  ["h_learning", "duration", 60, 0.68],
  ["h_nutrition", "checklist", 3, 0.82],
  ["h_water", "counter", 8, 0.85],
  ["h_mindbody", "duration", 10, 0.8],
  ["h_skincare", "checklist", 2, 0.9],
  ["h_premeal", "counter", 2, 0.7],
];

// Deterministic PRNG so the demo looks the same every run.
let s = 20260818;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

const iso = (d) => d.toISOString().slice(0, 10);
const now = new Date();
const start = new Date(now);
start.setUTCDate(start.getUTCDate() - (DAYS_IN - 1));

const entries = [];
const push = (habitId, day, value, subDone = []) =>
  entries.push({ habitId, day, value, subDone, updatedAt: new Date().toISOString() });

for (let i = 0; i < DAYS_IN; i++) {
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + i);
  const day = iso(d);

  // One properly bad day and a couple of shaky ones, to exercise every state.
  const slump = i === 11 ? 0 : i === 12 || i === 19 ? 0.45 : 1;

  for (const [id, kind, target, base] of DAILY) {
    const p = base * slump;
    if (rnd() > p) {
      // partial credit some of the time rather than a flat zero
      if (kind === "counter" && rnd() > 0.5) push(id, day, Math.max(1, Math.floor(target * 0.6)));
      else if (kind === "duration" && rnd() > 0.6) push(id, day, Math.floor(target * 0.5));
      continue;
    }
    if (kind === "binary") push(id, day, 1);
    else if (kind === "checklist") push(id, day, target, new Array(target).fill(true));
    else push(id, day, target + (rnd() > 0.75 ? Math.ceil(target * 0.25) : 0));
  }

  // Sleep is logged as clock times now.
  if (rnd() < 0.8 * slump) {
    const bedH = 22 + Math.floor(rnd() * 3); // 22:00–00:xx
    const bedM = rnd() > 0.5 ? 30 : 0;
    const wakeH = 6 + Math.floor(rnd() * 2);
    const wakeM = rnd() > 0.5 ? 30 : 0;
    const pad = (n) => String(n % 24).padStart(2, "0");
    entries.push({
      habitId: "h_sleep",
      day,
      value: 1,
      subDone: [],
      bedtime: `${pad(bedH)}:${String(bedM).padStart(2, "0")}`,
      wakeTime: `${pad(wakeH)}:${String(wakeM).padStart(2, "0")}`,
      updatedAt: new Date().toISOString(),
    });
  }

  const dow = d.getUTCDay();
  if (dow !== 0 && rnd() < 0.78 * slump) push("h_movement", day, 1);
  if ((dow === 2 || dow === 5) && rnd() < 0.8) push("h_content", day, 1);
}

const db = {
  config: {
    startDate: iso(start),
    totalDays: TOTAL_DAYS,
    rewardName: "Dyson Airwrap",
    rewardPrice: 49900,
    currency: "₹",
    rewardImage: "/reward.png",
    rewardTargetPct: 85,
    timezone: "Asia/Kolkata",
    heroName: "Riya",
    sponsorName: "Ritesh",
    freezesTotal: 3,
    photoBonusPoints: 1,
    photoMaxPerDay: 4,
    perfectWeekBonus: 50,
    idealBedtime: "23:00",
    idealWakeTime: "07:00",
    sleepTargetHours: 7.5,
    sleepToleranceMin: 45,
    heroBirthday: "",
    promiseText:
      "I'm not doing this for anyone else.\n\nI'll tick only what I've actually done — no rounding up, no telling myself it's close enough.\n\nOn the days I don't feel like it, I'll do it small rather than not at all.\n\nIf I fall off, I'll come back the next morning instead of disappearing.\n\nWholeheartedly. All hundred days.",
    promiseSignature: "",
    promiseAcceptedAt: null,
    // Left null on purpose so `npm run demo` always drops you into the welcome
    // flow. Complete it once and the rest of the app opens normally.
    onboardedAt: null,
    penaltyEnabled: false,
    penaltyPoints: 25,
    penaltyBelowPct: 30,
    freezeDays: [],
    reminderMorning: "07:30",
    reminderEvening: "20:30",
    remindersOn: true,
    notifyLog: {},
  },
  entries,
  nudges: [
    {
      id: "n_demo1",
      from: "sponsor",
      body: "Saw your LinkedIn post. Genuinely good. Keep going 🔥",
      sentAt: new Date(Date.now() - 3600_000 * 5).toISOString(),
      readAt: null,
    },
  ],
  celebrations: [],
  pushSubs: [],
  photos: [],
  chat: [],
};

mkdirSync(".data", { recursive: true });
// Same write-then-rename as the store, so a running dev server can't read a
// half-written file and decide the database is corrupt.
writeFileSync(".data/tracko.json.tmp", JSON.stringify(db, null, 2));
renameSync(".data/tracko.json.tmp", ".data/tracko.json");
console.log(`Wrote ${entries.length} entries across ${DAYS_IN} days starting ${iso(start)}.`);
