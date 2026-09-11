/**
 * Copies the Sveltia CMS bundle into `public/admin/`.
 *
 * Vendored rather than loaded from a CDN because the site's CSP is
 * `script-src 'self'` by HTTP header, and a CDN would need that relaxed for
 * every page on the site. Serving it from our own origin keeps the policy
 * untouched. The version is pinned in package.json, so the bundle is
 * reproducible instead of "whatever the CDN served that day".
 *
 * The output is gitignored and regenerated on every build; only the version in
 * package.json is tracked.
 *
 *   node scripts/vendor-cms.mjs
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "node_modules", "@sveltia", "cms", "dist", "sveltia-cms.js");
const TARGET_DIR = join(ROOT, "public", "admin");
const TARGET = join(TARGET_DIR, "sveltia-cms.js");

try {
  await stat(SOURCE);
} catch {
  throw new Error(
    `No se encontró el bundle del CMS en ${SOURCE}.\nEjecuta: npm install`,
  );
}

await mkdir(TARGET_DIR, { recursive: true });
await copyFile(SOURCE, TARGET);

const { size } = await stat(TARGET);
const { version } = JSON.parse(
  await (await import("node:fs/promises")).readFile(
    join(ROOT, "node_modules", "@sveltia", "cms", "package.json"),
    "utf8",
  ),
);
console.log(`sveltia-cms.js: v${version}, ${(size / 1024 / 1024).toFixed(1)} MB`);
