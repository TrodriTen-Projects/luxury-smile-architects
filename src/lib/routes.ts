import type { ComponentType } from "react";

/**
 * Router-side copy of the page list. `scripts/routes.mjs` holds the build-side
 * copy (prerender + sitemap) and `scripts/prerender.mjs` fails the build if the
 * two ever disagree, so adding a page here without adding it there is caught
 * before anything ships.
 */
/**
 * Production origin, used for canonical URLs, og:url and every `@id` in the
 * JSON-LD graph. Lives here rather than in seo.ts because schema.ts needs it
 * too and seo.ts imports schema.ts — putting it there makes the two circular.
 * Keep in sync with ORIGIN in scripts/routes.mjs.
 */
export const ORIGIN = "https://luxurysmilearchitects.eu";

export interface AppRoute {
  path: string;
  load: () => Promise<{ default: ComponentType }>;
}

export const ROUTES: AppRoute[] = [
  { path: "/", load: () => import("@/pages/Home") },
  { path: "/tratamientos", load: () => import("@/pages/Treatments") },
  { path: "/resultados", load: () => import("@/pages/Results") },
  { path: "/equipo", load: () => import("@/pages/Team") },
  { path: "/quienes-somos", load: () => import("@/pages/About") },
  { path: "/contacto", load: () => import("@/pages/Contact") },
];

/**
 * The 404 page. Kept out of `ROUTES` so it never reaches the sitemap; mirrors
 * ERROR_ROUTE in scripts/routes.mjs, which writes it to `dist/404.html`.
 */
export const ERROR_ROUTE: AppRoute = {
  path: "/404",
  load: () => import("@/pages/NotFound"),
};

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

/** The page component for a path, or `undefined` if its chunk is still loading. */
export function resolvedPage(path: string): ComponentType | undefined {
  return RESOLVED_PAGES.get(normalizePath(path));
}

/** Load a route's module and mark it renderable without suspending. */
export async function preloadRoute(pathname: string): Promise<void> {
  const route = findRoute(pathname);
  if (!route) return;
  try {
    const module = await route.load();
    RESOLVED_PAGES.set(route.path, module.default);
  } catch {
    // Leave it unresolved; RoutePage keeps showing its placeholder and the
    // next navigation retries rather than crashing the app.
  }
}

/** Trailing slashes and casing normalised so `/equipo/` matches `/equipo`. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "").toLowerCase();
  return trimmed === "" ? "/" : trimmed;
}

export function findRoute(pathname: string): AppRoute | undefined {
  const target = normalizePath(pathname);
  return [...ROUTES, ERROR_ROUTE].find((route) => route.path === target);
}
