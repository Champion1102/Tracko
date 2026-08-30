/**
 * Preview Nimbus's daily reminder lines without waiting for the 5am cron.
 * Useful for tuning the SYSTEM prompt in lib/coach.ts.
 *
 *   node --env-file=.env.local scripts/test-coach.mjs
 */
import { readFileSync } from "node:fs";

const system = readFileSync("lib/coach.ts", "utf8").match(/const SYSTEM = `([\s\S]*?)`;/)[1];

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

const ctx = {
  name: "Riya",
  dayNumber: 24,
  totalDays: 100,
  daysLeft: 76,
  currentStreak: 9,
  longestStreak: 12,
  daysDone: 19,
  perfectDays: 4,
  missedDays: 1,
  habitsOutstandingToday: ["4 litres of water", "Sleep"],
  steadiestHabit: "Skincare",
  shakiestHabit: "Post on Insta / LinkedIn",
};

for (const p of PROVIDERS) {
  console.log(`\n═══ ${p.label} · ${p.model}`);
  const t0 = Date.now();
  try {
    const res = await fetch(`${p.url}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model: p.model, temperature: 0.9, max_tokens: 2000,
        ...(p.lowReasoning ? { reasoning_effort: "low" } : {}),
        ...(p.json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Here is where she stands today. Write the 6 lines.\n\n${JSON.stringify(ctx)}` },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body).slice(0, 160));
    const raw = body.choices[0].message.content;
    const pack = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
    console.log(`  ${pack.lines.length} lines in ${Date.now() - t0}ms`);
    for (const l of pack.lines) console.log(`   ${l.situation.padEnd(8)} [${l.mood}] "${l.text}"`);
  } catch (err) {
    console.log(`  FAILED — ${err.message}`);
  }
}
