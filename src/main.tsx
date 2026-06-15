import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Self-hosted variable fonts (Fraunces full = opsz axis for display contrast).
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/hanken-grotesk";

import "@/index.css";
import "@/lib/i18n";
import App from "@/App";
import { PageLoader } from "@/components/PageLoader";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<PageLoader />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Suspense>
  </StrictMode>,
);
