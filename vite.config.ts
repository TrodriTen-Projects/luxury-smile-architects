import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { sri } from "vite-plugin-sri3";
import path from "node:path";

/**
 * Hardened Content Security Policy. No third-party scripts run on the site, so
 * `script-src` stays locked to 'self'. The only external origin we allow is the
 * Google Maps embed *iframe* on the Contact page (`frame-src`); it needs no API
 * key. Google reviews come through our own `/api/reviews` serverless function,
 * so `connect-src 'self'` is enough — the API key never reaches the browser.
 * `style-src 'unsafe-inline'` is required by Framer Motion's inline styles.
 * frame-ancestors / HSTS are header-only directives, so they live in vercel.json.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // required by Framer Motion inline styles
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'", // same-origin only (locales, site.json, /api/reviews)
  "media-src 'self' blob:",
  "frame-src https://www.google.com https://maps.google.com", // Maps embed only
  "object-src 'none'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Inject the CSP <meta> only into the production build so the dev server
// (inline React-refresh preamble + HMR websocket) keeps working.
function cspMeta(): Plugin {
  return {
    name: "inject-csp-meta",
    apply: "build",
    transformIndexHtml(html) {
      const tag = `    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n`;
      return html.replace(/<\/title>/, `</title>\n${tag}`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cspMeta(),
    // Subresource Integrity: injects integrity="sha-..." into the emitted
    // <script>/<link> tags so the browser refuses tampered bundles.
    sri(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    // Keep the entry chunk external (no inlined scripts) so a strict
    // `script-src 'self'` CSP needs no per-file hashes or nonces.
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
