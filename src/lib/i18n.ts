import i18n, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

import { PRERENDER_STATE, publishPrerenderState } from "@/lib/prerender-state";

export const SUPPORTED_LANGUAGES = ["es", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "lsa-lang";

/**
 * Bundles the prerenderer inlined for this page, if any. With them present
 * i18next initialises synchronously, so the first client render shows real copy
 * instead of raw keys — which is what lets it match the prerendered markup.
 *
 * `partialBundledLanguages` keeps HttpBackend in charge of every language that
 * was not inlined, so switching to the other one still lazy-loads as before.
 */
const preloaded = PRERENDER_STATE.translations;

/**
 * A prerendered page is written in one language. If the detector picked a
 * different one for this visitor, the first render would disagree with the
 * markup and React would throw all of it away. So the prerendered language wins
 * at init, and the visitor's real preference is applied after hydration by
 * `applyPreferredLanguage` — a plain client-side update with nothing to match.
 */
const prerenderedLanguage = PRERENDER_STATE.lang;

void i18n
  // Lazy-loads /locales/{{lng}}/translation.json on demand (same-origin only).
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    defaultNS: "translation",
    ns: ["translation"],
    // With the bundles inlined, init must also be *synchronous*. i18next defers
    // initialisation by default, so `isInitialized` would still be false on the
    // first render, react-i18next would suspend, and React would paint the
    // PageLoader over the prerendered markup — a total mismatch.
    ...(preloaded
      ? { resources: preloaded as Resource, partialBundledLanguages: true, initImmediate: false }
      : {}),
    ...(prerenderedLanguage ? { lng: prerenderedLanguage } : {}),
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY,
    },
    interpolation: {
      // React already escapes output; this is safe.
      escapeValue: false,
    },
    react: {
      // Stays on. A prerendered page hydrates without a Suspense boundary (see
      // main.tsx), but it never suspends either: its bundles are inlined, so
      // the first render is synchronous. Turning this off would be worse — the
      // hook would return before `ready` and `t()` would render raw keys,
      // mismatching every string on the page. Language *switches* avoid
      // suspending by preloading the file first; see `switchLanguage`.
      useSuspense: true,
    },
  });

i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
});

/** Resolve what this visitor should actually see: stored choice, else browser. */
function preferredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored.slice(0, 2))) {
      return stored.slice(0, 2) as Language;
    }
  } catch {
    /* storage blocked — fall through to the browser language */
  }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
}

/**
 * Switch language without ever suspending.
 *
 * `changeLanguage` on its own makes components suspend while the new bundle is
 * fetched. On a prerendered page there is no Suspense boundary to catch that
 * (see main.tsx), so the fetch has to finish first. Loading the namespace up
 * front makes the actual switch synchronous.
 */
export async function switchLanguage(lng: Language): Promise<void> {
  if (lng === (i18n.resolvedLanguage ?? "").slice(0, 2)) return;
  try {
    await i18n.loadLanguages(lng);
  } catch {
    // Offline or a missing file: changeLanguage falls back on its own.
  }
  await i18n.changeLanguage(lng);
}

/**
 * Applied once, after hydration. Before that point the language is pinned to
 * whatever the page was prerendered in (see `prerenderedLanguage`).
 */
export function applyPreferredLanguage(): void {
  if (!prerenderedLanguage) return; // cold SPA load: the detector already ran
  void switchLanguage(preferredLanguage());
}

// During the prerender pass, hand the resolved bundle back so it can be inlined.
function publishActiveBundle() {
  const lng = (i18n.resolvedLanguage ?? "es").slice(0, 2);
  const bundle = i18n.getResourceBundle(lng, "translation");
  if (bundle) {
    publishPrerenderState({ lang: lng, translations: { [lng]: { translation: bundle } } });
  }
}
i18n.on("loaded", publishActiveBundle);
i18n.on("initialized", publishActiveBundle);

export default i18n;
