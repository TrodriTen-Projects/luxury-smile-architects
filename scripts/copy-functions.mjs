/**
 * Copies `functions/` into `dist/functions/`.
 *
 * The CI uploads only `dist` as its build artifact and deploys that directory,
 * and `wrangler pages deploy dist` looks for Functions at `dist/functions`.
 * Without this step the OAuth endpoints and the /admin page would simply not
 * exist in production — `/admin` would 404 and nobody could log into the CMS.
 *
 *   node scripts/copy-functions.mjs
 */
import { cp, stat, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "functions");
const TARGET = join(ROOT, "dist", "functions");

try {
  await stat(SOURCE);
} catch {
  console.log("functions/: no existe, nada que copiar");
  process.exit(0);
}

await cp(SOURCE, TARGET, { recursive: true });

async function list(dir, prefix = "") {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await list(path, `${prefix}${entry.name}/`)));
    else found.push(`${prefix}${entry.name}`);
  }
  return found;
}

const files = await list(TARGET);
console.log(`functions: ${files.length} archivo(s) -> dist/functions`);
for (const file of files) console.log(`  /${file.replace(/\/index\.js$/, "").replace(/\.js$/, "")}`);
