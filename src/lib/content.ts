import { useEffect, useState } from "react";

/**
 * Editable site content loaded at runtime from /content/site.json.
 * Drop images/videos into /public/media and point to them here — no rebuild
 * needed. If the file is missing or invalid, these defaults are used.
 */
export interface Review {
  author: string;
  rating: number;
  text: string;
  date?: string;
}

export interface Localized {
  es: string;
  en: string;
}

export interface TeamMember {
  id: string;
  name: string;
  photo: string;
  role: Localized;
  credentials: Localized;
  bio: Localized;
}

export interface Treatment {
  id: string;
  image: string;
  name: Localized;
  tagline: Localized;
  summary: Localized;
}

/** Pick the string for the active language, falling back to Spanish. */
export function pick(value: Localized, lang: string): string {
  return lang.startsWith("en") ? value.en : value.es;
}

export interface SiteContent {
  hero: { image: string; fallback: string; position: string };
  logo: { image: string | null };
  treatments: Treatment[];
  patients: string[];
  videos: string[];
  reels: string[];
  team: TeamMember[];
  beforeAfter: { before: string; after: string }[];
  business: {
    placeQuery: string;
    whatsapp: string;
    reviewsUrl: string;
    rating: string | null;
    reviewsCount: string | null;
    placeId: string | null;
    googleApiKey: string | null;
  };
  reviews: Review[];
}

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    image: "/media/hero-main.jpg",
    fallback: "/media/images/portrait-01.jpg",
    position: "50% 5%",
  },
  logo: { image: null },
  treatments: [
    {
      id: "estetica",
      image: "/media/images/portrait-01.jpg",
      name: { es: "Estética Dental", en: "Dental Aesthetics" },
      tagline: { es: "Sonrisa transformadora", en: "A transformed smile" },
      summary: {
        es: "Carillas, diseño de sonrisa y más para mejorar la armonía de tu sonrisa con un resultado natural que potencia tu confianza.",
        en: "Veneers, smile design and more to improve your smile's harmony with a natural result that boosts your confidence.",
      },
    },
    {
      id: "rehabilitacion",
      image: "/media/images/case-implant.jpg",
      name: { es: "Rehabilitación Oral", en: "Oral Rehabilitation" },
      tagline: { es: "Función recuperada", en: "Function restored" },
      summary: {
        es: "Restauramos la función y la estética de tu boca con prótesis de precisión, para una sonrisa armónica y duradera.",
        en: "We restore the function and aesthetics of your mouth with precision prosthetics, for a harmonious, lasting smile.",
      },
    },
    {
      id: "digital",
      image: "/media/images/case-veneers.jpg",
      name: { es: "Rehabilitación Oral Digital", en: "Digital Oral Rehabilitation" },
      tagline: { es: "Diseño digital", en: "Digital design" },
      summary: {
        es: "Escaneamos tu boca y diseñamos tu sonrisa con tecnología digital, para un tratamiento más cómodo y exacto. Ves el resultado antes de empezar.",
        en: "We scan your mouth and design your smile digitally, for a more comfortable, exact treatment. You see the result before we start.",
      },
    },
    {
      id: "endodoncia",
      image: "/media/results/veneers-before.jpg",
      name: { es: "Endodoncia", en: "Endodontics" },
      tagline: { es: "Salva tu diente", en: "Save your tooth" },
      summary: {
        es: "Tratamiento del interior del diente para eliminar el dolor de una infección profunda y conservar la pieza.",
        en: "Treatment of the inside of the tooth to remove the pain of a deep infection and preserve the piece.",
      },
    },
    {
      id: "periodoncia",
      image: "/media/results/veneers-before.jpg",
      name: { es: "Periodoncia", en: "Periodontics" },
      tagline: { es: "Encías sanas", en: "Healthy gums" },
      summary: {
        es: "Prevención y tratamiento de las enfermedades de las encías y el hueso para evitar la pérdida de dientes.",
        en: "Prevention and treatment of gum and bone disease to avoid tooth loss.",
      },
    },
    {
      id: "blanqueamiento",
      image: "/media/results/veneers-after.jpg",
      name: { es: "Blanqueamiento Dental", en: "Teeth Whitening" },
      tagline: { es: "Luz natural", en: "Natural light" },
      summary: {
        es: "Aclaramos el tono de tus dientes de forma segura y supervisada, eliminando manchas para una sonrisa más luminosa.",
        en: "We lighten the shade of your teeth safely and under supervision, removing stains for a brighter smile.",
      },
    },
    {
      id: "exodoncia",
      image: "/media/images/case-implant.jpg",
      name: { es: "Exodoncia", en: "Tooth Extraction" },
      tagline: { es: "Extracción cuidadosa", en: "Careful extraction" },
      summary: {
        es: "Extracción de piezas dañadas con la técnica más cuidadosa para minimizar molestias y proteger tu salud bucal.",
        en: "Removal of damaged teeth with the most careful technique to minimise discomfort and protect your oral health.",
      },
    },
    {
      id: "cirugia",
      image: "/media/images/case-implant.jpg",
      name: { es: "Cirugía Oral", en: "Oral Surgery" },
      tagline: { es: "Salud sin complicaciones", en: "Health without complications" },
      summary: {
        es: "Procedimientos quirúrgicos seguros para tratar piezas, lesiones y quistes, restaurando tu salud bucal.",
        en: "Safe surgical procedures to treat teeth, lesions and cysts, restoring your oral health.",
      },
    },
    {
      id: "implantes",
      image: "/media/images/case-veneers.jpg",
      name: { es: "Implantes Dentales", en: "Dental Implants" },
      tagline: { es: "Raíces que perduran", en: "Roots that last" },
      summary: {
        es: "Sustituimos la raíz del diente perdido con implantes biocompatibles que se integran al hueso y lo preservan.",
        en: "We replace the root of a lost tooth with biocompatible implants that integrate with the bone and preserve it.",
      },
    },
  ],
  patients: [],
  videos: [],
  reels: [],
  team: [
    {
      id: "prato",
      name: "Dr. Martín Prato",
      photo: "/team/martin-prato.svg",
      role: {
        es: "Director clínico y arquitecto de sonrisas",
        en: "Clinical director and smile architect",
      },
      credentials: {
        es: "Odontólogo y rehabilitador oral",
        en: "Dentist and oral rehabilitator",
      },
      bio: {
        es: "Fundador de Luxury Smile Architects. Lidera cada diseño con mirada clínica y obsesión por el detalle. Para él una sonrisa no se copia de un catálogo: se construye contigo.",
        en: "Founder of Luxury Smile Architects. He leads every design with a clinical eye and obsession for detail. For him a smile is never copied from a catalogue: it is built with you.",
      },
    },
    {
      id: "amaya",
      name: "Dr. Gonzalo Amaya",
      photo: "/team/gonzalo-amaya.svg",
      role: {
        es: "Rehabilitación oral",
        en: "Oral rehabilitation",
      },
      credentials: {
        es: "Profesor titular en rehabilitación oral",
        en: "Associate professor in oral rehabilitation",
      },
      bio: {
        es: "Aporta el rigor y la precisión que sostienen los casos más complejos, con años de experiencia clínica y docente.",
        en: "Brings the rigour and precision that support the most complex cases, with years of clinical and teaching experience.",
      },
    },
    {
      id: "angarita",
      name: "Dra. Maira Alejandra Angarita",
      photo: "/team/maira-angarita.svg",
      role: {
        es: "Estética dental y diseño de sonrisa",
        en: "Dental aesthetics and smile design",
      },
      credentials: {
        es: "Estética dental",
        en: "Dental aesthetics",
      },
      bio: {
        es: "Combina arte y técnica para lograr resultados naturales que respetan los rasgos de cada paciente.",
        en: "Blends art and technique to achieve natural results that respect each patient's features.",
      },
    },
  ],
  beforeAfter: [
    { before: "/media/results/veneers-before.jpg", after: "/media/results/veneers-after.jpg" },
    { before: "/results/case-2-before.svg", after: "/results/case-2-after.svg" },
    { before: "/results/case-3-before.svg", after: "/results/case-3-after.svg" },
    { before: "/results/case-4-before.svg", after: "/results/case-4-after.svg" },
    { before: "/results/case-5-before.svg", after: "/results/case-5-after.svg" },
  ],
  business: {
    placeQuery: "Calle de Recoletos 20, 28001 Madrid",
    whatsapp: "+34689440906",
    reviewsUrl:
      "https://www.google.com/maps/search/?api=1&query=Luxury%20Smile%20Architects%20Madrid",
    rating: null,
    reviewsCount: null,
    placeId: null,
    googleApiKey: null,
  },
  reviews: [],
};

