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
      <nav className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between gap-6 px-6 lg:px-12">
        {content.logo.image ? (
          <Link to="/" aria-label="Luxury Smile Architects">
            <img src={content.logo.image} alt="Luxury Smile Architects" className="h-10 w-auto" />
          </Link>
        ) : (
          <Link to="/" className="flex flex-col leading-none" aria-label="Luxury Smile Architects">
            <span className="font-sans text-[1.6rem] font-medium leading-none text-foreground">
              LUXURY SMILE
            </span>
            <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-gold">
              Architects Madrid
            </span>
          </Link>
        )}

        <ul className="hidden items-center gap-10 lg:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "link-underline font-sans text-[0.72rem] font-medium uppercase tracking-[0.2em] transition-colors",
                    isActive ? "text-gold" : "text-muted hover:text-foreground",
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-7 lg:flex">
          <LanguageSwitcher />
          <Link
            to="/contacto"
            className="link-underline font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-gold"
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
