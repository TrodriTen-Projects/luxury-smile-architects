/**
 * Canonical list of pages the site publishes, shared by the build scripts.
 *
 * `scripts/prerender.mjs` renders one static HTML file per page *per locale*,
 * `scripts/gen-sitemap.mjs` lists the same URLs with their hreflang pairs, and
 * `src/lib/routes.ts` holds the router-side copy — prerender.mjs asserts the
 * two agree and fails the build if they drift.
 *
 * Slugs are translated rather than merely prefixed (`/en/treatments`, not
 * `/en/tratamientos`): an English URL with Spanish keywords in it is most of
 * the reason to publish an English version at all.
 *
 * `/admin` (the CMS) is deliberately absent: it must not be prerendered,
 * listed in the sitemap, or indexed.
 */

export const LOCALES = ["es", "en"];
export const DEFAULT_LOCALE = "es";

/** Production origin, used for canonical URLs, og:url and the sitemap. */
export const ORIGIN = "https://luxurysmilearchitects.eu";

/**
 * @typedef {{ id: string, paths: Record<string,string>, changefreq: string, priority: string }} SitePage
 */

/** @type {SitePage[]} */
export const PAGES = [
  { id: "home", paths: { es: "/", en: "/en" }, changefreq: "weekly", priority: "1.0" },
  { id: "treatments", paths: { es: "/tratamientos", en: "/en/treatments" }, changefreq: "monthly", priority: "0.9" },
  { id: "results", paths: { es: "/resultados", en: "/en/results" }, changefreq: "monthly", priority: "0.8" },
  { id: "team", paths: { es: "/equipo", en: "/en/team" }, changefreq: "monthly", priority: "0.8" },
  { id: "about", paths: { es: "/quienes-somos", en: "/en/about" }, changefreq: "yearly", priority: "0.7" },
  { id: "contact", paths: { es: "/contacto", en: "/en/contact" }, changefreq: "yearly", priority: "0.9" },
];

/**
 * The 404 page. Outside `PAGES` so it never reaches the sitemap, and single
 * language on purpose: Cloudflare Pages serves one `404.html` from the root of
 * the output for every unmatched path, whatever the prefix, so a per-locale
 * copy would never be used. It links to both languages.
 */
export const ERROR_ROUTE = { id: "notFound", path: "/404", locale: "es", output: "404.html" };

/** Flat list of every URL to render: one per page per locale. */
export const ROUTES = PAGES.flatMap((page) =>
  LOCALES.map((locale) => ({
    id: page.id,
    locale,
    path: page.paths[locale],
    changefreq: page.changefreq,
    priority: page.priority,
  })),
);

/** The same page in every language, for hreflang and the language switcher. */
export function alternatesFor(pageId) {
  const page = PAGES.find((p) => p.id === pageId);
  if (!page) return {};
  return page.paths;
}

/** `/en/team` -> `dist/en/team/index.html`; `/` -> `dist/index.html`. */
export function outputFileFor(routePath) {
  return routePath === "/" ? "index.html" : `${routePath.replace(/^\//, "")}/index.html`;
}
