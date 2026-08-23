import webpush from "web-push";
import { db } from "./db";
import type { PushSub, Role } from "./types";

let configured: boolean | null = null;

function ensure(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:tracko@example.com";
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Fire-and-forget. Dead subscriptions are pruned as we discover them.
 *  Pass `subs` when the caller already has them — it saves a full db read. */
export async function sendPush(role: Role, payload: PushPayload, subs?: PushSub[]): Promise<number> {
  if (!ensure()) return 0;
  const store = db();
  const pushSubs = subs ?? (await store.read()).pushSubs;
  const targets = pushSubs.filter((s) => s.role === role);
  let sent = 0;

  await Promise.all(
    targets.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await store.removePushSub(s.endpoint);
      }
    }),
  );

  return sent;
}

export const pushConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
