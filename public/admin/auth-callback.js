/**
 * Hands the GitHub token from the OAuth popup back to the CMS window.
 *
 * A separate file rather than an inline script because the site's CSP has no
 * `'unsafe-inline'` in `script-src` and is not going to get one for this. The
 * token arrives in a `<script type="application/json">` block, which is data
 * and not executable script, so it needs no exception either.
 *
 * The handshake is the one Decap-compatible backends expect: announce
 * `authorizing:github`, wait for the opener to answer, then reply to that exact
 * origin — never to `*`, which would broadcast the token to any listener.
 */
(function () {
  var node = document.getElementById("__auth_payload__");
  var payload;
  try {
    payload = JSON.parse(node.textContent);
  } catch (error) {
    payload = { error: "respuesta de autenticación ilegible" };
  }

  var status = document.getElementById("status");

  if (!window.opener) {
    status.textContent =
      "Esta ventana debe abrirse desde el panel de administración. Ciérrala y vuelve a intentarlo desde /admin.";
    return;
  }

  if (payload.error) {
    status.textContent = "No se pudo iniciar sesión: " + payload.error;
    window.opener.postMessage("authorization:github:error:" + JSON.stringify(payload), "*");
    return;
  }

  var message =
    "authorization:github:success:" +
    JSON.stringify({ token: payload.token, provider: "github" });

  function onMessage(event) {
    // The opener is the CMS on our own origin; answering `event.origin` keeps
    // the token from going anywhere else.
    window.removeEventListener("message", onMessage, false);
    window.opener.postMessage(message, event.origin);
    status.textContent = "Sesión iniciada. Puedes cerrar esta ventana.";
    setTimeout(function () {
      window.close();
    }, 400);
  }

  window.addEventListener("message", onMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
