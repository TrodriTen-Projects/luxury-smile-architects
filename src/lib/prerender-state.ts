/**
 * State handoff between the prerenderer and the browser.
 *
 * The app fetches its content (`/content/site.json`) and translations
 * (`/locales/*`) over HTTP, so the first client render would otherwise show
 * `DEFAULT_CONTENT` and untranslated keys while the prerendered HTML already
 * shows the real thing. React compares the two, finds them different, and
 * throws the whole server markup away to re-render from scratch (errors #418 and
 * #423) — which silently undoes prerendering for every human visitor.
 *
 * So the prerenderer inlines what it resolved into a JSON block and the app
 * seeds its caches from it, making the first client render byte-identical to
 * the markup. Crawlers ignore the block; browsers skip two round-trips.
 *
 * The block is `type="application/json"`, which is data and not executable
 * script, so it does not need a CSP exception (`script-src 'self'` stays).
 */

export const PRERENDER_STATE_ID = "__LSA_STATE__";

export interface PrerenderState {
  /** Resolved `SiteContent`, already merged with the media indexes. */
  content?: unknown;
  /** i18next resource bundles, shaped `{ es: { translation: {...} } }`. */
  translations?: Record<string, Record<string, unknown>>;
  /** Language this page was written in; pins i18next until hydration is done. */
  lang?: string;
}

declare global {
  interface Window {
    /** Written during the prerender pass so the renderer can read it back. */
    __LSA_STATE__?: PrerenderState;
  }
}

function readInlinedState(): PrerenderState {
  if (typeof document === "undefined") return {};
  const node = document.getElementById(PRERENDER_STATE_ID);
  if (!node?.textContent) return {};
  try {
    return JSON.parse(node.textContent) as PrerenderState;
  } catch {
    // A malformed block must never take the site down; fall back to fetching.
    return {};
  }
}

/** Whatever the prerenderer inlined for this page. Empty on a cold SPA load. */
export const PRERENDER_STATE: PrerenderState = readInlinedState();

/**
 * During the prerender pass only, publish resolved state on `window` so
 * `scripts/prerender.mjs` can inline it. A no-op in real browsers.
 */
export function publishPrerenderState(patch: PrerenderState): void {
  if (typeof window === "undefined" || window.__PRERENDER__ !== true) return;
  window.__LSA_STATE__ = { ...(window.__LSA_STATE__ ?? {}), ...patch };
}
