import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import {
  MAX_INPUT_CHARS,
  MAX_MESSAGES_PER_DAY,
  buildChatSystem,
  guardInput,
  toProviderMessages,
} from "@/lib/chat";
import { chatComplete, chatConfigured } from "@/lib/coach";
import { db } from "@/lib/db";
import { loadState } from "@/lib/state";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export async function POST(req: Request) {
  // Only she can talk to Nimbus. The sponsor has his own thread with her.
  const role = await currentRole();
  if (role !== "hero") return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!chatConfigured()) {
    return NextResponse.json({ error: "No provider key is set." }, { status: 400 });
  }

  const { message } = (await req.json()) as { message?: string };
  const text = (message ?? "").trim().slice(0, MAX_INPUT_CHARS);
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const store = db();
  const s = await loadState();
  const history = (await store.read()).chat;

  const sentToday = history.filter(
    (m) => m.who === "her" && m.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
  ).length;
  if (sentToday >= MAX_MESSAGES_PER_DAY) {
    return NextResponse.json(
      { error: "That's a lot of talking for one day. Back tomorrow." },
      { status: 429 },
    );
  }

  const now = new Date().toISOString();
  const herMessage: ChatMessage = { id: id("c"), who: "her", body: text, createdAt: now };

  // Distress is handled here, deterministically, before any model is involved.
  const guard = guardInput(text, s.config.sponsorName);
  if (guard.kind === "blocked") {
    const reply: ChatMessage = {
      id: id("c"),
      who: "nimbus",
      body: guard.reply,
      createdAt: new Date().toISOString(),
    };
    await store.addChatMessages([herMessage, reply]);
    return NextResponse.json({ reply, sensitive: true });
  }

  const answer = await chatComplete(
    toProviderMessages(buildChatSystem(s), history, text),
  );
  if (!answer) {
    await store.addChatMessages([herMessage]);
    return NextResponse.json({ error: "Nimbus is offline. Try again in a moment." }, { status: 502 });
  }

  const reply: ChatMessage = {
    id: id("c"),
    who: "nimbus",
    body: answer.text.slice(0, 1500),
    createdAt: new Date().toISOString(),
  };
  await store.addChatMessages([herMessage, reply]);
  return NextResponse.json({ reply, provider: answer.provider });
}

export async function DELETE() {
  const role = await currentRole();
  if (role !== "hero") return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  await db().clearChat();
  return NextResponse.json({ ok: true });
}
