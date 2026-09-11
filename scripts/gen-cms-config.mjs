/**
 * Builds `public/admin/config.yml` for Sveltia CMS.
 *
 * Generated rather than hand-written for one specific reason: a `file`
 * collection writes back ONLY the fields it declares and silently drops
 * everything else. A hand-maintained config that missed one key in
 * `translation.json` would delete that translation the first time someone
 * saved the file. The locale fields are therefore derived from the JSON that
 * actually exists, so the config can never be narrower than the data.
 *
 * The site.json side is spelled out by hand instead, because that is where a
 * non-technical editor actually works and the labels need to read like Spanish
 * rather than like key names.
 *
 *   node scripts/gen-cms-config.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ORIGIN } from "./routes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "TrodriTen-Projects/luxury-smile-architects";
const BRANCH = "master";

/* ---------------------------------------------------------------- YAML ---- */

function quote(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function toYaml(value, indent = 0) {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value
      .map((item) => {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          const body = toYaml(item, indent + 1);
          return `${pad}- ${body.slice((indent + 1) * 2)}`;
        }
        return `${pad}- ${typeof item === "string" ? quote(item) : item}`;
      })
      .join("\n");
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => {
        if (val === null || val === undefined) return `${pad}${key}:`;
        if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
          const body = toYaml(val, indent + 1);
          return `${pad}${key}:\n${body}`;
        }
        return `${pad}${key}: ${typeof val === "string" ? quote(val) : val}`;
      })
      .join("\n");
  }
  return `${pad}${typeof value === "string" ? quote(value) : value}`;
}

/* ------------------------------------------------- locale introspection ---- */

