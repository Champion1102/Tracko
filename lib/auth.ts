import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./types";

const COOKIE = "tracko_session";
const MAX_AGE = 60 * 60 * 24 * 180; // the whole challenge, plus slack

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(s.padEnd(32, "."));
}

export function pinFor(role: Role): string {
  return role === "hero"
    ? (process.env.HERO_PIN ?? "1234")
    : (process.env.SPONSOR_PIN ?? "4321");
}

export function roleForPin(pin: string): Role | null {
  const clean = pin.trim();
  if (clean.length === 0) return null;
  if (clean === pinFor("hero")) return "hero";
  if (clean === pinFor("sponsor")) return "sponsor";
  return null;
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
