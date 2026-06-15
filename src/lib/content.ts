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

export interface SiteContent {
  hero: { image: string; fallback: string; position: string };
  logo: { image: string | null };
  services: Record<string, string>;
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
  services: {
    estetica: "/media/images/portrait-01.jpg",
    rehabilitacion: "/media/images/case-implant.jpg",
    digital: "/media/images/case-veneers.jpg",
    endodoncia: "/media/results/veneers-before.jpg",
    periodoncia: "/media/results/veneers-before.jpg",
    blanqueamiento: "/media/results/veneers-after.jpg",
    exodoncia: "/media/images/case-implant.jpg",
    cirugia: "/media/images/case-implant.jpg",
    implantes: "/media/images/case-veneers.jpg",
  },
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
    services: { ...base.services, ...(patch.services ?? {}) },
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
