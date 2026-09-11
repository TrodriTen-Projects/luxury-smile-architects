import { Routes, Route, Navigate } from "react-router-dom";

import { RootLayout } from "@/components/layout/RootLayout";
import { RoutePage } from "@/components/RoutePage";
import { ROUTES } from "@/lib/routes";

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