function merge(base: SiteContent, patch: Partial<SiteContent>): SiteContent {
  return {
    hero: { ...base.hero, ...(patch.hero ?? {}) },
    logo: { ...base.logo, ...(patch.logo ?? {}) },
    treatments: patch.treatments?.length ? patch.treatments : base.treatments,
    patients: patch.patients?.length ? patch.patients : base.patients,
    videos: patch.videos?.length ? patch.videos : base.videos,
    reels: patch.reels?.length ? patch.reels : base.reels,
    team: patch.team?.length ? patch.team : base.team,
    beforeAfter: patch.beforeAfter?.length ? patch.beforeAfter : base.beforeAfter,
    business: { ...base.business, ...(patch.business ?? {}) },
    reviews: patch.reviews ?? base.reviews,
  };
}

let cache: SiteContent | null = null;

export async function loadContent(): Promise<SiteContent> {
  if (cache) return cache;
  let content = DEFAULT_CONTENT;
  try {
    const res = await fetch("/content/site.json", { cache: "no-store" });
    if (res.ok) content = merge(DEFAULT_CONTENT, await res.json());
  } catch {
    /* keep defaults */
  }
  // If no patient photos were listed, auto-load whatever is in
  // /public/media/patients (indexed by scripts/gen-media-index.mjs).
  if (content.patients.length === 0) {
    try {
      const res = await fetch("/media/patients/index.json", { cache: "no-store" });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length) {
          content = { ...content, patients: list };
        }
      }
    } catch {
      /* no index, leave empty */
    }
  }
  // Same for local reel videos dropped in /public/media/video.
  if (content.videos.length === 0) {
    try {
      const res = await fetch("/media/video/index.json", { cache: "no-store" });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length) {
          content = { ...content, videos: list };
        }
      }
    } catch {
      /* no index, leave empty */
    }
  }
  cache = content;
  return cache;
}

export function useContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cache ?? DEFAULT_CONTENT);
  useEffect(() => {
    let active = true;
    void loadContent().then((c) => active && setContent(c));
    return () => {
      active = false;
    };
  }, []);
  return content;
}
