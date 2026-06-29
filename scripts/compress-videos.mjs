/**
 * Comprime los reels de /public/media/video para que carguen rápido en móvil.
 *
 * Qué hace a cada .mp4:
 *   - Reescala a 720px de alto máx. (suficiente: la celda del carrusel mide ~350px).
 *   - Recodifica en H.264 CRF 27 (~60-80% menos peso, sin pérdida visible).
 *   - Mueve el `moov atom` al inicio (+faststart) → el navegador reproduce
 *     ANTES de terminar de descargar, en vez de bajar el archivo completo.
 *   - Quita el audio (-an): en el carrusel los videos van en `muted`.
 *
 * IMPORTANTE: la salida (.video-optimized/) y los respaldos (.video-backup/)
 * viven FUERA de public/ a propósito — si estuvieran dentro, Vite los copiaría
 * a dist/ y se desplegarían como peso muerto. Ambas carpetas están en .gitignore.
 *
 * Requiere ffmpeg en el PATH (https://ffmpeg.org/download.html).
 *
 * Uso:
 *   node scripts/compress-videos.mjs            # escribe en .video-optimized/
 *   node scripts/compress-videos.mjs --replace  # reemplaza los originales (respaldo en .video-backup/)
 *   node scripts/compress-videos.mjs --webm     # además genera un .webm (VP9)
 */
import { readdir, mkdir, copyFile } from "node:fs/promises";
import { resolve, dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const videoDir = join(root, "public", "media", "video");
const outDir = join(root, ".video-optimized");   // fuera de public/
const backupDir = join(root, ".video-backup");    // fuera de public/

const replace = process.argv.includes("--replace");
const webm = process.argv.includes("--webm");

const MAX_HEIGHT = 1280; // 720x1280 para 9:16; baja a 960 si quieres aún más ligero
const CRF = 27; // 23 = más calidad/peso, 30 = más ligero

function has(cmd) {
  const r = spawnSync(cmd, ["-version"], { stdio: "ignore", shell: process.platform === "win32" });
  return r.status === 0;
}

function run(args) {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error(`ffmpeg falló: ${args.join(" ")}`);
}

if (!has("ffmpeg")) {
  console.error("✖ ffmpeg no está en el PATH. Instálalo: https://ffmpeg.org/download.html");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const files = (await readdir(videoDir)).filter((f) => /^reel-.*\.mp4$/i.test(f));

if (files.length === 0) {
  console.log("No se encontraron reel-*.mp4 en", videoDir);
  process.exit(0);
}

// scale: limita la altura a MAX_HEIGHT solo si el original es más alto; ancho par.
const vf = `scale=-2:'min(${MAX_HEIGHT},ih)':flags=lanczos`;

for (const f of files) {
  const src = join(videoDir, f);
  const { name } = parse(f);
  const dst = join(outDir, `${name}.mp4`);
  console.log(`\n▶ ${f}`);
  run([
    "-y", "-i", src,
    "-vf", vf,
    "-c:v", "libx264", "-crf", String(CRF), "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-an",
    dst,
  ]);

  if (webm) {
    const dstWebm = join(outDir, `${name}.webm`);
    run([
      "-y", "-i", src,
      "-vf", vf,
      "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1",
      "-an",
      dstWebm,
    ]);
  }
}

if (replace) {
  await mkdir(backupDir, { recursive: true });
  for (const f of files) {
    const src = join(videoDir, f);
    const opt = join(outDir, f);
    await copyFile(src, join(backupDir, f)); // respaldo del original FUERA de public/
    await copyFile(opt, src);                // sobrescribe con la versión optimizada
  }
  console.log(`\n✔ Originales reemplazados. Respaldo en ${backupDir}`);
} else {
  console.log(`\n✔ Listo. Revisa ${outDir} y corre con --replace cuando estés conforme.`);
}
