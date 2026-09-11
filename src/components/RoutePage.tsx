import { useEffect, useState, type ComponentType } from "react";

import { preloadPage, resolvedPage } from "@/lib/routes";

/**
 * Renders a page, loading its chunk on demand.
 *
 * This is what `<Suspense>` + `React.lazy` would normally do, written out by
 * hand because a Suspense boundary cannot be hydrated from prerendered markup:
 * React looks for the `<!--$-->` comment markers its server renderer emits
 * around each boundary, and a DOM serialised from a browser has none. It then
 * treats the page as mismatched and re-renders everything on the client —
 * silently throwing away the HTML we went to the trouble of prerendering.
 *
 * Plain state has no such requirement. On a prerendered page the module was
 * already resolved before hydration, so the first render is synchronous and
 * matches the markup exactly. On later navigation the chunk loads and the
 * placeholder holds the layout in the meantime, exactly as the fallback did.
 *
 * Keyed by page id, not by path: `/equipo` and `/en/team` are the same
 * component in two languages and share one chunk.
 */
export function RoutePage({ pageId }: { pageId: string }) {
  const [Page, setPage] = useState<ComponentType | undefined>(() => resolvedPage(pageId));

  useEffect(() => {
    const already = resolvedPage(pageId);
    if (already) {
      setPage(() => already);
      return;
    }
    let active = true;
    void preloadPage(pageId).then(() => {
      if (active) setPage(() => resolvedPage(pageId));
    });
    return () => {
      active = false;
    };
  }, [pageId]);

  if (!Page) return <div className="min-h-[80vh]" aria-hidden="true" />;
  return <Page />;
}
