import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const svg = (size, rounded) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#241C4E"/>
      <stop offset="55%" stop-color="#120F26"/>
      <stop offset="100%" stop-color="#0A0912"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE39A"/>
      <stop offset="50%" stop-color="#FFC24B"/>
      <stop offset="100%" stop-color="#C98A16"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="168" fill="none" stroke="url(#gold)" stroke-width="20" opacity="0.9"/>
  <circle cx="256" cy="256" r="168" fill="none" stroke="#58CC02" stroke-width="20"
          stroke-linecap="round" stroke-dasharray="1055" stroke-dashoffset="264"
          transform="rotate(-90 256 256)"/>
  <path d="M176 262 l52 54 108 -122" fill="none" stroke="#F4F2FF" stroke-width="38"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

mkdirSync("public/icons", { recursive: true });

for (const [size, name, rounded] of [
  [192, "icon-192.png", true],
  [512, "icon-512.png", true],
  [180, "apple-touch-icon.png", false],
  [96, "badge.png", true],
]) {
  await sharp(Buffer.from(svg(size, rounded))).resize(size, size).png().toFile(`public/icons/${name}`);
}

// Maskable needs its content inside the safe circle, so pad the artwork.
await sharp(Buffer.from(svg(512, false)))
  .resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#0A0912" })
  .png()
  .toFile("public/icons/maskable-512.png");

writeFileSync("public/icons/icon.svg", svg(512, true));
console.log("icons written");
