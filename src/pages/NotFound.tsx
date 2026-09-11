import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useSeo } from "@/lib/seo";

/**
 * Real 404 page. Until now every unknown URL was redirected to the homepage and
 * answered `200`, which meant `/sitemap.xml`, `/assets/typo.js` and any
 * mistyped path all looked like valid pages to a crawler — soft 404s across the
 * whole site. This page is prerendered to `dist/404.html`, which Cloudflare
 * Pages serves with a real 404 status.
 */
export default function NotFound() {
  const { t } = useTranslation();
  useSeo({ key: "notFound", path: "/404", noindex: true });

  return (
    <section className="section">
      <div className="mx-auto flex min-h-[60vh] max-w-[900px] flex-col justify-center px-6 lg:px-12">
        <span className="eyebrow">404</span>
        <h1 className="display mt-6 text-[clamp(2.2rem,6vw,4.5rem)] text-foreground">
          {t("notFound.title")}
        </h1>
        <p className="mt-6 max-w-xl font-sans text-base font-light leading-relaxed text-muted">
          {t("notFound.text")}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-8">
          <Link
            to="/"
            className="link-underline font-sans text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-gold"
          >
            {t("notFound.home")}
          </Link>
          <Link
            to="/contacto"
            className="link-underline font-sans text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-foreground"
          >
            {t("nav.contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
