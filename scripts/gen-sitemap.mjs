/**
 * Writes `dist/sitemap.xml` from the same page list the prerenderer uses, so
 * the sitemap can never list a page that was not built (or miss one that was).
 *
 * Before this, `/sitemap.xml` answered `200` with the HTML of the homepage,
 * because the SPA fallback rewrote every unmatched path. Search Console would
 * have read that as a malformed sitemap.
 *
 * Every URL carries the `xhtml:link` alternates for its language pair. Google
 * requires each version to point at *all* of them, itself included, or it
 * discards the grouping — so the annotations are emitted from the same table
 * that generates the pages rather than written by hand.
 *
 * `lastmod` comes from each prerendered file's mtime rather than from "now", so
 * a rebuild that changes nothing does not claim every page was just updated.
 *
 *   node scripts/gen-sitemap.mjs
 */
import { writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PAGES, LOCALES, DEFAULT_LOCALE, ORIGIN, outputFileFor } from "./routes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

/** BCP 47 tags. Keep in step with HREFLANG in src/lib/seo.ts. */
const HREFLANG = { es: "es-ES", en: "en" };

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
for (const page of PAGES) {
  const alternates = [
    ...LOCALES.map(
      (locale) =>
        `    <xhtml:link rel="alternate" hreflang="${HREFLANG[locale]}" ` +
        `href="${escapeXml(ORIGIN + page.paths[locale])}"/>`,
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" ` +
      `href="${escapeXml(ORIGIN + page.paths[DEFAULT_LOCALE])}"/>`,
  ];

  for (const locale of LOCALES) {
    entries.push(
      [
        "  <url>",
        `    <loc>${escapeXml(ORIGIN + page.paths[locale])}</loc>`,
        `    <lastmod>${await lastModified(page.paths[locale])}</lastmod>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        ...alternates,
        "  </url>",
      ].join("\n"),
    );
  }
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...entries,
  "</urlset>",
  "",
].join("\n");

await writeFile(join(DIST, "sitemap.xml"), xml, "utf8");
console.log(`sitemap.xml: ${entries.length} URL(s) en ${LOCALES.length} idioma(s)`);
