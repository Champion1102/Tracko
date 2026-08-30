import "server-only";
import { z } from "zod";
import type { AppState } from "./state";
import type { CoachLine, CoachPack, Situation } from "./types";

/**
 * Lines are generated ONCE PER DAY by the cron job and read by the two push
 * reminders. The pack is cached in the database; the cron falls back to a
 * hand-written line whenever the pack is missing, stale, or every provider
 * is down.
 *
 * Providers are tried in order and the first one that returns valid lines wins.
 * Groq, Cerebras and OpenRouter all speak the OpenAI chat-completions dialect,
 * so they share one adapter.
 */

const SITUATIONS: Situation[] = ["morning", "evening"];

const LineSchema = z.object({
  situation: z.enum(["morning", "evening"]),
  text: z.string().min(1).max(160),
  mood: z.enum(["happy", "hype", "proud", "worried", "sleepy", "cheeky"]),
});

const PackSchema = z.object({ lines: z.array(LineSchema).min(2) });

// ---------------------------------------------------------------- providers

type ProviderId = "groq" | "gemini" | "mistral" | "sambanova" | "cerebras" | "openrouter";

type Provider = {
  id: ProviderId;
  label: string;
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  /**
   * Groq validates `response_format: json_object` strictly and rejects the
   * reasoning models outright ("Failed to validate JSON"), even though those
   * same models return perfectly clean JSON when simply asked to. "none"
   * means: trust the prompt and let parseLoose sort it out.
   */
  jsonMode: "object" | "none";
  /**
   * Reasoning models spend the token budget thinking before they answer, which
   * truncates the JSON mid-string. Turning reasoning down keeps them fast and
   * keeps the answer inside the budget.
   */
  lowReasoning?: boolean;
  headers?: Record<string, string>;
};

export type Purpose = "lines" | "chat";

/** Chat leans on Mistral first — its free allowance is by far the largest. */
const CHAT_ORDER: ProviderId[] = ["mistral", "groq", "gemini", "sambanova", "openrouter", "cerebras"];

function providers(purpose: Purpose = "lines"): Provider[] {
  // Order is priority. Only configured providers appear, so the chain adapts
  // to whichever keys exist.
  const all: Provider[] = [
    {
      id: "groq",
      label: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
      jsonMode: "none",
      lowReasoning: true,
    },
    {
      id: "gemini",
      label: "Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      jsonMode: "object",
    },
    {
      id: "mistral",
      label: "Mistral",
      baseUrl: "https://api.mistral.ai/v1",
      apiKey: process.env.MISTRAL_API_KEY,
      model: process.env.MISTRAL_MODEL ?? "mistral-small-latest",
      jsonMode: "object",
    },
    {
      id: "sambanova",
      label: "SambaNova",
      baseUrl: "https://api.sambanova.ai/v1",
      apiKey: process.env.SAMBANOVA_API_KEY,
      model: process.env.SAMBANOVA_MODEL ?? "Meta-Llama-3.3-70B-Instruct",
      jsonMode: "object",
    },
    {
      id: "openrouter",
      label: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free",
      jsonMode: "object",
      headers: {
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "Tracko",
      },
    },
    {
      id: "cerebras",
      label: "Cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      apiKey: process.env.CEREBRAS_API_KEY,
      model: process.env.CEREBRAS_MODEL ?? "gpt-oss-120b",
      jsonMode: "object",
    },
  ];
  const live = all.filter((p) => Boolean(p.apiKey));
  if (purpose !== "chat") return live;
  return [...live].sort((a, b) => CHAT_ORDER.indexOf(a.id) - CHAT_ORDER.indexOf(b.id));
}

export const coachConfigured = () => providers().length > 0;
export const coachProviderNames = () => providers().map((p) => p.label);
export const chatConfigured = () => providers("chat").length > 0;
export const chatProviderNames = () => providers("chat").map((p) => p.label);

/**
 * Free-form reply for the chat companion. Plain text out — no JSON to coax,
 * because a malformed answer here would mean silence rather than a fallback.
 */
