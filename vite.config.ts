import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { sri } from "vite-plugin-sri3";
import path from "node:path";

/**
 * Hardened Content Security Policy that allows the external integrations we use
 * (Instagram embeds, remote imagery) while keeping script execution tight.
 * - script-src: our own bundles + Instagram's embed.js
 * - frame-src:  Instagram/Facebook iframes (reel embeds)
 * - img/media-src https: -> remote photos & Instagram CDN
 * - style-src 'unsafe-inline' -> Framer Motion + the Instagram embed inject styles
 * frame-ancestors / HSTS are header-only directives, so they live in vercel.json.
 */
const IG = "https://www.instagram.com https://platform.instagram.com";
const GMAPS = "https://maps.googleapis.com https://maps.gstatic.com";
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  `script-src 'self' ${IG} ${GMAPS}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${IG} https://graph.instagram.com https://i.instagram.com ${GMAPS}`,
  "media-src 'self' https: blob:",
  `frame-src ${IG} https://www.facebook.com https://www.google.com https://maps.google.com`,
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
