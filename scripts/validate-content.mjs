/**
 * Checks the content files before anything is built.
 *
 * The CMS writes these files straight to the repository, so a bad edit reaches
 * `main` without a developer ever seeing it. Everything downstream depends on
 * their shape: the JSON-LD graph, the NAP in the footer, the sitemap. Failing
 * here gives whoever made the edit a sentence they can act on, instead of a
 * confusing prerender error twenty seconds later — and a failed build is a
 * deploy that never happens, which is the point.
 *
 *   node scripts/validate-content.mjs
 */
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

async function readJson(relative) {
  const path = join(ROOT, relative);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    problems.push(`${relative}: no es JSON válido — ${error.message}`);
    return null;
  }
}

const site = await readJson("public/content/site.json");

if (site) {
  const business = site.business ?? {};
  const address = business.address ?? {};
  const geo = business.geo ?? {};
  const hours = business.hours ?? {};

  const required = [
    ["business.phone", business.phone],
    ["business.email", business.email],
    ["business.address.street", address.street],
    ["business.address.postalCode", address.postalCode],
    ["business.address.city", address.city],
    ["business.address.country", address.country],
    ["business.hours.opens", hours.opens],
    ["business.hours.closes", hours.closes],
  ];
  for (const [name, value] of required) {
    if (!value) problems.push(`site.json: falta "${name}" (lo necesita la ficha de Google)`);
  }

  if (business.phone && !/^\+[0-9]{9,15}$/.test(business.phone)) {
    problems.push(
      `site.json: "business.phone" debe ir en formato internacional sin espacios ` +
        `(p. ej. +34689440906), y vale "${business.phone}"`,
    );
  }
  if (address.country && !/^[A-Z]{2}$/.test(address.country)) {
    problems.push(`site.json: "business.address.country" debe ser 2 letras mayúsculas, y vale "${address.country}"`);
  }
  if (typeof geo.latitude !== "number" || typeof geo.longitude !== "number") {
    problems.push('site.json: "business.geo" debe traer latitude y longitude numéricas');
  }
  if (!Array.isArray(hours.days) || hours.days.length === 0) {
    problems.push('site.json: "business.hours.days" no puede quedar vacío');
  }

  // Empty is fine and means "switched off"; wrong is not, because it breaks
  // measurement silently, which is the worst way for it to break.
  const pixel = site.tracking?.metaPixelId ?? "";
  const ga4 = site.tracking?.ga4MeasurementId ?? "";
  if (pixel && !/^[0-9]{15,16}$/.test(pixel)) {
    problems.push(`site.json: "tracking.metaPixelId" debe ser 15 o 16 dígitos, y vale "${pixel}"`);
  }
  if (ga4 && !/^G-[A-Z0-9]{6,12}$/.test(ga4)) {
    problems.push(`site.json: "tracking.ga4MeasurementId" debe empezar por G-, y vale "${ga4}"`);
  }

  // Duplicate ids would collapse two entities into one in the JSON-LD graph.
  for (const [key, label] of [["treatments", "tratamiento"], ["team", "persona"]]) {
    const items = Array.isArray(site[key]) ? site[key] : [];
    if (items.length === 0) problems.push(`site.json: "${key}" está vacío`);
    const ids = items.map((item) => item?.id).filter(Boolean);
    if (ids.length !== items.length) problems.push(`site.json: hay algún ${label} sin "id"`);
    const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicated.length) {
      problems.push(`site.json: id de ${label} repetido: ${[...new Set(duplicated)].join(", ")}`);
    }
  }
}

// La galería y los reels se editan desde el panel, que sube el archivo y
// escribe su ruta. Si una ruta señala a algo que no está en el repositorio, la
// web publica un hueco: mejor pararlo aquí. El peso solo se avisa, porque una
// foto grande ralentiza pero no rompe, y bloquear la publicación por eso
// dejaría a la clínica sin poder actualizar su propia web.
if (site) {
  const MAXIMOS = { patients: 1.5e6, videos: 8e6 };
  for (const [clave, etiqueta] of [["patients", "galería"], ["videos", "reels"]]) {
    const rutas = Array.isArray(site[clave]) ? site[clave] : [];
    for (const ruta of rutas) {
      if (typeof ruta !== "string" || !ruta.startsWith("/media/")) {
        problems.push(`site.json: "${clave}" tiene una ruta que no empieza por /media/: ${JSON.stringify(ruta)}`);
        continue;
      }
      try {
        const { size } = await stat(join(ROOT, "public", ruta.replace(/^\//, "")));
        if (size > MAXIMOS[clave]) {
          console.warn(
            `  aviso: ${ruta} pesa ${(size / 1e6).toFixed(1)} MB; conviene comprimirlo ` +
              `antes de publicarlo (${etiqueta}).`,
          );
        }
      } catch {
        problems.push(`site.json: "${clave}" apunta a ${ruta}, que no existe en public/`);
      }
    }
  }
}

for (const locale of ["es", "en"]) {
  const translation = await readJson(`public/locales/${locale}/translation.json`);
  if (!translation) continue;
  const clinic = translation.contact?.clinic ?? {};
  for (const key of ["address", "area", "phone", "email", "hours"]) {
    if (!clinic[key]) problems.push(`locales/${locale}: falta "contact.clinic.${key}"`);
  }
  if (!translation.seo) problems.push(`locales/${locale}: falta el bloque "seo"`);
}

// The phone shown on the page and the one in the schema have to agree, or the
// NAP says two different things and the schema stops helping.
if (site) {
  const schemaPhone = (site.business?.phone ?? "").replace(/[^\d+]/g, "");
  for (const locale of ["es", "en"]) {
    const translation = await readJson(`public/locales/${locale}/translation.json`);
    const shown = (translation?.contact?.clinic?.phone ?? "").replace(/[^\d+]/g, "");
    if (shown && schemaPhone && shown !== schemaPhone) {
      problems.push(
        `NAP incoherente: la web muestra ${shown} en ${locale} y el schema publica ${schemaPhone}. ` +
          `Deben ser el mismo número, y el mismo que en Google Business Profile.`,
      );
    }
  }
}

if (problems.length) {
  console.error(`\nEl contenido no es válido:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`);
  process.exit(1);
}

console.log("contenido: válido");