export async function chatComplete(
  messages: ChatTurn[],
): Promise<{ text: string; provider: string } | null> {
  for (const p of providers("chat")) {
    try {
      const raw = await callProviderRaw(p, messages, {
        maxTokens: 700,
        temperature: 0.85,
        timeoutMs: 20_000,
        forcePlainText: true,
      });
      const text = raw.trim();
      if (text) return { text, provider: p.label };
    } catch (err) {
      console.error(`[chat] ${p.label} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

type CallOpts = {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Chat wants prose, so never ask for JSON mode. */
  forcePlainText?: boolean;
};

async function callProvider(
  p: Provider,
  system: string,
  user: string,
  opts: CallOpts = {},
): Promise<string> {
  return callProviderRaw(
    p,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    opts,
  );
}

export type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

async function callProviderRaw(
  p: Provider,
  messages: ChatTurn[],
  opts: CallOpts = {},
): Promise<string> {
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${p.apiKey}`,
      ...p.headers,
    },
    body: JSON.stringify({
      model: p.model,
      messages,
      // Warmth and variety matter more than precision for one-liners.
      temperature: opts.temperature ?? 0.9,
      max_tokens: opts.maxTokens ?? 4000,
      ...(p.lowReasoning ? { reasoning_effort: "low" } : {}),
      ...(p.jsonMode === "object" && !opts.forcePlainText
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 45_000),
  });

  if (!res.ok) {
    throw new Error(`${p.label} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error(`${p.label} returned no content`);
  return content;
}

/** Models sometimes wrap JSON in a markdown fence despite being asked not to. */
function parseLoose(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? raw).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in response");
  return JSON.parse(body.slice(start, end + 1));
}

// ---------------------------------------------------------------- context

export type CoachContext = ReturnType<typeof buildCoachContext>;

export function buildCoachContext(s: AppState) {
  const outstanding = s.todayScore.perHabit
    .filter((p) => !p.done)
    .slice(0, 4)
    .map((p) => p.habit.name);

  const ranked = [...s.stats].sort((a, b) => b.pct - a.pct);

  // Deliberately minimal — her first name is useful for the lines; nothing
  // else identifying needs to leave the server.
  return {
    name: s.config.heroName || null,
    dayNumber: s.totals.daysElapsed,
    totalDays: s.config.totalDays,
    daysLeft: s.totals.daysLeft,
    currentStreak: s.totals.currentStreak,
    longestStreak: s.totals.longestStreak,
    daysDone: s.totals.daysDone,
    perfectDays: s.totals.perfectDays,
    missedDays: s.totals.missedDays,
    habitsOutstandingToday: outstanding,
    steadiestHabit: ranked[0]?.habit.name ?? null,
    shakiestHabit: ranked[ranked.length - 1]?.habit.name ?? null,
  };
}

const SYSTEM = `You write one-line push notifications for a habit-tracking app's mascot, a small cloud character called Nimbus.

The user is doing a 100-day challenge: ten small daily habits, one tick each. Nobody is paying her and there is no prize — she is doing it for herself.

Hard rules:
- Maximum 14 words. Shorter is better. They must sound like a person speaking.
- NO exclamation marks. No "you've got this", "keep it up", "great job", "let's go".
- NO poetry. No dew, no tea, no metaphors about clouds or dawn or journeys. Plain spoken English.
- Reference the real numbers you're given when it makes a line land harder. Don't stuff every line with statistics.
- Dry, warm, a bit funny. A friend on the sofa, not a coach with a whistle.
- Vary the rhythm. Some lines nudge, some joke, some just observe.
- Use her name at most one line in four. If no name is given, never invent one.

Good: "Water and skincare are the easy two. Start there."
Good: "Twelve days in a row. Would be a shame."
Bad: "Good morning! The day is fresh and your habits await!"
Bad: "The night's quiet, yet some checkboxes are still humming."

Write exactly 3 lines for each of these 2 situations:
- morning: the morning reminder, before anything is ticked
- evening: the evening reminder, with some habits still open

Choose the mood that matches each line, from: happy, hype, proud, worried, sleepy, cheeky.

Reply with JSON only, no prose and no code fence, in exactly this shape:
{"lines":[{"situation":"morning","text":"...","mood":"happy"}]}`;

// ---------------------------------------------------------------- generate

export type GenerateResult =
  | { ok: true; pack: CoachPack; provider: string }
  | { ok: false; errors: string[] };

export async function generateCoachPack(
  ctx: CoachContext,
  day: string,
): Promise<GenerateResult> {
  const chain = providers();
  if (!chain.length) return { ok: false, errors: ["No provider API key is set"] };

  const user = `Here is where she stands today. Write the 6 lines.\n\n${JSON.stringify(ctx, null, 2)}`;
  const errors: string[] = [];

  for (const p of chain) {
    try {
      const raw = await callProvider(p, SYSTEM, user);
      const parsed = PackSchema.safeParse(parseLoose(raw));
      if (!parsed.success) {
        errors.push(`${p.label}: response failed validation`);
        continue;
      }

      const lines = parsed.data.lines.filter((l): l is CoachLine =>
        SITUATIONS.includes(l.situation),
      );
      if (!lines.length) {
        errors.push(`${p.label}: no usable lines`);
        continue;
      }

      return {
        ok: true,
        provider: p.label,
        pack: { day, lines, createdAt: new Date().toISOString(), provider: p.label },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      console.error(`[coach] ${p.label} failed:`, message);
    }
  }

  return { ok: false, errors };
}

/** Deterministic pick so the same situation doesn't reshuffle on every render. */
export function pickLine(
  pack: CoachPack | null,
  situation: Situation,
  seed: number,
): CoachLine | null {
  if (!pack) return null;
  const matches = pack.lines.filter((l) => l.situation === situation);
  if (!matches.length) return null;
  return matches[Math.abs(seed) % matches.length];
}
