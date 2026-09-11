/**
 * Serves the CMS at /admin.  →  GET /admin
 *
 * A Function rather than a static `public/admin/index.html` for one reason:
 * this document needs a wider `connect-src` than the rest of the site (it talks
 * to api.github.com), and setting that here makes the policy for this response
 * explicit instead of depending on how overlapping `public/_headers` rules
 * merge. Every other file under /admin — the bundle, the config, the auth
 * helper — stays a static asset and needs nothing special.
 *
 * The global policy is untouched: the rest of the site keeps `connect-src
 * 'self'` and never gains a GitHub exception.
 */

/**
 * Every origin below was added because the CMS was observed asking for it and
 * being refused — not preemptively. `script-src` is deliberately untouched:
 * this page holds a GitHub token with `repo` scope, so nothing external gets to
 * execute here. The rest of the site never sees any of this.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  // The bundle is vendored into /admin by scripts/vendor-cms.mjs, so 'self'
  // covers it. No CDN, and no 'unsafe-inline'.
  "script-src 'self'",
  // Svelte injects component styles at runtime.
  "style-src 'self' 'unsafe-inline'",
  // Media previews come from the repository over the GitHub content hosts.
  "img-src 'self' data: blob: https://*.githubusercontent.com https://avatars.githubusercontent.com",
  // jsDelivr serves the CMS interface fonts. Blocking them left the panel
  // rendering in fallback faces and firing three refused requests per load.
  "font-src 'self' data: https://cdn.jsdelivr.net",
  // 'self' + GitHub: reading and writing the repository from the browser.
  // data: — the CMS fetches its own logo as a data URI.
  // unpkg — its own version check.
  // githubstatus — the "GitHub is down" banner.
  // The last three are read-only JSON endpoints; without them the panel throws
  // on every load.
  "connect-src 'self' data: https://api.github.com https://*.githubusercontent.com https://unpkg.com https://www.githubstatus.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contenido · Luxury Smile Architects</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<!-- Absolute on purpose: this document lives at /admin with no trailing slash,
     so a relative "config.yml" would resolve to /config.yml and 404. -->
<link href="/admin/config.yml" type="text/yaml" rel="cms-config-url">
</head>
<body>
<!-- No `type="module"`: the bundle is a classic script, and Sveltia warns that
     loading it as a module causes unexpected behaviour with its JS API. -->
<script src="/admin/sveltia-cms.js"></script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": CSP,
      // Kept in step with the rest of the site rather than inherited, since a
      // Function response does not pick up public/_headers.
      "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin",
      "cache-control": "no-store",
    },
  });
}
