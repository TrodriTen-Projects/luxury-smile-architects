import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { RootLayout } from "@/components/layout/RootLayout";

const Home = lazy(() => import("@/pages/Home"));
const Treatments = lazy(() => import("@/pages/Treatments"));
const Results = lazy(() => import("@/pages/Results"));
const Team = lazy(() => import("@/pages/Team"));
const Contact = lazy(() => import("@/pages/Contact"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="tratamientos" element={<Treatments />} />
        <Route path="resultados" element={<Results />} />
        <Route path="equipo" element={<Team />} />
        <Route path="contacto" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
