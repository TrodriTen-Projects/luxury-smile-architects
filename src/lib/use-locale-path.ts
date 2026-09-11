import { useLocation } from "react-router-dom";

import { localeFromPath, pathFor } from "@/lib/routes";

/**
 * Resolves internal links in the language of the page you are on.
 *
 * Every in-site link has to go through this. A hardcoded `to="/contacto"` on an
 * English page would drop the visitor into the Spanish site mid-journey, and
 * would tell a crawler that the English pages link out to Spanish ones —
 * exactly the signal hreflang exists to avoid.
 *
 *   const p = useLocalePath();
 *   <Link to={p("contact")}>…</Link>
 */
export function useLocalePath(): (pageId: string) => string {
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);
  return (pageId: string) => pathFor(pageId, locale);
}
