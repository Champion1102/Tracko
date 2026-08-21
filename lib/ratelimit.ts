/**
 * In-memory login throttle. Keyed by client IP: five wrong PINs inside the
 * window locks that IP out for fifteen minutes; a correct PIN clears it.
 *
 * In-memory is deliberate and sufficient here — this is a two-person app, and
 * the limiter only has to make online brute force infeasible, which even a
 * per-instance counter does once PINs are six digits (a million combinations
 * capped at ~20 tries an hour). If this ever runs across many instances at
 * scale, move the counter into the store; the interface here won't change.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type Bucket = { count: number; first: number; lockedUntil: number };
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow without bound. Cheap: it only
// runs on access and only drops fully-expired entries.
function sweep(now: number) {
  if (buckets.size < 512) return;
  for (const [key, b] of buckets) {
    if (b.lockedUntil < now && now - b.first > WINDOW_MS) buckets.delete(key);
  }
}

export type RateResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/** Check-and-count one attempt. Call before verifying the PIN. */
export function takeAttempt(key: string, now = Date.now()): RateResult {
  sweep(now);
  const b = buckets.get(key);

  if (!b) {
    buckets.set(key, { count: 1, first: now, lockedUntil: 0 });
    return { ok: true };
  }

  if (b.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((b.lockedUntil - now) / 1000) };
  }

  // Window elapsed with no lock — start a fresh window.
  if (now - b.first > WINDOW_MS) {
    buckets.set(key, { count: 1, first: now, lockedUntil: 0 });
    return { ok: true };
  }

  b.count += 1;
  if (b.count > MAX_ATTEMPTS) {
    b.lockedUntil = now + WINDOW_MS;
    return { ok: false, retryAfterSec: Math.ceil(WINDOW_MS / 1000) };
  }
  return { ok: true };
}

/** Clear the bucket for a key after a successful login. */
export function clearAttempts(key: string) {
  buckets.delete(key);
}

// (in-memory buckets reset whenever this module is reloaded)
