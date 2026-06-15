/**
 * Generates branded local SVG placeholders (zero external assets).
 * Swap these files with real photos/videos keeping the same filenames.
 *   node scripts/gen-placeholders.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public");

const C = {
  base: "#FAF8F4",
  surface: "#FFFFFF",
  border: "#E8E0D2",
  fg: "#1B1612",
  muted: "#726A5F",
  gold: "#91712C",
  goldDeep: "#745920",
  beige: "#C0974E",
};

async function save(rel, svg) {
  const file = resolve(root, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, svg.trim() + "\n", "utf8");
  console.log("✓", rel);
}

/* ---------- Favicon ---------- */
const favicon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${C.base}"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="${C.gold}" stroke-opacity="0.5"/>
  <text x="32" y="44" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="${C.gold}">LS</text>
</svg>`;

/* ---------- Reels (9:16) ---------- */
function reel(initials, label) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1600" role="img" aria-label="${label} placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.surface}"/>
      <stop offset="1" stop-color="${C.base}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.38" r="0.6">
      <stop offset="0" stop-color="${C.gold}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="1600" fill="url(#bg)"/>
  <rect width="900" height="1600" fill="url(#glow)"/>
  <circle cx="450" cy="600" r="170" fill="none" stroke="${C.gold}" stroke-opacity="0.55" stroke-width="2"/>
  <text x="450" y="660" text-anchor="middle" font-family="Georgia, serif" font-size="150" fill="${C.beige}">${initials}</text>
  <text x="450" y="900" text-anchor="middle" font-family="Montserrat, system-ui, sans-serif" font-size="34" letter-spacing="10" fill="${C.muted}">PLACEHOLDER · 9:16</text>
</svg>`;
}

/* ---------- Team portraits (4:5) ---------- */
function portrait(initials, label) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1250" role="img" aria-label="${label} placeholder">
  <defs>
    <linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.surface}"/>
      <stop offset="1" stop-color="${C.base}"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="1250" fill="url(#pbg)"/>
  <g fill="none" stroke="${C.border}" stroke-width="2">
    <circle cx="500" cy="470" r="160"/>
    <path d="M250 1050 q250 -360 500 0" stroke="${C.border}"/>
  </g>
  <text x="500" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="150" fill="${C.gold}" fill-opacity="0.85">${initials}</text>
</svg>`;
}

/* ---------- Before / After (smiles) ---------- */
function smile(state) {
  const after = state === "after";
  const toothFill = after ? "#FFFFFF" : "#C9B98F";
  const toothOpacity = after ? "1" : "0.85";
  // 10 teeth across an arc
  const teeth = Array.from({ length: 10 }, (_, i) => {
    const x = 360 + i * 90;
    const jitter = after ? 0 : (i % 2 === 0 ? 14 : -8);
    const h = after ? 150 : 130 + (i % 3) * 8;
    return `<rect x="${x}" y="${430 + jitter}" width="74" height="${h}" rx="20" fill="${toothFill}" fill-opacity="${toothOpacity}"/>`;
  }).join("");
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-label="${state} placeholder">
  <defs>
    <radialGradient id="lip" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0" stop-color="${C.surface}"/>
      <stop offset="1" stop-color="${C.base}"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#lip)"/>
  <path d="M300 500 q500 ${after ? 520 : 460} 1000 0 q-500 ${after ? 300 : 240} -1000 0 Z" fill="#1c0f0f"/>
  <g>${teeth}</g>
  <path d="M300 500 q500 ${after ? 520 : 460} 1000 0" fill="none" stroke="${C.gold}" stroke-opacity="${after ? "0.5" : "0.25"}" stroke-width="3"/>
</svg>`;
}

await save("favicon.svg", favicon);

await save("reels/beele.svg", reel("B", "Beéle"));
await save("reels/nicky-jam.svg", reel("NJ", "Nicky Jam"));
await save("reels/arturo-vidal.svg", reel("AV", "Arturo Vidal"));
await save("reels/matias-cardoso.svg", reel("MC", "Matías Cardoso"));

await save("team/martin-prato.svg", portrait("MP", "Dr. Martín Prato"));
await save("team/gonzalo-amaya.svg", portrait("GA", "Dr. Gonzalo Amaya"));
await save("team/maira-angarita.svg", portrait("MA", "Dra. Maira Angarita"));

for (const n of [1, 2, 3, 4, 5]) {
  await save(`results/case-${n}-before.svg`, smile("before"));
  await save(`results/case-${n}-after.svg`, smile("after"));
}

console.log("\nPlaceholders generated in /public");
