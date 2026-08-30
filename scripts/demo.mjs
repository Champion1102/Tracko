/**
 * Fills .data/tracko.json with a few weeks of plausible history so you can see
 * every screen in a realistic state. Development only — never run this against
 * Supabase.
 */
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const DAYS_IN = 24;
const TOTAL_DAYS = 100;

// [id, kind, target, probability of a full tick]
const HABITS = [
  ["h_sugar", "binary", 1, 0.78],
  ["h_learning", "binary", 1, 0.68],
  ["h_nutrition", "binary", 1, 0.82],
  ["h_water", "binary", 1, 0.85],
  ["h_mindbody", "binary", 1, 0.8],
  ["h_skincare", "checklist", 2, 0.9],
  ["h_premeal", "binary", 1, 0.7],
];

// Deterministic PRNG so the demo looks the same every run.
let s = 20260831;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

const iso = (d) => d.toISOString().slice(0, 10);
const now = new Date();
const start = new Date(now);
start.setUTCDate(start.getUTCDate() - (DAYS_IN - 1));

const entries = [];
const push = (habitId, day, value, subDone = [], note) =>
  entries.push({ habitId, day, value, subDone, note, updatedAt: new Date().toISOString() });

const journal = [];
const LINES = [
  "Long day but I got the important ones done.",
  "Skipped the gym, walked instead. Counting the walk in my heart only.",
  "Posted the thing. Terrifying every time, easier every time.",
  "Water is the easiest and I still forget it. How.",
  "Quiet day. Ticked, slept, done.",
];

for (let i = 0; i < DAYS_IN; i++) {
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + i);
  const day = iso(d);

  // One properly bad day and a couple of shaky ones, to exercise every state.
  const slump = i === 11 ? 0 : i === 12 || i === 19 ? 0.45 : 1;

  for (const [id, kind, target, base] of HABITS) {
    const p = base * slump;
    if (rnd() > p) continue;
    if (kind === "binary") push(id, day, 1);
    else push(id, day, target, new Array(target).fill(true));
  }

  // Sleep ticks with hours most nights.
  if (rnd() < 0.8 * slump) push("h_sleep", day, [6, 6.5, 7, 7.5, 8][Math.floor(rnd() * 5)]);

  // Gym roughly every other day, posts twice a week with a link.
  const dow = d.getUTCDay();
  if (dow !== 0 && rnd() < 0.55 * slump) push("h_movement", day, 1);
  if ((dow === 2 || dow === 5) && rnd() < 0.8 * slump) {
    push("h_content", day, 1, [], "https://www.linkedin.com/posts/demo-post");
  }

  if (rnd() < 0.5 * slump) {
    journal.push({
      day,
      body: LINES[Math.floor(rnd() * LINES.length)],
      mood: 2 + Math.floor(rnd() * 4),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

const db = {
  config: {
    startDate: iso(start),
    totalDays: TOTAL_DAYS,
    currency: "₹",
    timezone: "Asia/Kolkata",
    heroName: "Riya",
    sponsorName: "Ritesh",
    heroBirthday: "",
    promiseText:
      "I'm not doing this for anyone else.\n\nI'll tick only what I've actually done — no rounding up, no telling myself it's close enough.\n\nOn the days I don't feel like it, I'll do it small rather than not at all.\n\nIf I fall off, I'll come back the next morning instead of disappearing.\n\nWholeheartedly. All hundred days.",
    promiseSignature: "",
    promiseAcceptedAt: null,
    // Left null on purpose so `npm run demo` always drops you into the welcome
    // flow. Complete it once and the rest of the app opens normally.
    onboardedAt: null,
    reminderMorning: "07:30",
    reminderEvening: "20:30",
    remindersOn: true,
    notifyLog: {},
  },
  entries,
  journal,
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
  expenses: [],
};

mkdirSync(".data", { recursive: true });
// Same write-then-rename as the store, so a running dev server can't read a
// half-written file and decide the database is corrupt.
writeFileSync(".data/tracko.json.tmp", JSON.stringify(db, null, 2));
renameSync(".data/tracko.json.tmp", ".data/tracko.json");
console.log(`Wrote ${entries.length} entries across ${DAYS_IN} days starting ${iso(start)}.`);
