import { Routes, Route } from "react-router-dom";

import { RootLayout } from "@/components/layout/RootLayout";
import { RoutePage } from "@/components/RoutePage";
import { PAGES, ERROR_PAGE, LOCALES } from "@/lib/routes";

/** `/` is the index route; everything else is declared by its own path. */
function routeFor(pageId: string, path: string) {
  const key = `${pageId}-${path}`;
  return path === "/" ? (
    <Route key={key} index element={<RoutePage pageId={pageId} />} />
  ) : (
    <Route key={key} path={path.slice(1)} element={<RoutePage pageId={pageId} />} />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {PAGES.flatMap((page) => LOCALES.map((locale) => routeFor(page.id, page.paths[locale])))}
        {/* An unknown path used to redirect to the homepage, which made every
            typo answer 200 with the homepage — a soft 404 to a crawler. It now
            renders the real 404 page, and Cloudflare serves dist/404.html with
            a 404 status for those URLs. */}
        <Route path="404" element={<RoutePage pageId={ERROR_PAGE.id} />} />
        <Route path="*" element={<RoutePage pageId={ERROR_PAGE.id} />} />
      </Route>
    </Routes>
  );
}
