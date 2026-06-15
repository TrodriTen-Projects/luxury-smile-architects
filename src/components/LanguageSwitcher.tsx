import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES, type Language } from "@/lib/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? "es").slice(0, 2) as Language;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-sans text-[0.7rem] uppercase tracking-wide2",
        className,
      )}
      role="group"
      aria-label={t("lang.switch")}
    >
      {SUPPORTED_LANGUAGES.map((lng, i) => (
        <span key={lng} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">/</span>}
          <button
            type="button"
            onClick={() => void i18n.changeLanguage(lng)}
            aria-pressed={current === lng}
            className={cn(
              "rounded px-1 transition-colors",
              current === lng
                ? "text-gold"
                : "text-muted hover:text-foreground",
            )}
          >
            {t(`lang.${lng}`)}
          </button>
        </span>
      ))}
    </div>
  );
}
