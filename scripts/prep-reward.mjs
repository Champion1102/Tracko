/**
 * Product shots come on white, which looks like a sticker stuck on a dark app.
 * Knock the near-white background out to transparent, trim the margins, and
 * square it up.
 *
 *   node scripts/prep-reward.mjs <source-image> [output]
 */
import sharp from "sharp";

const [, , src, out = "public/reward.png"] = process.argv;
if (!src) {
  console.error("usage: node scripts/prep-reward.mjs <source-image> [output]");
  process.exit(1);
}

const WHITE = 242; // lighter than this on every channel becomes transparent
const FEATHER = 24; // soften the boundary so edges aren't jagged

const image = sharp(src).ensureAlpha();
const { width, height } = await image.metadata();
const raw = await image.raw().toBuffer();

for (let i = 0; i < raw.length; i += 4) {
  const lowest = Math.min(raw[i], raw[i + 1], raw[i + 2]);
  if (lowest >= WHITE) raw[i + 3] = 0;
  else if (lowest >= WHITE - FEATHER) {
    raw[i + 3] = Math.round(((WHITE - lowest) / FEATHER) * 255);
  }
}

await sharp(raw, { raw: { width, height, channels: 4 } })
  .png()
  .trim({ threshold: 1 })
  .resize(900, 900, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toFile(out);

console.log(`wrote ${out}`);
