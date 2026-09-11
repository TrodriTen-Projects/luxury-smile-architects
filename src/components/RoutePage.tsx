import { useEffect, useState, type ComponentType } from "react";

import { preloadRoute, resolvedPage } from "@/lib/routes";

/**
 * Renders a route's page, loading its chunk on demand.
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
 */
export function RoutePage({ path }: { path: string }) {
  const [Page, setPage] = useState<ComponentType | undefined>(() => resolvedPage(path));

  useEffect(() => {
    const already = resolvedPage(path);
    if (already) {
      setPage(() => already);
      return;
    }
    let active = true;
    void preloadRoute(path).then(() => {
      if (active) setPage(() => resolvedPage(path));
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!Page) return <div className="min-h-[80vh]" aria-hidden="true" />;
  return <Page />;
}
