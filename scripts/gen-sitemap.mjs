/**
 * Writes the sitemap from the same page list the prerenderer uses, so it can
 * never list a page that was not built (or miss one that was).
 *
 * Two files, deliberately:
 *
 *   dist/sitemap.xml        the index — no XHTML elements in it
 *   dist/sitemap-pages.xml  the 12 URLs with their hreflang alternates
 *
 * The split is for the humans. The `xhtml:link` annotations live in the real
 * XHTML namespace, and Chrome and Edge skip their XML viewer for any document
 * containing it: they render those elements instead of drawing the tree, and
 * the page comes out as a wall of loose text that looks like a broken sitemap
 * even though it is valid. Keeping the index free of XHTML means the URL people
 * open — the one submitted to Search Console, the one in robots.txt — still
 * renders as the usual tree, while the annotations stay intact in the child,
 * which is what Google actually reads.
 *
 * Before any of this, `/sitemap.xml` answered `200` with the HTML of the
 * homepage, because the SPA fallback rewrote every unmatched path. Search
 * Console would have read that as a malformed sitemap.
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

/** The child sitemap, referenced by the index and by nothing else. */
const CHILD = "sitemap-pages.xml";

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
let newest = "";

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
    const lastmod = await lastModified(page.paths[locale]);
    // ISO dates sort as strings, so the index can carry the freshest one.
    if (lastmod > newest) newest = lastmod;

    entries.push(
      [
        "  <url>",
        `    <loc>${escapeXml(ORIGIN + page.paths[locale])}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        ...alternates,
        "  </url>",
      ].join("\n"),
    );
  }
}

const pages = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...entries,
  "</urlset>",
  "",
].join("\n");

const index = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <sitemap>",
  `    <loc>${escapeXml(`${ORIGIN}/${CHILD}`)}</loc>`,
  `    <lastmod>${newest}</lastmod>`,
  "  </sitemap>",
  "</sitemapindex>",
  "",
].join("\n");

await writeFile(join(DIST, CHILD), pages, "utf8");
await writeFile(join(DIST, "sitemap.xml"), index, "utf8");

console.log(
  `sitemap.xml: índice -> ${CHILD}, ${entries.length} URL(s) en ${LOCALES.length} idioma(s)`,
);
