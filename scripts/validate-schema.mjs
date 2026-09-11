/**
 * Validates the emitted JSON-LD against the official schema.org vocabulary.
 *
 * The hosted Schema.org Validator and Google's Rich Results Test both need a
 * public URL, so neither can see a build that has not shipped yet. This checks
 * the same core things they do, offline: that every `@type` exists, that every
 * property exists and is declared for the type it is used on (walking the
 * inheritance chain), and that internal `@id` references resolve.
 *
 * The vocabulary is fetched once and cached; pass a path to reuse a local copy.
 *
 *   node scripts/validate-schema.mjs [ruta/al/vocabulario.jsonld]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTES, outputFileFor } from "./routes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const CACHE = join(ROOT, "node_modules", ".cache", "schemaorg-current-https.jsonld");
const VOCAB_URL = "https://schema.org/version/latest/schemaorg-current-https.jsonld";

async function loadVocabulary(override) {
  if (override && existsSync(override)) return JSON.parse(await readFile(override, "utf8"));
  if (existsSync(CACHE)) return JSON.parse(await readFile(CACHE, "utf8"));
  const response = await fetch(VOCAB_URL);
  if (!response.ok) throw new Error(`no se pudo descargar el vocabulario (HTTP ${response.status})`);
  const text = await response.text();
  await mkdir(dirname(CACHE), { recursive: true });
  await writeFile(CACHE, text, "utf8");
  return JSON.parse(text);
}

/** Index schema.org into: types -> parents, and property -> types it applies to. */
function indexVocabulary(vocabulary) {
  const short = (value) => String(value ?? "").replace(/^schema:/, "").replace(/^https?:\/\/schema\.org\//, "");
  const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);

  const parents = new Map();
  const propertyDomains = new Map();

  for (const node of vocabulary["@graph"]) {
    const id = short(node["@id"]);
    const types = list(node["@type"]).map(short);

    if (types.includes("rdfs:Class") || types.includes("Class")) {
      parents.set(
        id,
        list(node["rdfs:subClassOf"]).map((p) => short(p["@id"] ?? p)),
      );
    }
    if (types.includes("rdf:Property") || types.includes("Property")) {
      propertyDomains.set(
        id,
        list(node["schema:domainIncludes"] ?? node["domainIncludes"]).map((d) => short(d["@id"] ?? d)),
      );
    }
  }
  return { parents, propertyDomains };
}

/** Every ancestor of a type, itself included. */
function ancestors(type, parents, seen = new Set()) {
  if (seen.has(type)) return seen;
  seen.add(type);
  for (const parent of parents.get(type) ?? []) ancestors(parent, parents, seen);
  return seen;
}

function validateNode(node, { parents, propertyDomains }, problems, where) {
  const types = [node["@type"]].flat().filter(Boolean);
  if (types.length === 0) {
    problems.push(`${where}: nodo sin @type`);
    return;
  }

  const applicable = new Set();
  for (const type of types) {
    if (!parents.has(type)) {
      problems.push(`${where}: el tipo "${type}" no existe en schema.org`);
      continue;
    }
    for (const ancestor of ancestors(type, parents)) applicable.add(ancestor);
  }

  for (const key of Object.keys(node)) {
    if (key.startsWith("@")) continue;
    const domains = propertyDomains.get(key);
    if (domains === undefined) {
      problems.push(`${where}: la propiedad "${key}" no existe en schema.org`);
      continue;
    }
    // A property with no declared domain is usable anywhere.
    if (domains.length > 0 && !domains.some((d) => applicable.has(d))) {
      problems.push(
        `${where}: "${key}" no está declarada para ${types.join("+")} ` +
          `(schema.org la declara para: ${domains.slice(0, 5).join(", ")})`,
      );
    }
  }

  // Recurse into embedded nodes (PostalAddress, GeoCoordinates, ...).
  for (const [key, value] of Object.entries(node)) {
    for (const child of [value].flat()) {
      if (child && typeof child === "object" && child["@type"]) {
        validateNode(child, { parents, propertyDomains }, problems, `${where} > ${key}`);
      }
    }
  }
}

const vocabulary = await loadVocabulary(process.argv[2]);
const index = indexVocabulary(vocabulary);
console.log(`\nVocabulario schema.org: ${index.parents.size} tipos, ${index.propertyDomains.size} propiedades\n`);

let failed = 0;
for (const route of ROUTES) {
  const file = join(DIST, outputFileFor(route.path));
  const html = await readFile(file, "utf8");
  const block = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!block) {
    console.log(`  ✗ ${route.path}: sin bloque JSON-LD`);
    failed += 1;
    continue;
  }

  const graph = JSON.parse(block[1]);
  const nodes = graph["@graph"] ?? [graph];
  const problems = [];

  for (const node of nodes) {
    validateNode(node, index, problems, `${route.path} ${[node["@type"]].flat().join("+")}`);
  }

  // Every internal reference must point at a node that exists in this graph.
  const ids = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
  const walk = (value, where) => {
    for (const item of [value].flat()) {
      if (!item || typeof item !== "object") continue;
      const keys = Object.keys(item);
      if (keys.length === 1 && keys[0] === "@id" && !ids.has(item["@id"])) {
        problems.push(`${where}: la referencia "${item["@id"]}" no existe en el @graph`);
      }
      for (const [k, v] of Object.entries(item)) if (k !== "@id") walk(v, where);
    }
  };
  for (const node of nodes) walk(node, `${route.path} ${[node["@type"]].flat().join("+")}`);

  if (problems.length) {
    failed += 1;
    console.log(`  ✗ ${route.path}`);
    for (const problem of [...new Set(problems)]) console.log(`      ${problem}`);
  } else {
    console.log(`  ✓ ${route.path.padEnd(16)} ${nodes.length} nodos válidos`);
  }
}

console.log(
  failed === 0
    ? `\nJSON-LD válido contra el vocabulario oficial en las ${ROUTES.length} rutas.\n`
    : `\n${failed} ruta(s) con problemas de schema.\n`,
);
process.exit(failed === 0 ? 0 : 1);
