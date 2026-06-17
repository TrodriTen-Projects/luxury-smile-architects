/**
 * Auto-indexes image folders so you only need to DROP files in them
 * (no need to edit site.json). Generates an index.json per folder.
 * Runs automatically on `npm run dev` and `npm run build` (pre-scripts).
 *   node scripts/gen-media-index.mjs
 */
import { readdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public");

// Folders (relative to /public) to index as a flat list of file URLs.
const TARGETS = [
  { rel: "media/patients", re: /\.(jpe?g|png|webp|avif|gif)$/i },
  { rel: "media/video", re: /^reel-.*\.(mp4|webm|mov|m4v)$/i },
];

for (const { rel, re } of TARGETS) {
  const dir = join(publicDir, rel);
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    continue; // folder doesn't exist yet
  }
  const urls = files
    .filter((f) => re.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .map((f) => `/${rel}/${f}`);
  await writeFile(join(dir, "index.json"), JSON.stringify(urls, null, 2) + "\n", "utf8");
  console.log(`${rel}: ${urls.length} archivo(s) indexado(s)`);
}
