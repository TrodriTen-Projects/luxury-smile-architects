/**
 * Writes `dist/sitemap.xml` from the same route list the prerenderer uses, so
 * the sitemap can never list a page that was not built (or miss one that was).
 *
 * Before this, `/sitemap.xml` answered `200` with the HTML of the homepage,
 * because the SPA fallback rewrote every unmatched path. Search Console would
 * have read that as a malformed sitemap.
 *
 * `lastmod` comes from each prerendered file's mtime rather than from "now", so
 * a rebuild that changes nothing does not claim every page was just updated.
 *
 *   node scripts/gen-sitemap.mjs
 */
import { writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTES, ORIGIN, outputFileFor } from "./routes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );
}

async function lastModified(routePath) {
  try {
    const { mtime } = await stat(join(DIST, outputFileFor(routePath)));
    return mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const entries = [];
for (const route of ROUTES) {
  entries.push(
    [
      "  <url>",
      `    <loc>${escapeXml(ORIGIN + route.path)}</loc>`,
      `    <lastmod>${await lastModified(route.path)}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      "  </url>",
    ].join("\n"),
  );
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries,
  "</urlset>",
  "",
].join("\n");

await writeFile(join(DIST, "sitemap.xml"), xml, "utf8");
console.log(`sitemap.xml: ${ROUTES.length} URL(s)`);
