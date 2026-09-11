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

/**
 * The 404 page. Prerendered like the rest but deliberately outside `ROUTES`:
 * it must never appear in the sitemap, and it is written to `dist/404.html`,
 * which is the file Cloudflare Pages serves — with a real 404 status — for any
 * path that does not match a file.
 */
export const ERROR_ROUTE = { path: "/404", output: "404.html" };

/** Production origin, used for canonical URLs, og:url and the sitemap. */
export const ORIGIN = "https://luxurysmile.es";

/** `/tratamientos` -> `dist/tratamientos/index.html`; `/` -> `dist/index.html`. */
export function outputFileFor(routePath) {
  return routePath === "/" ? "index.html" : `${routePath.replace(/^\//, "")}/index.html`;
}
