/**
 * Builds the social preview image (`public/og-default.jpg`).
 *
 * Shared links had no `og:image` at all, so every WhatsApp or Instagram share
 * rendered as a bare text link. Runs in `prebuild`, next to gen-media-index, so
 * the file exists before Vite copies `public/` into `dist/`.
 *
 * The source is whatever `site.json` lists as the hero, and the crop honours
 * the same `hero.position` the site uses for that image — otherwise a portrait
 * cropped to a 1.91:1 banner cuts the face off. Change the photo in site.json
 * and the preview follows on the next build.
 *
 *   node scripts/gen-og-images.mjs
 */
import sharp from "sharp";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

/** Facebook, WhatsApp, LinkedIn and X all render 1200x630 (1.91:1). */
const WIDTH = 1200;
const HEIGHT = 630;
const RATIO = WIDTH / HEIGHT;

/** WhatsApp in particular is unreliable above ~300 kB. */
const MAX_BYTES = 300 * 1024;

/** `"50% 0%"` -> `{ x: 0.5, y: 0 }`; anything unparseable centres the crop. */
function parsePosition(value) {
  const parts = String(value ?? "").trim().split(/\s+/);
  const toFraction = (part, fallback) => {
    const match = /^(-?[\d.]+)%$/.exec(part ?? "");
    if (!match) return fallback;
    return Math.min(1, Math.max(0, Number(match[1]) / 100));
  };
  return { x: toFraction(parts[0], 0.5), y: toFraction(parts[1], 0.5) };
}

async function readSiteJson() {
  try {
    const raw = await readFile(join(PUBLIC, "content", "site.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function build() {
  const site = await readSiteJson();
  const source = site.hero?.image ?? "/media/images/hero-main.jpg";
  const position = parsePosition(site.hero?.position);
  const input = join(PUBLIC, source.replace(/^\//, ""));

  const image = sharp(input);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`no se pudieron leer las dimensiones de ${source}`);

  // Take the largest region of the source that already has the target ratio,
  // sliding it along the axis that has slack towards the focal point.
  let cropWidth;
  let cropHeight;
  let left;
  let top;
  if (width / height > RATIO) {
    cropHeight = height;
    cropWidth = Math.round(cropHeight * RATIO);
    left = Math.round((width - cropWidth) * position.x);
    top = 0;
  } else {
    cropWidth = width;
    cropHeight = Math.round(cropWidth / RATIO);
    left = 0;
    top = Math.round((height - cropHeight) * position.y);
  }

  const target = join(PUBLIC, "og-default.jpg");

  // Step the quality down only as far as the size cap requires.
  let bytes = Infinity;
  let quality = 86;
  while (quality >= 60) {
    await sharp(input)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .resize(WIDTH, HEIGHT, { fit: "cover" })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(target);
    bytes = (await stat(target)).size;
    if (bytes <= MAX_BYTES) break;
    quality -= 6;
  }

  console.log(
    `og-default.jpg: ${WIDTH}x${HEIGHT} · ${(bytes / 1024).toFixed(0)} kB · calidad ${quality}\n` +
      `  origen ${source} (${width}x${height}), encuadre ${site.hero?.position ?? "centrado"}` +
      ` -> recorte ${cropWidth}x${cropHeight} desde (${left}, ${top})`,
  );

  if (bytes > MAX_BYTES) {
    throw new Error(
      `og-default.jpg pesa ${(bytes / 1024).toFixed(0)} kB, por encima del límite de 300 kB`,
    );
  }
}

build().catch((error) => {
  console.error(`\nNo se pudo generar la imagen social:\n  ${error.message}\n`);
  process.exit(1);
});
