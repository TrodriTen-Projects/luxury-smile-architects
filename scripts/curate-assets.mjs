/**
 * Curates the real WhatsApp assets into /public/media with clean names.
 *   node scripts/curate-assets.mjs
 * Images are re-encoded/optimised; the stacked before/after is split into a
 * slider pair; videos are copied as reel-01..NN.mp4.
 */
import { mkdir, copyFile, readdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, ".incoming");
const IMG_OUT = join(root, "public", "media", "images");
const VID_OUT = join(root, "public", "media", "video");
const RES_OUT = join(root, "public", "media", "results");

await mkdir(IMG_OUT, { recursive: true });
await mkdir(VID_OUT, { recursive: true });
await mkdir(RES_OUT, { recursive: true });

const IMAGES = [
  ["WhatsApp Image 2026-06-15 at 9.42.14 AM.jpeg", "smile-01.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.14 AM (1).jpeg", "ortho-01.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.14 AM (2).jpeg", "smile-02.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.14 AM (3).jpeg", "case-financiacion.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.14 AM (4).jpeg", "portrait-01.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.15 AM.jpeg", "ortho-02.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.15 AM (1).jpeg", "case-veneers.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.15 AM (2).jpeg", "logo-financiacion.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.15 AM (3).jpeg", "smile-03.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.15 AM (4).jpeg", "case-implant.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.15 AM (5).jpeg", "smile-04.jpg"],
  ["WhatsApp Image 2026-06-15 at 9.42.15 AM (6).jpeg", "smile-05.jpg"],
];

for (const [src, out] of IMAGES) {
  await sharp(join(SRC, src))
    .rotate()
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(IMG_OUT, out));
  console.log("img ✓", out);
}

// Split the clean veneers case (top = after / bottom = before) for the slider.
{
  const input = join(SRC, "WhatsApp Image 2026-06-15 at 9.42.15 AM (1).jpeg");
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 1200;
  const h = meta.height ?? 1200;
  const half = Math.floor(h / 2);
  await sharp(input)
    .extract({ left: 0, top: 0, width: w, height: half })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(join(RES_OUT, "veneers-after.jpg"));
  await sharp(input)
    .extract({ left: 0, top: half, width: w, height: h - half })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(join(RES_OUT, "veneers-before.jpg"));
  console.log("split ✓ veneers before/after");
}

// Videos -> reel-01..NN.mp4 (sorted by name)
const vids = (await readdir(SRC))
  .filter((f) => f.toLowerCase().endsWith(".mp4"))
  .sort();
let i = 1;
for (const v of vids) {
  const out = `reel-${String(i).padStart(2, "0")}.mp4`;
  await copyFile(join(SRC, v), join(VID_OUT, out));
  console.log("vid ✓", out);
  i++;
}

console.log(`\nDone: ${IMAGES.length} images, 2 split frames, ${vids.length} videos.`);
