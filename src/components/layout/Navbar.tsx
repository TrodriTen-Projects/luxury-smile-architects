import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useContent } from "@/lib/content";

const LINKS = [
  { to: "/quienes-somos", key: "nav.about" },
  { to: "/tratamientos", key: "nav.treatments" },
  { to: "/resultados", key: "nav.results" },
  { to: "/equipo", key: "nav.team" },
  { to: "/contacto", key: "nav.contact" },
] as const;

export function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const content = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled || open
          ? "border-b border-border/60 bg-base/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-[4.5rem] w-full max-w-[1400px] items-center justify-between gap-4 px-4 lg:px-8 xl:px-12">
        {/* Left: Logo & Links */}
        <div className="flex items-center gap-8 lg:gap-12 xl:gap-16">
          <div className="flex shrink-0 items-center">
            {content.logo.image ? (
              <Link to="/" aria-label="Luxury Smile Architects" className="shrink-0">
                <img src={content.logo.image} alt="Luxury Smile Architects" className="h-6 w-auto lg:h-7 xl:h-8" />
              </Link>
            ) : (
              <Link to="/" className="flex shrink-0 flex-col leading-tight" aria-label="Luxury Smile Architects">
                <span className="whitespace-nowrap font-sans text-lg font-medium tracking-wide text-foreground lg:text-xl xl:text-2xl">
                  LUXURY SMILE
                </span>
                <span className="whitespace-nowrap font-sans text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-gold lg:text-[0.6rem] xl:text-[0.65rem] xl:tracking-[0.4em]">
                  Architects Madrid
                </span>
              </Link>
            )}
          </div>

          {/* Links */}
          <ul className="hidden items-center gap-4 lg:flex lg:gap-6 xl:gap-10 shrink-0">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "link-underline whitespace-nowrap font-sans text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-colors xl:text-[0.72rem] xl:tracking-[0.2em]",
                      isActive ? "text-gold" : "text-muted hover:text-foreground",
                    )
                  }
                >
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Language & Button */}
        <div className="hidden shrink-0 items-center justify-end gap-4 lg:flex lg:gap-6">
          <LanguageSwitcher />
          <Link
            to="/contacto"
            className="link-underline whitespace-nowrap font-sans text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-gold xl:text-[0.72rem] xl:tracking-[0.2em]"
          >
            {t("nav.book")}
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("nav.close") : t("nav.menu")}
        >
          <span className={cn("h-px w-6 bg-foreground transition-transform duration-300", open && "translate-y-[6px] rotate-45")} />
          <span className={cn("h-px w-6 bg-foreground transition-opacity duration-300", open && "opacity-0")} />
          <span className={cn("h-px w-6 bg-foreground transition-transform duration-300", open && "-translate-y-[6px] -rotate-45")} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-[4.5rem] z-40 flex flex-col bg-base/97 px-6 pb-12 pt-10 backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.to}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.05 }}
                >
                  <NavLink
                    to={link.to}
                    className="flex items-center justify-between border-b border-border/50 py-6"
                  >
                    <span className="display text-4xl text-foreground">{t(link.key)}</span>
                    <span className="index-num text-sm">0{i + 1}</span>
                  </NavLink>
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-between pt-10">
              <LanguageSwitcher />
              <Link to="/contacto" className="eyebrow text-gold">
                {t("nav.book")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
