/**
 * Starts the GitHub OAuth flow for the CMS.  →  GET /api/auth
 *
 * Self-hosted instead of using a hosted auth service so the client secret never
 * leaves this Cloudflare account and entering the CMS does not depend on a
 * third party staying up.
 *
 * Credentials come from the Pages environment (Settings → Variables and
 * Secrets); nothing is hardcoded here and nothing is committed.
 *   GITHUB_CLIENT_ID      (text)
 *   GITHUB_CLIENT_SECRET  (secret, used by ./callback)
 */

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";

/** Random, unguessable value tying the callback to this browser. */
function newState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ request, env }) {
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response(
      "Falta GITHUB_CLIENT_ID en las variables de entorno de Cloudflare Pages.",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const requested = new URL(request.url);
  const state = newState();

  const authorize = new URL(GITHUB_AUTHORIZE);
  authorize.searchParams.set("client_id", clientId);
  // `repo` is what the CMS needs to commit content. GitHub has no narrower
  // scope that still allows writing to a repository's contents.
  authorize.searchParams.set("scope", requested.searchParams.get("scope") || "repo");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("redirect_uri", `${requested.origin}/api/auth/callback`);

  return new Response(null, {
    status: 302,
    headers: {
      location: authorize.toString(),
      // HttpOnly so no script can read it, SameSite=Lax so it survives the
      // redirect back from github.com. Ten minutes is plenty for a login.
      "set-cookie": `lsa_oauth_state=${state}; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "cache-control": "no-store",
    },
  });
}
