/**
 * Canonical list of pages the site publishes, shared by the build scripts.
 *
 * `scripts/prerender.mjs` renders one static HTML file per entry and
 * `scripts/gen-sitemap.mjs` lists the same entries in sitemap.xml, so the two
 * can never drift apart. The router-side copy lives in `src/lib/routes.ts`;
 * prerender.mjs asserts both lists match and fails the build if they don't.
 *
 * `/admin` (the CMS) is deliberately absent: it must not be prerendered,
 * listed in the sitemap, or indexed.
 */

/** @typedef {{ path: string, changefreq: string, priority: string }} SiteRoute */

/** @type {SiteRoute[]} */
export const ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/tratamientos", changefreq: "monthly", priority: "0.9" },
  { path: "/resultados", changefreq: "monthly", priority: "0.8" },
  { path: "/equipo", changefreq: "monthly", priority: "0.8" },
  { path: "/quienes-somos", changefreq: "yearly", priority: "0.7" },
  { path: "/contacto", changefreq: "yearly", priority: "0.9" },
];

/** Production origin, used for canonical URLs, og:url and the sitemap. */
export const ORIGIN = "https://luxurysmile.es";

/** `/tratamientos` -> `dist/tratamientos/index.html`; `/` -> `dist/index.html`. */
export function outputFileFor(routePath) {
  return routePath === "/" ? "index.html" : `${routePath.replace(/^\//, "")}/index.html`;
}
