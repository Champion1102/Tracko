import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { subscription } = (await req.json()) as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }

  await db().savePushSub({ role, endpoint, p256dh, auth });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { endpoint } = (await req.json()) as { endpoint?: string };
  if (endpoint) await db().removePushSub(endpoint);
  return NextResponse.json({ ok: true });
}
