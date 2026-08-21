import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { pushConfigured, sendPush } from "@/lib/push";

export async function POST() {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!pushConfigured()) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 400 });
  }

  const sent = await sendPush(role, {
    title: "Notifications are working 🎉",
    body: "This is exactly how your daily reminders will look.",
    url: "/today",
    tag: "test",
  });

  return NextResponse.json({ ok: true, sent });
}
