import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Whatever .riv files are sitting in public/characters. Dropping a new file in
 * is the entire install step — no config, no rebuild.
 */
export async function GET() {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const dir = path.join(process.cwd(), "public", "characters");
  try {
    const files = await fs.readdir(dir);
    const characters = files
      .filter((f) => f.toLowerCase().endsWith(".riv"))
      .sort()
      .map((file) => ({
        file: `/characters/${file}`,
        name: file
          .replace(/\.riv$/i, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
    return NextResponse.json({ characters });
  } catch {
    return NextResponse.json({ characters: [] });
  }
}
