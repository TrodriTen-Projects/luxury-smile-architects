import type { ComponentType } from "react";

/**
 * Router-side copy of the page list. `scripts/routes.mjs` holds the build-side
 * copy (prerender + sitemap) and `scripts/prerender.mjs` fails the build if the
 * two ever disagree, so adding a page here without adding it there is caught
 * before anything ships.
 *
 * Each page exists once per locale, with a translated slug. The URL — not
 * `localStorage`, not the browser's language — decides which language a page is
 * in: that is what makes the English version something Google can index, and it
 * is the whole reason these routes exist.
 */

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

/**
 * Production origin, used for canonical URLs, og:url and every `@id` in the
 * JSON-LD graph. Lives here rather than in seo.ts because schema.ts needs it
 * too and seo.ts imports schema.ts — putting it there makes the two circular.
 * Keep in sync with ORIGIN in scripts/routes.mjs.
 */
export const ORIGIN = "https://luxurysmilearchitects.eu";

export interface AppPage {
  id: string;
  paths: Record<Locale, string>;
  load: () => Promise<{ default: ComponentType }>;
}

export const PAGES: AppPage[] = [
  { id: "home", paths: { es: "/", en: "/en" }, load: () => import("@/pages/Home") },
  {
    id: "treatments",
    paths: { es: "/tratamientos", en: "/en/treatments" },
    load: () => import("@/pages/Treatments"),
  },
  {
    id: "results",
    paths: { es: "/resultados", en: "/en/results" },
    load: () => import("@/pages/Results"),
  },
  { id: "team", paths: { es: "/equipo", en: "/en/team" }, load: () => import("@/pages/Team") },
  {
    id: "about",
    paths: { es: "/quienes-somos", en: "/en/about" },
    load: () => import("@/pages/About"),
  },
  {
    id: "contact",
    paths: { es: "/contacto", en: "/en/contact" },
    load: () => import("@/pages/Contact"),
  },
];

/**
 * The 404 page. Outside `PAGES` so it never reaches the sitemap, and one
 * language on purpose: Cloudflare Pages serves a single `404.html` from the
 * root of the output for every unmatched path, whatever the prefix, so a
 * per-locale copy would never be used.
 */
export const ERROR_PAGE: AppPage = {
  id: "notFound",
  paths: { es: "/404", en: "/404" },
  load: () => import("@/pages/NotFound"),
};

const ALL_PAGES = [...PAGES, ERROR_PAGE];

/** Trailing slashes and casing normalised so `/en/team/` matches `/en/team`. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "").toLowerCase();
  return trimmed === "" ? "/" : trimmed;
}

/** The language a URL is written in. The path is the only source of truth. */
export function localeFromPath(pathname: string): Locale {
  const path = normalizePath(pathname);
  return path === "/en" || path.startsWith("/en/") ? "en" : "es";
}

export function findPage(pathname: string): { page: AppPage; locale: Locale } | undefined {
  const target = normalizePath(pathname);
  for (const page of ALL_PAGES) {
    for (const locale of LOCALES) {
      if (page.paths[locale] === target) return { page, locale };
    }
  }
  return undefined;
}

/** The URL of a page in a given language, for links and the language switcher. */
export function pathFor(pageId: string, locale: Locale): string {
  const page = ALL_PAGES.find((p) => p.id === pageId);
  return page?.paths[locale] ?? (locale === "en" ? "/en" : "/");
}

/**
 * Pages whose module is already in hand, so they can render synchronously.
 *
 * Nothing here goes through `React.lazy`, and that is deliberate: `lazy`
 * renders behind a `<Suspense>` boundary, and a boundary cannot be hydrated
 * from prerendered markup at all. React's hydration looks for the `<!--$-->`
 * comment markers its own server renderer emits around each boundary, and a
 * DOM serialised from a browser has none — so React declares a mismatch and
 * throws the whole page away to re-render on the client, undoing prerendering
 * for every visitor.
 *
 * `RoutePage` resolves modules through this map instead, rendering a plain
 * component once loaded. Code splitting is unchanged: each page is still its
 * own dynamic `import()` and its own chunk.
 */
const RESOLVED_PAGES = new Map<string, ComponentType>();

/** The component for a page id, or `undefined` if its chunk is still loading. */
export function resolvedPage(pageId: string): ComponentType | undefined {
  return RESOLVED_PAGES.get(pageId);
}

/** Load a page's module and mark it renderable without suspending. */
export async function preloadPage(pageId: string): Promise<void> {
  if (RESOLVED_PAGES.has(pageId)) return;
  const page = ALL_PAGES.find((p) => p.id === pageId);
  if (!page) return;
  try {
    const module = await page.load();
    RESOLVED_PAGES.set(pageId, module.default);
  } catch {
    // Leave it unresolved; RoutePage keeps showing its placeholder and the
    // next navigation retries rather than crashing the app.
  }
}
