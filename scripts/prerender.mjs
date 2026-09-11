/**
 * Build-time prerendering. Runs as `postbuild`, after `vite build`.
 *
 * Serves the freshly built `dist/` with `vite preview`, drives a real browser
 * over every route in `scripts/routes.mjs`, waits for the app to finish loading
 * its runtime JSON (`/content/site.json`, `/locales/*`), inlines that state
 * for the browser, then writes the DOM to `dist/<route>/index.html`.
 *
 * Why a browser and not a Node renderer (vite-react-ssg and friends): the app
 * fetches its content and translations over HTTP at runtime. A Node renderer
 * cannot resolve those relative URLs and would force a rewrite of both the i18n
 * and the content layer. A headless browser against a local server resolves
 * them exactly as a visitor's browser does, so no source changes are needed.
 *
 * Everything is rendered before anything is written: a failure leaves `dist/`
 * exactly as `vite build` produced it rather than half-prerendered.
 *
 *   node scripts/prerender.mjs
 */
import { preview } from "vite";
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTES, ERROR_ROUTE, ORIGIN, outputFileFor } from "./routes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

/** Keep in sync with PRERENDER_STATE_ID in src/lib/prerender-state.ts. */
const STATE_ID = "__LSA_STATE__";

/**
 * Strings that must never reach production. `src/lib/content.ts` ships a
 * `DEFAULT_CONTENT` fallback with placeholder staff; if the browser serialises
 * before `/content/site.json` has been applied, those names would be published
 * as if they were the real team. Cheap check, catastrophic failure prevented.
 */
const FORBIDDEN = ["Gonzalo Amaya", "Maira Angarita", "martin-prato.svg"];

/** Every page must carry the NAP through the footer. */
const REQUIRED = ["Recoletos"];

/** Launch the bundled browser, falling back to a system install. */
async function launchBrowser() {
  const attempts = [
    { label: "playwright chromium", options: {} },
    { label: "system chrome", options: { channel: "chrome" } },
    { label: "system edge", options: { channel: "msedge" } },
  ];
  const failures = [];
  for (const { label, options } of attempts) {
    try {
      const browser = await chromium.launch({ ...options, headless: true });
      console.log(`  navegador: ${label} (${browser.version()})`);
      return browser;
    } catch (error) {
      failures.push(`${label}: ${String(error).split("\n")[0]}`);
    }
  }
  throw new Error(
    `No se pudo abrir ningún navegador para prerenderizar.\n${failures.join("\n")}\n` +
      `Instala uno con: npx playwright install chromium`,
  );
}

/** Assert the router's route list and the build's route list still agree. */
async function assertRoutesInSync() {
  const source = await readFile(join(ROOT, "src", "lib", "routes.ts"), "utf8");
  const unique = (list) => [...new Set(list)].sort();

  // Router paths are declared per locale: `paths: { es: "/equipo", en: "/en/team" }`.
  const inRouter = unique([...source.matchAll(/\b(?:es|en):\s*"(\/[^"]*)"/g)].map((m) => m[1]));
  const inBuild = unique([...ROUTES.map((r) => r.path), ERROR_ROUTE.path]);

  const same = inRouter.length === inBuild.length && inRouter.every((p, i) => p === inBuild[i]);
  if (!same) {
    const missing = inBuild.filter((p) => !inRouter.includes(p));
    const extra = inRouter.filter((p) => !inBuild.includes(p));
    throw new Error(
      `Las rutas del router y las del build no coinciden.\n` +
        (missing.length ? `  falta en src/lib/routes.ts : ${missing.join(", ")}\n` : "") +
        (extra.length ? `  falta en scripts/routes.mjs: ${extra.join(", ")}\n` : "") +
        `Actualiza ambas listas.`,
    );
  }
  // The origin is duplicated for the same reason the route list is, and a
  // mismatch would publish canonicals and sitemap entries pointing at two
  // different domains — the exact duplicate-content problem this is meant to
  // solve. Three domains currently serve this site, so it matters here.
  const routerOrigin = source.match(/ORIGIN\s*=\s*"([^"]+)"/)?.[1];
  if (routerOrigin !== ORIGIN) {
    throw new Error(
      `El dominio canónico no coincide.\n` +
        `  src/lib/routes.ts : ${routerOrigin}\n` +
        `  scripts/routes.mjs: ${ORIGIN}`,
    );
  }

  console.log(`  rutas en sincronía (${inBuild.length}): ${inBuild.join(" ")}`);
  console.log(`  dominio canónico: ${ORIGIN}`);
}

