import { Routes, Route } from "react-router-dom";

import { RootLayout } from "@/components/layout/RootLayout";
import { RoutePage } from "@/components/RoutePage";
import { ROUTES, ERROR_ROUTE } from "@/lib/routes";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {ROUTES.map((route) =>
          route.path === "/" ? (
            <Route key={route.path} index element={<RoutePage path={route.path} />} />
          ) : (
            <Route
              key={route.path}
              path={route.path.slice(1)}
              element={<RoutePage path={route.path} />}
            />
          ),
        )}
        {/* An unknown path used to redirect to the homepage, which made every
            typo answer 200 with the homepage — a soft 404 to a crawler. It now
            renders the real 404 page, and Cloudflare serves dist/404.html with
            a 404 status for those URLs. */}
        <Route path="404" element={<RoutePage path={ERROR_ROUTE.path} />} />
        <Route path="*" element={<RoutePage path={ERROR_ROUTE.path} />} />
      </Route>
    </Routes>
  );
}
