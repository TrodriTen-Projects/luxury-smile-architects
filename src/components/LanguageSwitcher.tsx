import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { LOCALES, findPage, localeFromPath, pathFor, type Locale } from "@/lib/routes";

/**
 * Language switcher.
 *
 * Plain `<a>` links, not client-side navigation and not a `changeLanguage`
 * call. Each language is a different URL with its own prerendered HTML and its
 * own inlined translations, so a full navigation lands on a page that is
 * already in the right language — no flash of the previous one, nothing to
 * fetch, nothing to keep in sync. It also means the switcher is a real link a
 * crawler can follow, which is what hreflang is describing.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const current = localeFromPath(pathname);
  const match = findPage(pathname);

  /** Same page in the other language; the homepage if this one has no twin. */
  const hrefFor = (locale: Locale) =>
    match ? pathFor(match.page.id, locale) : pathFor("home", locale);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-sans text-[0.7rem] uppercase tracking-wide2",
        className,
      )}
      role="group"
      aria-label={t("lang.switch")}
    >
      {LOCALES.map((lng, i) => (
        <span key={lng} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">/</span>}
          <a
            href={hrefFor(lng)}
            hrefLang={lng}
            aria-current={current === lng ? "true" : undefined}
            className={cn(
              "rounded px-1 transition-colors",
              current === lng ? "text-gold" : "text-muted hover:text-foreground",
            )}
          >
            {t(`lang.${lng}`)}
          </a>
        </span>
      ))}
    </div>
  );
}
