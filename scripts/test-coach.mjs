/**
 * Preview Nimbus's live lines without clicking through the app.
 * Useful for tuning the prompt in lib/coach.ts.
 *
 *   node --env-file=.env.local scripts/test-coach.mjs
 */
import { readFileSync } from "node:fs";

const src = readFileSync("lib/coach.ts", "utf8");
const system = src.match(/const LIVE_SYSTEM = `([\s\S]*?)`;/)[1];

const PROVIDERS = [
  { label: "Groq", url: "https://api.groq.com/openai/v1", key: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b", json: false, lowReasoning: true },
  { label: "Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai",
    key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", json: true },
  { label: "Mistral", url: "https://api.mistral.ai/v1", key: process.env.MISTRAL_API_KEY,
    model: process.env.MISTRAL_MODEL ?? "mistral-small-latest", json: true },
  { label: "SambaNova", url: "https://api.sambanova.ai/v1", key: process.env.SAMBANOVA_API_KEY,
    model: process.env.SAMBANOVA_MODEL ?? "Meta-Llama-3.3-70B-Instruct", json: true },
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1", key: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free", json: true },
  { label: "Cerebras", url: "https://api.cerebras.ai/v1", key: process.env.CEREBRAS_API_KEY,
    model: process.env.CEREBRAS_MODEL ?? "gpt-oss-120b", json: true },
].filter((p) => p.key);

const base = {
  dayNumber: 24, totalDays: 90, reward: "Dyson Airwrap",
  earnedTowardRewardSoFar: "₹11,430", herName: "Riya",
};

const CASES = [
  { ...base, justCompleted: "AI / CS deep work", itsWorth: "₹118", timeNow: "23:14",
    habitsLeftToday: 2, whatsLeft: ["4 litres of water", "Slept on time"], dayIsComplete: false,
    earnedToday: "₹451", stillOnTheTableToday: "₹86", currentStreak: 1 },
  { ...base, justCompleted: "4 litres of water", itsWorth: "₹64", timeNow: "14:20",
    habitsLeftToday: 5, whatsLeft: ["No sugar", "AI / CS deep work", "Meditation + yoga", "Skincare", "Slept on time"],
    dayIsComplete: false, earnedToday: "₹172", stillOnTheTableToday: "₹365", currentStreak: 9 },
  { ...base, justCompleted: "Badminton / gym", itsWorth: "₹107", timeNow: "06:40",
    habitsLeftToday: 7, whatsLeft: ["No sugar", "AI / CS deep work"], dayIsComplete: false,
    earnedToday: "₹107", stillOnTheTableToday: "₹430", currentStreak: 0 },
  { ...base, justCompleted: "Slept on time", itsWorth: "₹43", timeNow: "07:05",
    habitsLeftToday: 0, whatsLeft: [], dayIsComplete: true,
    earnedToday: "₹537", stillOnTheTableToday: "₹0", currentStreak: 12 },
];

function extract(text) {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : { text: text.trim(), mood: "?" };
}

for (const p of PROVIDERS) {
  console.log(`\n═══ ${p.label} · ${p.model}`);
  for (const ctx of CASES) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${p.url}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({
          model: p.model, temperature: 1, max_tokens: 900,
          ...(p.lowReasoning ? { reasoning_effort: "low" } : {}),
          ...(p.json ? { response_format: { type: "json_object" } } : {}),
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(ctx) },
          ],
        }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(body).slice(0, 140));
      const line = extract(body.choices[0].message.content);
      const ms = Date.now() - t0;
      console.log(`\n  ${ctx.justCompleted} @ ${ctx.timeNow} · ${ctx.habitsLeftToday} left · streak ${ctx.currentStreak}`);
      console.log(`  → "${line.text}"  [${line.mood}, ${ms}ms]`);
    } catch (err) {
      console.log(`\n  ${ctx.justCompleted}: FAILED — ${err.message}`);
    }
  }
}

// --- the daily pack, which is much longer and the likelier thing to truncate ---
const packSystem = readFileSync("lib/coach.ts", "utf8").match(/const SYSTEM = `([\s\S]*?)`;/)[1];
const p = PROVIDERS[0];
if (p) {
  console.log(`\n═══ daily pack · ${p.label} · ${p.model}`);
  const t0 = Date.now();
  const res = await fetch(`${p.url}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({
      model: p.model, temperature: 0.9, max_tokens: 4000,
      ...(p.lowReasoning ? { reasoning_effort: "low" } : {}),
      ...(p.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: packSystem },
        { role: "user", content: `Here is where she stands today. Write the 27 lines.\n\n${JSON.stringify(base)}` },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await res.json();
  if (!res.ok) console.log("  FAILED —", JSON.stringify(body).slice(0, 200));
  else {
    const raw = body.choices[0].message.content;
    const m = raw.match(/\{[\s\S]*\}/);
    try {
      const pack = JSON.parse(m[0]);
      console.log(`  ${pack.lines.length} lines in ${Date.now() - t0}ms`);
      for (const l of pack.lines.slice(0, 6)) console.log(`   ${l.situation.padEnd(12)} "${l.text}"`);
    } catch {
      console.log(`  TRUNCATED after ${Date.now() - t0}ms — tail: ${raw.slice(-90)}`);
    }
  }
}