async function renderRoute(browser, origin, route) {
  const context = await browser.newContext({
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    // Roomy viewport so lazy, size-dependent layout resolves as on desktop.
    viewport: { width: 1440, height: 1600 },
  });

  await context.addInitScript(() => {
    // Tells src/lib/prerendered.ts to mount every reveal at its finished state.
    // Playing the animations instead is not deterministic: reveals inside a
    // horizontal carousel never enter the viewport, so they would serialise
    // still invisible.
    window.__PRERENDER__ = true;

    // Nothing to pin: src/lib/i18n.ts reads the language off the path, so
    // /equipo renders in Spanish and /en/team in English on its own.
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  const url = `${origin}${route.path}`;

  // The content layer starts from DEFAULT_CONTENT and swaps in site.json once
  // fetched, so waiting for that response is what separates real data from
  // placeholders. Registered before navigating so it cannot be missed.
  const contentLoaded = page
    .waitForResponse(
      (response) => response.url().includes("/content/site.json") && response.ok(),
      { timeout: 30_000 },
    )
    .catch(() => null);

  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await contentLoaded;

  // React still has to re-render with the fetched content.
  await page.waitForFunction(
    () => {
      const heading = document.querySelector("main h1, main h2");
      return Boolean(heading && heading.textContent && heading.textContent.trim().length > 0);
    },
    { timeout: 30_000 },
  );
  await page.waitForFunction(
    () => document.querySelector("footer") !== null,
    { timeout: 30_000 },
  );

  // Let React flush the content-driven re-render before capturing.
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );

  // Inline the content and translations the app resolved over HTTP. Without
  // this the first client render falls back to DEFAULT_CONTENT and raw i18n
  // keys, React sees markup that does not match, and discards the prerendered
  // DOM entirely (errors #418/#423). See src/lib/prerender-state.ts.
  const stateBytes = await page.evaluate((stateId) => {
    const state = window.__LSA_STATE__;
    if (!state || (!state.content && !state.translations)) return 0;
    const node = document.createElement("script");
    node.type = "application/json"; // data, not script: no CSP exception needed
    node.id = stateId;
    // `</script>` inside the payload would close this element early.
    node.textContent = JSON.stringify(state).replace(/<\//g, "<\\/");
    document.body.appendChild(node);
    return node.textContent.length;
  }, STATE_ID);

  if (stateBytes === 0) {
    throw new Error(
      `no se pudo capturar el estado de "${route.path}": ` +
        `sin él la hidratación descartaría el HTML prerenderizado`,
    );
  }

  const html = await page.evaluate(() => {
    const doctype = "<!doctype html>\n";
    return doctype + document.documentElement.outerHTML;
  });

  const heading = await page
    .evaluate(() => document.querySelector("main h1, main h2")?.textContent?.trim() ?? "")
    .catch(() => "");

  await context.close();
  return { html, consoleErrors, heading };
}

/**
 * Check the JSON-LD actually parses and carries the fields it claims to.
 *
 * The graph is generated from site.json, so a bad edit there (a renamed key, a
 * dropped address) would otherwise ship silently as a broken schema. Failing
 * the build is cheaper than discovering it in Search Console weeks later.
 */
function validateSchema(html) {
  const problems = [];
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];

  if (blocks.length === 0) return ["sin bloque JSON-LD"];
  if (blocks.length > 1) problems.push(`${blocks.length} bloques JSON-LD (debe haber uno)`);

  let graph;
  try {
    graph = JSON.parse(blocks[0][1]);
  } catch (error) {
    return [`el JSON-LD no es JSON válido: ${error.message}`];
  }

  const nodes = graph["@graph"];
  if (!Array.isArray(nodes)) return ["el JSON-LD no tiene un @graph"];

  const typeOf = (node) => [node["@type"]].flat();
  const clinic = nodes.find((n) => typeOf(n).includes("Dentist"));
  if (!clinic) problems.push("el @graph no contiene el nodo Dentist");
  else {
    for (const field of ["name", "telephone", "address", "geo", "openingHoursSpecification"]) {
      if (!clinic[field]) problems.push(`Dentist sin "${field}"`);
    }
    const address = clinic.address ?? {};
    for (const field of ["streetAddress", "postalCode", "addressLocality", "addressCountry"]) {
      if (!address[field]) problems.push(`PostalAddress sin "${field}"`);
    }
    if (clinic.priceRange) problems.push("Dentist trae priceRange, que no debe publicarse");
  }

  // Google disallows marking up reviews collected elsewhere; on a healthcare
  // site the downside of a manual action outweighs star snippets.
  if (nodes.some((n) => typeOf(n).some((t) => t === "Review" || t === "AggregateRating"))) {
    problems.push("el @graph trae Review/AggregateRating, que no deben emitirse");
  }

  const people = nodes.filter((n) => typeOf(n).includes("Person"));
  const procedures = nodes.filter((n) => typeOf(n).includes("MedicalProcedure"));
  if (people.length === 0) problems.push("el @graph no contiene ningún Person");
  if (procedures.length === 0) problems.push("el @graph no contiene ningún MedicalProcedure");

  // Cross-references are the point of the graph: without them the entities are
  // unrelated islands and nothing connects the team to the clinic.
  const ids = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
  for (const person of people) {
    if (!ids.has(person.worksFor?.["@id"])) {
      problems.push(`Person "${person.name}" no referencia la clínica en worksFor`);
    }
  }

  return problems;
}

/** Reject output that would publish placeholders, empty shells or broken markup. */
function validate(route, html, heading, consoleErrors) {
  const problems = [];

  if (!/<div id="root">\s*<[a-z]/i.test(html)) {
    problems.push("el <div id=\"root\"> quedó vacío (no se prerenderizó contenido)");
  }
  for (const needle of FORBIDDEN) {
    if (html.includes(needle)) {
      problems.push(
        `contiene "${needle}", que es un placeholder de DEFAULT_CONTENT: ` +
          `se serializó antes de aplicar /content/site.json`,
      );
    }
  }
  for (const needle of REQUIRED) {
    if (!html.includes(needle)) problems.push(`no contiene "${needle}" (NAP ausente)`);
  }
  if (!html.includes(`id="${STATE_ID}"`)) {
    problems.push(`falta el bloque de estado #${STATE_ID} (la hidratación fallaría)`);
  }
  // Per-page head (src/lib/seo.ts) is written from an effect, so it only lands
  // in the HTML if effects ran before capture. Missing tags here mean the page
  // would ship with the generic fallback head from index.html.
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
  const expected = `${ORIGIN}${route.path}`;
  if (!canonical) problems.push("sin <link rel=canonical>");
  else if (canonical !== expected) {
    problems.push(`canonical "${canonical}" no coincide con "${expected}"`);
  }
  for (const tag of ["og:url", "og:image", "og:title", "og:description"]) {
    if (!html.includes(`property="${tag}"`)) problems.push(`falta <meta property="${tag}">`);
  }
  if (!html.includes('name="twitter:card"')) problems.push("faltan las Twitter Cards");

  // hreflang only works if every version lists all of them, itself included.
  // A page that names only its sibling is discarded by Google, silently.
  if (route.path !== ERROR_ROUTE.path) {
    const alternates = [...html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"/g)].map(
      (m) => m[1],
    );
    for (const expected of ["es-ES", "en", "x-default"]) {
      if (!alternates.includes(expected)) problems.push(`falta hreflang="${expected}"`);
    }
    const lang = html.match(/<html[^>]+lang="([^"]+)"/)?.[1];
    if (lang && lang.slice(0, 2) !== route.locale) {
      problems.push(`<html lang="${lang}"> no coincide con el idioma de la ruta (${route.locale})`);
    }

    // Internal links must stay in the page's language. One hardcoded `to="/x"`
    // drops an English visitor into the Spanish site mid-journey and tells a
    // crawler the versions link across each other, which is what hreflang is
    // there to prevent. The language switcher is the one legitimate exception,
    // and it identifies itself with `hreflang`.
    const otherLocale = route.locale === "es" ? "en" : "es";
    const foreign = ROUTES.filter((r) => r.locale === otherLocale).map((r) => r.path);
    // The whole tag, not just what precedes `href`: React emits `hreflang`
    // after it, so a narrower match would miss the switcher's own marker.
    const crossed = [...html.matchAll(/<a\b[^>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => !tag.includes("hreflang"))
      .map((tag) => tag.match(/\bhref="(\/[^"]*)"/)?.[1])
      .filter((href) => href && foreign.includes(href));
    if (crossed.length) {
      problems.push(
        `enlaces que cambian de idioma sin ser el selector: ${[...new Set(crossed)].join(", ")} ` +
          `— usa useLocalePath() en vez de una ruta fija`,
      );
    }
  }

  problems.push(...validateSchema(html));

  if (!heading) problems.push("no se encontró un encabezado con texto en <main>");
  if (!/<\/html>/i.test(html)) problems.push("el HTML serializado está truncado");

  // Anything still at opacity 0 was serialised mid-reveal and would ship
  // invisible to a visitor until hydration. With __PRERENDER__ set there should
  // be none; if any appear, a motion element is missing its entryInitial wrap.
  const invisible = (html.match(/style="[^"]*opacity: *0[;"]/g) ?? []).length;
  if (invisible > 0) {
    problems.push(
      `${invisible} elemento(s) serializado(s) con opacity:0 — ` +
        `falta envolver su prop \`initial\` con entryInitial() (src/lib/prerendered.ts)`,
    );
  }
  // Escape hatch for the React development build, whose extra warnings are
  // error-level and would mask the problem being debugged. Never set in CI.
  if (consoleErrors.length > 0 && process.env.PRERENDER_ALLOW_CONSOLE !== "1") {
    problems.push(`errores de consola:\n      - ${consoleErrors.join("\n      - ")}`);
  }

  if (problems.length > 0) {
    throw new Error(`Prerender inválido en "${route.path}":\n    - ${problems.join("\n    - ")}`);
  }
}

async function main() {
  const started = Date.now();
  console.log("\nPrerenderizando…");

  await assertRoutesInSync();

  const server = await preview({
    root: ROOT,
    preview: { port: 4183, strictPort: false, host: "127.0.0.1", open: false },
    logLevel: "warn",
  });
  const origin = server.resolvedUrls?.local?.[0]?.replace(/\/$/, "");
  if (!origin) throw new Error("vite preview no expuso una URL local");

  const browser = await launchBrowser();
  const rendered = [];

  try {
    const toRender = [...ROUTES, ERROR_ROUTE];
    for (const route of toRender) {
      const { html, consoleErrors, heading } = await renderRoute(browser, origin, route);
      validate(route, html, heading, consoleErrors);
      rendered.push({ route, html });
      const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
      console.log(`  ✓ ${route.path.padEnd(16)} ${kb.padStart(6)} kB  h1: ${heading.slice(0, 42)}`);
    }

    // Duplicate titles across pages are a classic SEO own-goal and can only
    // be spotted once every route is in hand.
    const seen = new Map();
    for (const { route, html } of rendered) {
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
      if (!title) throw new Error(`"${route.path}" se quedó sin <title>`);
      if (seen.has(title)) {
        throw new Error(
          `Título duplicado "${title}" en ${seen.get(title)} y ${route.path}`,
        );
      }
      seen.set(title, route.path);
    }

    // Nothing is written until every route rendered and validated.
    for (const { route, html } of rendered) {
      const target = join(DIST, route.output ?? outputFileFor(route.path));
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, html, "utf8");
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(
    `\n${rendered.length} ruta(s) prerenderizada(s) en ${((Date.now() - started) / 1000).toFixed(1)}s\n`,
  );
}

main().catch((error) => {
  console.error(`\nFalló el prerender:\n  ${error.message}\n`);
  process.exit(1);
});
