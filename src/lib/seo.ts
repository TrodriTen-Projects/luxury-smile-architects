import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useContent } from "@/lib/content";
import { ORIGIN, LOCALES, DEFAULT_LOCALE, pathFor, type Locale } from "@/lib/routes";
import { buildGraph } from "@/lib/schema";

export { ORIGIN };

/**
 * Per-page document head.
 *
 * The head is written from an effect rather than declared in JSX because
 * React 18 has no native metadata hoisting. That works with prerendering here:
 * `scripts/prerender.mjs` serialises the live DOM after effects have run, so
 * whatever this sets ends up in the shipped HTML — which is exactly what a
 * crawler reads. On client-side navigation it updates the head in place.
 *
 * Copy lives in the locale files under `seo.*`, not here, so it stays editable
 * as content (and, later, through the CMS) instead of requiring a code change.
 */

/** Social preview image, generated at build time by scripts/gen-og-images.mjs. */
const DEFAULT_OG_IMAGE = "/og-default.jpg";

export interface SeoInput {
  /** Page id, shared by both languages. Also the key under `seo.` in the locales. */
  pageId: string;
  /** Root-relative or absolute image; falls back to the shared social image. */
  image?: string;
  type?: "website" | "article";
  /** Keeps the page out of the index (404), while still following its links. */
  noindex?: boolean;
}

function absolute(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

/** BCP 47 tags. `es-ES` is regional; `en` is not, since no country owns it. */
const HREFLANG: Record<Locale, string> = { es: "es-ES", en: "en" };

/**
 * Declares every language this page exists in, and which one is the default.
 *
 * Every version must list *all* of them, itself included, or Google ignores the
 * set. The old `og:locale:alternate="en_US"` advertised an English version that
 * had no URL at all; now there is one, and this is what points at it.
 */
function upsertAlternates(pageId: string): void {
  for (const link of document.head.querySelectorAll('link[rel="alternate"][hreflang]')) {
    link.remove();
  }
  const add = (hreflang: string, path: string) => {
    const element = document.createElement("link");
    element.setAttribute("rel", "alternate");
    element.setAttribute("hreflang", hreflang);
    element.setAttribute("href", absolute(path));
    document.head.appendChild(element);
  };
  for (const locale of LOCALES) add(HREFLANG[locale], pathFor(pageId, locale));
  // Which version to serve when no declared language matches the visitor.
  add("x-default", pathFor(pageId, DEFAULT_LOCALE));
}

const SCHEMA_ID = "__LSA_SCHEMA__";

/**
 * A single `<script type="application/ld+json">` per page, replaced in place on
 * navigation so two pages' graphs never coexist.
 *
 * `application/ld+json` is data, not executable script, so `script-src 'self'`
 * does not apply and the strict CSP stays untouched.
 */
function upsertSchema(graph: object): void {
  let element = document.getElementById(SCHEMA_ID);
  if (!element) {
    element = document.createElement("script");
    element.setAttribute("type", "application/ld+json");
    element.id = SCHEMA_ID;
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(graph);
}

export function useSeo({ pageId, image, type = "website", noindex = false }: SeoInput): void {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "es";
  const content = useContent();
  const locale = (language.startsWith("en") ? "en" : "es") as Locale;
  const path = pathFor(pageId, locale);
  const key = pageId;

  useEffect(() => {
    const title = t(`seo.${key}.title`);
    const description = t(`seo.${key}.description`);
    const canonical = absolute(path);
    const socialImage = absolute(image ?? DEFAULT_OG_IMAGE);

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, follow" : "index, follow");
    upsertLink("canonical", canonical);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", socialImage);
    upsertMeta("property", "og:image:alt", title);
    upsertMeta("property", "og:site_name", "Luxury Smile Architects");
    upsertMeta("property", "og:locale", locale === "en" ? "en_US" : "es_ES");
    upsertMeta("property", "og:locale:alternate", locale === "en" ? "es_ES" : "en_US");
    upsertAlternates(pageId);

    // summary_large_image is what turns a shared link into a full-width card.
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", socialImage);

    upsertSchema(
      buildGraph(content, { key, path, title, description, image: socialImage }, language),
    );
  }, [t, key, pageId, path, locale, image, type, noindex, language, content]);
}
