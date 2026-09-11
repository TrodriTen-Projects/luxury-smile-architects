import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { ConsentBanner } from "@/components/ConsentBanner";
import { entryInitial, releaseEntryAnimations } from "@/lib/prerendered";
import { switchLanguage } from "@/lib/i18n";
import { localeFromPath } from "@/lib/routes";

export function RootLayout() {
  const { pathname } = useLocation();
  const initialPath = useRef(pathname);

  // Entry animations stay suppressed for the route that was prerendered: its
  // markup already shows the finished frame. Releasing on mount instead would
  // be too early — the lazy page renders *after* layout effects run, so it
  // would come back at `opacity: 0` and break hydration. The first client-side
  // navigation is the correct moment: from there nothing is prerendered.
  useEffect(() => {
    if (pathname !== initialPath.current) releaseEntryAnimations();
  }, [pathname]);

  // The URL owns the language. Client-side navigation between /equipo and
  // /en/team does not re-run i18n init, so the two are reconciled here.
  // switchLanguage preloads the bundle first: a bare changeLanguage would
  // suspend, and a prerendered page has no boundary to catch that.
  const locale = localeFromPath(pathname);
  useEffect(() => {
    void switchLanguage(locale);
  }, [locale]);

  return (
    <>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:text-base"
      >
        Skip
      </a>
      <Navbar />
      <main id="main">
        {/* No <Suspense> here on purpose: a boundary cannot be hydrated from
            prerendered markup. RoutePage does the loading with plain state. */}
        <motion.div
          key={pathname}
          initial={entryInitial({ opacity: 0, y: 10 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
      <ConsentBanner />
    </>
  );
}
