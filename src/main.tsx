import { StrictMode, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Self-hosted variable fonts (Fraunces full = opsz axis for display contrast).
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/montserrat";

import "@/index.css";
import "@/lib/i18n";
import App from "@/App";
import { PageLoader } from "@/components/PageLoader";
import { preloadRoute } from "@/lib/routes";
import { wasPrerendered } from "@/lib/prerendered";

const container = document.getElementById("root")!;

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

/**
 * A prerendered page hydrates with no Suspense boundary anywhere in the tree.
 * React's hydration expects the `<!--$-->` markers its own server renderer
 * writes around each boundary, and markup serialised from a browser has none —
 * React calls that a mismatch and re-renders the whole page on the client,
 * throwing away the HTML we prerendered. Nothing suspends on these loads in any
 * case: the page module is resolved below and i18n ships its bundles inline.
 *
 * A cold SPA load (dev server, or a path with no prerendered file) has no
 * markup to match, so the boundary is free to exist and i18n may suspend.
 */
const tree = wasPrerendered ? (
  <StrictMode>{app}</StrictMode>
) : (
  <StrictMode>
    <Suspense fallback={<PageLoader />}>{app}</Suspense>
  </StrictMode>
);

function start() {
  if (wasPrerendered) hydrateRoot(container, tree);
  else createRoot(container).render(tree);
}

if (wasPrerendered) {
  // Resolve this page's module before hydrating so the first render is
  // synchronous and reproduces the markup exactly.
  void preloadRoute(window.location.pathname).then(start, start);
} else {
  start();
}
