import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

import { INSTAGRAM_PROFILE } from "@/data/instagram";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const NAV = [
  { to: "/tratamientos", key: "nav.treatments" },
  { to: "/resultados", key: "nav.results" },
  { to: "/equipo", key: "nav.team" },
  { to: "/contacto", key: "nav.contact" },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/60 bg-base">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-6">{t("footer.tagline")}</p>
            <Link to="/contacto" className="block">
              <span className="display block text-[clamp(2.5rem,6vw,5rem)] text-foreground">
                {t("footer.cta")}
              </span>
            </Link>
          </div>
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="link-underline font-sans text-sm uppercase tracking-[0.2em] text-muted hover:text-foreground"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="my-14 hairline" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-sans text-[0.62rem] uppercase tracking-[0.24em] text-gold">
              {t("contact.clinic.addressLabel")}
            </p>
            <p className="mt-3 font-sans text-sm text-foreground">{t("contact.clinic.address")}</p>
            <p className="font-sans text-sm text-muted">{t("contact.clinic.area")}</p>
          </div>
          <div>
            <p className="font-sans text-[0.62rem] uppercase tracking-[0.24em] text-gold">
              {t("contact.clinic.hoursLabel")}
            </p>
            <p className="mt-3 font-sans text-sm text-muted">{t("contact.clinic.hours")}</p>
          </div>
          <div>
            <p className="font-sans text-[0.62rem] uppercase tracking-[0.24em] text-gold">
              {t("contact.clinic.emailLabel")}
            </p>
            <a
              href={`mailto:${t("contact.clinic.email")}`}
              className="link-underline mt-3 inline-block font-sans text-sm text-foreground"
            >
              {t("contact.clinic.email")}
            </a>
          </div>
          <div>
            <p className="font-sans text-[0.62rem] uppercase tracking-[0.24em] text-gold">Instagram</p>
            <a
              href={INSTAGRAM_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-3 inline-flex items-center gap-2 font-sans text-sm text-foreground"
            >
              <Instagram className="h-4 w-4" />
              @luxurysmilearchitectsmadrid
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-sans text-xs text-muted">
            © {year} Luxury Smile Architects. {t("footer.rights")}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
