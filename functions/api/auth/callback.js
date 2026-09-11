/**
 * Finishes the GitHub OAuth flow.  →  GET /api/auth/callback
 *
 * This is the URL registered as the OAuth App's "Authorization callback URL".
 * It swaps the one-time `code` for an access token server-side — the client
 * secret is required for that exchange and must never reach the browser — then
 * renders a page that hands the token to the CMS window and closes.
 *
 * The page carries its own Content-Security-Policy, set here rather than in
 * `public/_headers`, so this response's policy is unambiguous instead of
 * depending on how overlapping `_headers` rules merge.
 */

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function escapeJson(value) {
  // `</script>` inside the payload would close the data block early.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function page(payload) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Iniciando sesión…</title>
<meta name="robots" content="noindex, nofollow">
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0E0D0C; color:#EDE9E4; font:400 15px/1.6 system-ui, sans-serif; padding:2rem; }
  p { max-width:34rem; text-align:center; }
</style>
</head>
<body>
<p id="status">Conectando con GitHub…</p>
<script type="application/json" id="__auth_payload__">${escapeJson(payload)}</script>
<script src="/admin/auth-callback.js"></script>
</body>
</html>`;
}

function respond(payload, status = 200) {
  return new Response(page(payload), {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // Only the vendored helper may run, and only same-origin. No inline
      // script, so no 'unsafe-inline' anywhere.
      "content-security-policy":
        "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      // Clears the one-time state so the code cannot be replayed.
      "set-cookie": "lsa_oauth_state=; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = readCookie(request.headers.get("cookie"), "lsa_oauth_state");

  if (url.searchParams.get("error")) {
    return respond({ error: url.searchParams.get("error_description") || url.searchParams.get("error") });
  }
  if (!code) {
    return respond({ error: "GitHub no devolvió ningún código de autorización." }, 400);
  }
  // Without this check a third party could feed us a code from another flow.
  if (!state || !expected || state !== expected) {
    return respond(
      { error: "La verificación de estado falló. Vuelve a intentarlo desde /admin." },
      400,
    );
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return respond({ error: "Faltan GITHUB_CLIENT_ID o GITHUB_CLIENT_SECRET en Cloudflare Pages." }, 500);
  }

  let token;
  try {
    const exchange = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/api/auth/callback`,
      }),
    });
    const data = await exchange.json();
    if (data.error) return respond({ error: data.error_description || data.error }, 400);
    token = data.access_token;
  } catch {
    return respond({ error: "No se pudo contactar con GitHub para canjear el código." }, 502);
  }

  if (!token) return respond({ error: "GitHub no devolvió ningún token." }, 502);
  return respond({ token });
}
