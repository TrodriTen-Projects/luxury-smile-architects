import i18n, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

import { PRERENDER_STATE, publishPrerenderState } from "@/lib/prerender-state";
import { DEFAULT_LOCALE, LOCALES, localeFromPath, type Locale } from "@/lib/routes";

export const SUPPORTED_LANGUAGES = LOCALES;
export type Language = Locale;

/**
 * Bundles the prerenderer inlined for this page, if any. With them present
 * i18next initialises synchronously, so the first client render shows real copy
 * instead of raw keys — which is what lets it match the prerendered markup.
 *
 * `partialBundledLanguages` keeps HttpBackend in charge of the language that
 * was not inlined, so a client-side switch still lazy-loads it.
 */
const preloaded = PRERENDER_STATE.translations;

/**
 * The URL decides the language, and nothing else does.
 *
 * The browser-language detector is deliberately gone: with `/` in Spanish and
 * `/en` in English, letting the browser override the URL would serve English
 * copy at a Spanish URL — mismatching the prerendered markup, and telling
 * Google that one URL has two different contents. The prerendered state carries
 * the language the file was written in; a cold load reads it off the path.
 */
const initialLanguage: Language =
  (PRERENDER_STATE.lang as Language | undefined) ??
  (typeof window !== "undefined" ? localeFromPath(window.location.pathname) : DEFAULT_LOCALE);

void i18n
  // Lazy-loads /locales/{{lng}}/translation.json on demand (same-origin only).
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES as unknown as string[],
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
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
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

// During the prerender pass, hand the resolved bundle back so it can be inlined.
function publishActiveBundle() {
  const lng = (i18n.resolvedLanguage ?? DEFAULT_LOCALE).slice(0, 2);
  const bundle = i18n.getResourceBundle(lng, "translation");
  if (bundle) {
    publishPrerenderState({ lang: lng, translations: { [lng]: { translation: bundle } } });
  }
}
i18n.on("loaded", publishActiveBundle);
i18n.on("initialized", publishActiveBundle);

export default i18n;
