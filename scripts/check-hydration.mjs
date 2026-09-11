/**
 * Hydration check for the prerendered build.
 *
 * Serves `dist/` and loads every route in a real browser, failing on any
 * console error, page error or React hydration warning. Also asserts that the
 * markup the server sent survives hydration instead of being thrown away and
 * repainted, which is what happens when a Suspense boundary is still pending.
 *
 *   node scripts/check-hydration.mjs
 */
import { preview } from "vite";
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTES } from "./routes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const HYDRATION_HINTS = [
  "hydrat", // "Hydration failed", "An error occurred during hydration"
  "did not match",
  "server html",
  "text content does not match",
];

async function launchBrowser() {
  for (const options of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
    try {
      return await chromium.launch({ ...options, headless: true });
    } catch {
      /* try the next one */
    }
  }
  throw new Error("No se pudo abrir ningún navegador.");
}

const server = await preview({
  root: ROOT,
  preview: { port: 4184, strictPort: false, host: "127.0.0.1", open: false },
  logLevel: "warn",
});
const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await launchBrowser();

let failures = 0;
console.log("\nComprobando hidratación…\n");

for (const route of ROUTES) {
  const context = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") errors.push(text);
    if (message.type() === "warning") warnings.push(text);
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto(`${origin}${route.path}`, { waitUntil: "networkidle", timeout: 60_000 });

  // Text that was in the shipped HTML must still be on screen after hydration.
  const heading = await page.evaluate(
    () => document.querySelector("main h1, main h2")?.textContent?.trim() ?? "",
  );
  // Nothing may be left invisible by a replayed entry animation.
  const invisible = await page.evaluate(
    () =>
      [...document.querySelectorAll("#root [style*='opacity']")].filter(
        (el) => parseFloat(getComputedStyle(el).opacity) < 0.99,
      ).length,
  );

  const hydrationIssues = [...errors, ...warnings].filter((line) =>
    HYDRATION_HINTS.some((hint) => line.toLowerCase().includes(hint)),
  );

  const problems = [];
  if (errors.length) problems.push(`errores: ${errors.join(" | ")}`);
  if (hydrationIssues.length) problems.push(`hidratación: ${hydrationIssues.join(" | ")}`);
  if (!heading) problems.push("sin encabezado visible tras hidratar");
  if (invisible > 0) problems.push(`${invisible} elemento(s) invisibles tras hidratar`);

  if (problems.length) {
    failures += 1;
    console.log(`  ✗ ${route.path}\n      ${problems.join("\n      ")}`);
  } else {
    console.log(`  ✓ ${route.path.padEnd(16)} sin errores · h1: "${heading.slice(0, 40)}"`);
  }

  await context.close();
}

await browser.close();
await server.close();

console.log(
  failures === 0
    ? `\n${ROUTES.length} ruta(s) hidratan sin errores.\n`
    : `\n${failures} ruta(s) con problemas.\n`,
);
process.exit(failures === 0 ? 0 : 1);
