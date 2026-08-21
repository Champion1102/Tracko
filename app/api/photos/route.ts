import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { diffDays, todayInTz } from "@/lib/dates";
import type { Photo } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Today's photos by default; `?all=1` for the whole gallery. */
export async function GET(req: Request) {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const all = new URL(req.url).searchParams.get("all") === "1";
  const store = db();
  const { photos, config } = await store.read();
  const today = todayInTz(config.timezone);

  const wanted = all ? [...photos].reverse() : photos.filter((p) => p.day === today);

  // Signed URLs expire, so they're minted per request rather than stored.
  const withUrls = await Promise.all(
    wanted.map(async (p) => ({ id: p.id, day: p.day, url: await store.photoUrl(p) })),
  );

  return NextResponse.json({
    photos: withUrls.filter((p) => p.url),
    max: config.photoMaxPerDay,
    bonusPoints: config.photoBonusPoints,
  });
}

export async function POST(req: Request) {
  const role = await currentRole();
  if (role !== "hero") return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Images only (JPEG, PNG or WebP)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That image is too big" }, { status: 413 });
  }

  const store = db();
  const { photos, config } = await store.read();
  const today = todayInTz(config.timezone);

  const day = String(form.get("day") ?? today);
  // Same window as habit logging: today, or yesterday until it locks.
  const delta = diffDays(day, today);
  if (delta < 0 || delta > 1) {
    return NextResponse.json({ error: "You can only add photos for today or yesterday" }, { status: 400 });
  }

  if (photos.filter((p) => p.day === day).length >= config.photoMaxPerDay) {
    return NextResponse.json(
      { error: `That's the ${config.photoMaxPerDay} for the day.` },
      { status: 409 },
    );
  }

  const id = `ph_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const photo: Photo = {
    id,
    day,
    path: `${day}/${id}.${ext}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    await store.addPhoto(photo, bytes, file.type);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    photo: { id, day, url: await store.photoUrl(photo) },
  });
}

export async function DELETE(req: Request) {
  const role = await currentRole();
  if (role !== "hero") return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });

  await db().deletePhoto(id);
  return NextResponse.json({ ok: true });
}
