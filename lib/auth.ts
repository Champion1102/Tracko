import { cookies } from "next/headers";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import type { Config, Role } from "./types";

const scrypt = promisify(scryptCb);

const COOKIE = "tracko_session";
const MAX_AGE = 60 * 60 * 24 * 180; // the whole challenge, plus slack
const DEV_SECRET = "dev-only-insecure-secret-change-me";

/** PIN rules for a PIN she (or he) sets themselves. */
export const PIN_MIN = 6;
export const PIN_MAX = 8;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  // Fail closed in production. A missing secret there means the fallback below
  // — which is public in the repo — would sign every session, letting anyone
  // forge a cookie and skip the PIN entirely. Better a hard boot error.
  if (process.env.NODE_ENV === "production" && (!s || s === DEV_SECRET || s.length < 16)) {
    throw new Error(
      "AUTH_SECRET is missing or too weak in production. Set a long random value.",
    );
  }
  return new TextEncoder().encode((s ?? DEV_SECRET).padEnd(32, "."));
}

/** The bootstrap PIN for a role, from the environment. Used only until they
 *  set their own; after that the hash in config wins. */
function bootstrapPin(role: Role): string {
  return role === "hero"
    ? (process.env.HERO_PIN ?? "142536")
    : (process.env.SPONSOR_PIN ?? "635241");
}

function configHash(config: Config, role: Role): string | null {
  return role === "hero" ? config.heroPinHash : config.sponsorPinHash;
}

/** True while this role is still using the environment bootstrap PIN. */
export function needsPinSetup(config: Config, role: Role): boolean {
  return !configHash(config, role);
}

export function validatePin(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return "Digits only.";
  if (pin.length < PIN_MIN || pin.length > PIN_MAX) {
    return `Use ${PIN_MIN} to ${PIN_MAX} digits.`;
  }
  // A run of one digit or a straight sequence is barely a PIN at all.
  if (/^(\d)\1+$/.test(pin)) return "Too simple — vary the digits.";
  if ("0123456789".includes(pin) || "9876543210".includes(pin)) {
    return "Too simple — avoid a straight run.";
  }
  return null;
}

async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(pin, salt, 32)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyHash(pin: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scrypt(pin, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Constant-time string equality, so a wrong bootstrap PIN can't be teased out
 *  a character at a time by timing the response. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Resolve a PIN to a role. For each role: if they've set their own PIN, check
 * it against the stored hash; otherwise fall back to the environment bootstrap
 * PIN. Both branches are constant-time.
 */
export async function verifyPin(pin: string): Promise<Role | null> {
  const clean = pin.trim();
  if (!clean) return null;
  const { config } = await db().read();

  for (const role of ["hero", "sponsor"] as const) {
    const hash = configHash(config, role);
    const ok = hash ? await verifyHash(clean, hash) : safeEqual(clean, bootstrapPin(role));
    if (ok) return role;
  }
  return null;
}

/** Persist a self-chosen PIN for a role. Caller must already be authenticated
 *  as that role. */
export async function setPin(role: Role, pin: string): Promise<void> {
  const hash = await hashPin(pin.trim());
  await db().patchConfig(role === "hero" ? { heroPinHash: hash } : { sponsorPinHash: hash });
}

export async function startSession(role: Role) {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentRole(): Promise<Role | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const role = payload.role;
    return role === "hero" || role === "sponsor" ? role : null;
  } catch {
    return null;
  }
}
