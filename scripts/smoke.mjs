import { SignJWT } from "jose";

const secret = new TextEncoder().encode(
  (process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me").padEnd(32, "."),
);
const token = await new SignJWT({ role: "hero" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(secret);
const sponsorToken = await new SignJWT({ role: "sponsor" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(secret);

// The hero routes are gated behind onboarding, so mark her done first.
await fetch("http://localhost:3111/welcome", { headers: { cookie: `tracko_session=${token}` } });

const pages = [
  ["hero", "/welcome"],
  ["hero", "/today"], ["hero", "/journey"], ["hero", "/reward"],
  ["hero", "/stats"], ["hero", "/settings"], ["sponsor", "/sponsor"],
  ["hero", "/chat"],
  ["hero", "/api/photos"], ["hero", "/api/characters"], ["hero", "/api/photos?all=1"],
];

for (const [role, path] of pages) {
  const res = await fetch(`http://localhost:3111${path}`, {
    headers: { cookie: `tracko_session=${role === "hero" ? token : sponsorToken}` },
    redirect: "manual",
  });
  const body = await res.text();
  const broken = /Application error|Unhandled Runtime|digest:/.test(body);
  console.log(`${res.status} ${path.padEnd(16)} ${broken ? "❌ RENDER ERROR" : "ok"} (${body.length} bytes)`);
}