/** Turn "whatsappLabel" into "Whatsapp label" so the form reads as words. */
function humanise(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Mirror a translation object as CMS fields. Every key present in the file
 * gets a field, which is what keeps a save from dropping anything.
 */
function fieldsFromObject(object, path = "") {
  return Object.entries(object).map(([key, value]) => {
    const label = humanise(key);
    if (typeof value === "string") {
      return {
        name: key,
        label,
        widget: "string",
        required: false,
        ...(value.length > 90 ? { widget: "text" } : {}),
      };
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return { name: key, label, widget: "string", required: false };
    }
    if (Array.isArray(value)) {
      const sample = value.find((v) => v && typeof v === "object");
      return sample
        ? { name: key, label, widget: "list", required: false, fields: fieldsFromObject(sample, `${path}.${key}`) }
        : { name: key, label, widget: "list", required: false };
    }
    return {
      name: key,
      label,
      widget: "object",
      required: false,
      collapsed: true,
      fields: fieldsFromObject(value, `${path}.${key}`),
    };
  });
}

/* --------------------------------------------------- site.json, by hand ---- */

const localized = (name, label, widget = "string") => ({
  name,
  label,
  widget: "object",
  fields: [
    { name: "es", label: "Español", widget },
    { name: "en", label: "Inglés", widget },
  ],
});

const siteFields = [
  {
    name: "_readme",
    label: "Notas internas (no tocar)",
    widget: "text",
    required: false,
  },
  {
    name: "hero",
    label: "Portada",
    widget: "object",
    fields: [
      { name: "image", label: "Foto principal", widget: "image" },
      { name: "fallback", label: "Foto alternativa", widget: "image", required: false },
      {
        name: "position",
        label: "Encuadre (p. ej. 50% 0%)",
        widget: "string",
        hint: "El segundo número sube o baja el recorte: 0% arriba, 100% abajo. También decide el recorte de la imagen que se ve al compartir el enlace.",
      },
    ],
  },
  {
    name: "logo",
    label: "Logotipo",
    widget: "object",
    fields: [{ name: "image", label: "Imagen del logo", widget: "image", required: false }],
  },
  {
    name: "treatments",
    label: "Tratamientos",
    label_singular: "Tratamiento",
    widget: "list",
    summary: "{{fields.name.es}}",
    hint: "Cada tratamiento aparece en la página de Tratamientos, en el inicio y en el desplegable de Contacto. También se publica como dato estructurado para Google.",
    fields: [
      { name: "id", label: "Identificador único (sin espacios)", widget: "string", pattern: ["^[a-z0-9-]+$", "Solo minúsculas, números y guiones"] },
      { name: "image", label: "Imagen", widget: "image" },
      localized("name", "Nombre"),
      localized("tagline", "Frase corta"),
      localized("summary", "Descripción", "text"),
    ],
  },
  {
    name: "team",
    label: "Equipo",
    label_singular: "Persona",
    widget: "list",
    summary: "{{fields.name}}",
    fields: [
      { name: "id", label: "Identificador único (sin espacios)", widget: "string", pattern: ["^[a-z0-9-]+$", "Solo minúsculas, números y guiones"] },
      { name: "name", label: "Nombre completo", widget: "string" },
      { name: "photo", label: "Foto", widget: "image" },
      localized("role", "Puesto"),
      localized("credentials", "Titulación"),
      localized("bio", "Biografía", "text"),
    ],
  },
  {
    name: "beforeAfter",
    label: "Casos antes y después",
    label_singular: "Caso",
    widget: "list",
    fields: [
      { name: "before", label: "Antes", widget: "image" },
      { name: "after", label: "Después", widget: "image" },
    ],
  },
  {
    name: "business",
    label: "Datos de la clínica",
    widget: "object",
    hint: "Estos datos alimentan la ficha que leen Google y los asistentes de IA. Deben coincidir exactamente con Google Business Profile.",
    fields: [
      { name: "placeQuery", label: "Dirección para el mapa", widget: "string" },
      {
        name: "phone",
        label: "Teléfono principal",
        widget: "string",
        hint: "Formato internacional sin espacios, p. ej. +34689440906. Debe ser el mismo que figura en Google Business Profile.",
        pattern: ["^\\+[0-9]{9,15}$", "Formato internacional, p. ej. +34689440906"],
      },
      {
        name: "phoneSecondary",
        label: "Teléfono secundario",
        widget: "string",
        required: false,
        pattern: ["^\\+[0-9]{9,15}$", "Formato internacional, p. ej. +34659716995"],
      },
      {
        name: "whatsapp",
        label: "WhatsApp",
        widget: "string",
        pattern: ["^\\+[0-9]{9,15}$", "Formato internacional, p. ej. +34689440906"],
      },
      { name: "email", label: "Email", widget: "string" },
      {
        name: "address",
        label: "Dirección",
        widget: "object",
        fields: [
          { name: "street", label: "Calle y número", widget: "string" },
          { name: "district", label: "Barrio", widget: "string" },
          { name: "postalCode", label: "Código postal", widget: "string" },
          { name: "city", label: "Ciudad", widget: "string" },
          { name: "region", label: "Provincia", widget: "string" },
          { name: "country", label: "País (2 letras, p. ej. ES)", widget: "string", pattern: ["^[A-Z]{2}$", "Dos letras mayúsculas"] },
        ],
      },
      {
        name: "geo",
        label: "Coordenadas",
        widget: "object",
        hint: "Se obtienen en Google Maps: clic derecho sobre el local y 'Qué hay aquí'.",
        fields: [
          { name: "latitude", label: "Latitud", widget: "number", value_type: "float" },
          { name: "longitude", label: "Longitud", widget: "number", value_type: "float" },
        ],
      },
      {
        name: "hours",
        label: "Horario",
        widget: "object",
        hint: "Solo los días que se abre. No listar un día equivale a cerrado.",
        fields: [
          {
            name: "days",
            label: "Días (en inglés: Monday, Tuesday…)",
            widget: "list",
          },
          { name: "opens", label: "Abre (HH:MM)", widget: "string", pattern: ["^[0-2][0-9]:[0-5][0-9]$", "Formato HH:MM"] },
          { name: "closes", label: "Cierra (HH:MM)", widget: "string", pattern: ["^[0-2][0-9]:[0-5][0-9]$", "Formato HH:MM"] },
        ],
      },
      { name: "reviewsUrl", label: "Enlace a las reseñas de Google", widget: "string" },
      { name: "instagram", label: "Instagram", widget: "string" },
      { name: "rating", label: "Nota media (p. ej. 5.0)", widget: "string", required: false },
      localized("reviewsCount", "Número de reseñas (texto)"),
    ],
  },
  {
    name: "tracking",
    label: "Medición",
    widget: "object",
    hint: "Dejar vacío desactiva esa herramienta, sin errores. Nada se activa hasta que el visitante acepta las cookies.",
    fields: [
      {
        name: "metaPixelId",
        label: "ID del píxel de Meta",
        widget: "string",
        required: false,
        pattern: ["^$|^[0-9]{15,16}$", "15 o 16 dígitos, o vacío para desactivarlo"],
      },
      {
        name: "ga4MeasurementId",
        label: "ID de medición de Google Analytics 4",
        widget: "string",
        required: false,
        pattern: ["^$|^G-[A-Z0-9]{6,12}$", "Empieza por G-, o vacío para desactivarlo"],
      },
    ],
  },
  {
    name: "reviews",
    label: "Reseñas",
    label_singular: "Reseña",
    widget: "list",
    summary: "{{fields.author}}",
    hint: "Se muestran en la web como contenido. No se publican como dato estructurado: las directrices de Google prohíben marcar reseñas copiadas de otro sitio.",
    fields: [
      { name: "author", label: "Autor", widget: "string" },
      { name: "rating", label: "Estrellas (1 a 5)", widget: "number", value_type: "int", min: 1, max: 5 },
      localized("text", "Texto", "text"),
      localized("date", "Fecha (texto)"),
    ],
  },
];

/* ------------------------------------------------------------- assemble ---- */

const es = JSON.parse(await readFile(join(ROOT, "public/locales/es/translation.json"), "utf8"));
const en = JSON.parse(await readFile(join(ROOT, "public/locales/en/translation.json"), "utf8"));

const config = {
  backend: {
    name: "github",
    repo: REPO,
    branch: BRANCH,
    base_url: ORIGIN,
    auth_endpoint: "api/auth",
    commit_messages: {
      update: "contenido: actualiza {{collection}}",
      uploadMedia: "contenido: sube {{path}}",
      deleteMedia: "contenido: elimina {{path}}",
    },
  },
  // Uploads land next to the existing photos, and scripts/gen-media-index.mjs
  // indexes those folders on the next build, so new patient photos and reels
  // appear on the site without anyone editing a list.
  media_folder: "public/media",
  public_folder: "/media",
  locale: "es",
  publish_mode: "simple",
  collections: [
    {
      name: "contenido",
      label: "Contenido",
      files: [
        {
          name: "site",
          label: "Clínica, equipo y tratamientos",
          file: "public/content/site.json",
          description:
            "Datos de la clínica, equipo, tratamientos, casos y reseñas. Al guardar se publica solo en unos minutos.",
          fields: siteFields,
        },
        {
          name: "locale_es",
          label: "Textos en español",
          file: "public/locales/es/translation.json",
          description: "Todos los textos visibles de la web en español.",
          fields: fieldsFromObject(es),
        },
        {
          name: "locale_en",
          label: "Textos en inglés",
          file: "public/locales/en/translation.json",
          description: "Los mismos textos, en inglés.",
          fields: fieldsFromObject(en),
        },
      ],
    },
  ],
};

const header = [
  "# GENERADO por scripts/gen-cms-config.mjs — no editar a mano.",
  "# Los campos de los archivos de idioma se derivan del JSON real: un campo",
  "# que faltara aquí borraría esa traducción al guardar desde el CMS.",
  "",
].join("\n");

await mkdir(join(ROOT, "public/admin"), { recursive: true });
await writeFile(join(ROOT, "public/admin/config.yml"), header + toYaml(config) + "\n", "utf8");

const count = (fields) =>
  fields.reduce((total, f) => total + 1 + (f.fields ? count(f.fields) : 0), 0);
console.log(
  `config.yml: ${count(siteFields)} campos en site.json, ` +
    `${count(fieldsFromObject(es))} en es, ${count(fieldsFromObject(en))} en en`,
);
