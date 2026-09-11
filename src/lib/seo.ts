import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useContent } from "@/lib/content";
import { ORIGIN } from "@/lib/routes";
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
  /** Key under `seo.` in the locale files, e.g. "home" or "treatments". */
  key: string;
  /** Route path this page is canonical for, e.g. "/equipo". */
  path: string;
  /** Root-relative or absolute image; falls back to the shared social image. */
  image?: string;
  type?: "website" | "article";
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

export function useSeo({ key, path, image, type = "website" }: SeoInput): void {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "es";
  const content = useContent();

  useEffect(() => {
    const title = t(`seo.${key}.title`);
    const description = t(`seo.${key}.description`);
    const canonical = absolute(path);
    const socialImage = absolute(image ?? DEFAULT_OG_IMAGE);

    document.title = title;
    upsertMeta("name", "description", description);
    upsertLink("canonical", canonical);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", socialImage);
    upsertMeta("property", "og:image:alt", title);
    upsertMeta("property", "og:site_name", "Luxury Smile Architects");
    upsertMeta("property", "og:locale", language === "en" ? "en_US" : "es_ES");

    // summary_large_image is what turns a shared link into a full-width card.
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", socialImage);

    upsertSchema(
      buildGraph(content, { key, path, title, description, image: socialImage }, language),
    );
  }, [t, key, path, image, type, language, content]);
}
