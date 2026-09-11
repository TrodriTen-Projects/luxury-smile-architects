import { pick, type SiteContent } from "@/lib/content";
import { ORIGIN } from "@/lib/routes";

/**
 * JSON-LD for the whole site, built from `site.json` rather than from values
 * copied into code: edit the content and the next build emits the new schema.
 *
 * One `@graph` per page, with stable `@id`s so the clinic, the people and the
 * procedures are the *same* entities on every page instead of six unrelated
 * copies. Cross-references (`employee`, `availableService`, `worksFor`) are
 * what let a search engine or an LLM connect "Dr. Martín Prato" to this clinic
 * and to the treatments it offers.
 *
 * Deliberately absent:
 *  - `Review` / `AggregateRating`. The reviews in site.json are copied from
 *    Google, and Google's structured-data policy disallows marking up reviews
 *    collected elsewhere or self-serving ratings on a LocalBusiness. On a
 *    healthcare site a manual action would cost far more than star snippets.
 *    The stars belong on the Business Profile, which is where they come from.
 *  - `priceRange` and `offers`. No prices exist in the repo; inventing a range
 *    would be publishing a figure nobody approved.
 *  - Credential fields on `Person` (`alumniOf`, licence numbers). Not in the
 *    content, and a medical site is the last place to guess at them.
 */

const CLINIC_ID = `${ORIGIN}/#clinic`;
const WEBSITE_ID = `${ORIGIN}/#website`;

export interface SchemaPage {
  key: string;
  path: string;
  title: string;
  description: string;
  /** Absolute URL of the page's social image, reused as the entity image. */
  image: string;
}

/** Stable per-entity ids, so every page refers to the same thing. */
const personId = (id: string) => `${ORIGIN}/equipo#${id}`;
const procedureId = (id: string) => `${ORIGIN}/tratamientos#${id}`;

function clinicNode(content: SiteContent, lang: string) {
  const { business } = content;
  const address = business.address;

  const contactPoints = [
    {
      "@type": "ContactPoint",
      contactType: "reservations",
      telephone: business.phone,
      email: business.email,
      availableLanguage: ["es", "en"],
    },
  ];
  // Second line only when it is genuinely a different number.
  if (business.phoneSecondary && business.phoneSecondary !== business.phone) {
    contactPoints.push({
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: business.phoneSecondary,
      email: business.email,
      availableLanguage: ["es", "en"],
    });
  }

  const sameAs = [business.instagram].filter(Boolean);

  return {
    // MedicalClinic is in the list because `availableService` is declared for
    // it and not for Dentist — and a dental clinic genuinely is one, so this
    // states a fact rather than working around the vocabulary.
    "@type": ["Dentist", "MedicalClinic", "MedicalBusiness", "LocalBusiness"],
    "@id": CLINIC_ID,
    name: "Luxury Smile Architects",
    url: `${ORIGIN}/`,
    image: `${ORIGIN}/og-default.jpg`,
    logo: `${ORIGIN}/og-default.jpg`,
    telephone: business.phone,
    email: business.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.geo.latitude,
      longitude: business.geo.longitude,
    },
    hasMap: business.reviewsUrl,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: business.hours.days,
        opens: business.hours.opens,
        closes: business.hours.closes,
      },
    ],
    contactPoint: contactPoints,
    medicalSpecialty: "Dentistry",
    areaServed: { "@type": "City", name: address.city },
    currenciesAccepted: "EUR",
    sameAs,
    employee: content.team.map((member) => ({ "@id": personId(member.id) })),
    availableService: content.treatments.map((t) => ({ "@id": procedureId(t.id) })),
    description: pickDescription(lang),
  };
}

function pickDescription(lang: string): string {
  return lang.startsWith("en")
    ? "Boutique aesthetic dentistry clinic in the Salamanca district of Madrid, led by Dr. Martín Prato."
    : "Clínica boutique de odontología estética en el Barrio de Salamanca, Madrid, dirigida por el Dr. Martín Prato.";
}

function personNodes(content: SiteContent, lang: string) {
  return content.team.map((member) => ({
    "@type": "Person",
    "@id": personId(member.id),
    name: member.name,
    jobTitle: pick(member.role, lang),
    description: pick(member.bio, lang),
    image: `${ORIGIN}${member.photo}`,
    worksFor: { "@id": CLINIC_ID },
  }));
}

function procedureNodes(content: SiteContent, lang: string) {
  // No `procedureType`: the list mixes noninvasive work (whitening, veneers)
  // with surgery (implants, extractions, oral surgery). One blanket value would
  // be wrong for half of them, and this is a medical site.
  return content.treatments.map((treatment) => ({
    "@type": "MedicalProcedure",
    "@id": procedureId(treatment.id),
    name: pick(treatment.name, lang),
    description: pick(treatment.summary, lang),
    image: `${ORIGIN}${treatment.image}`,
    // No `provider`: schema.org does not declare it for MedicalProcedure. The
    // link to the clinic is expressed the other way round, through the clinic's
    // `availableService`.
  }));
}

function breadcrumb(page: SchemaPage, lang: string) {
  const home = lang.startsWith("en") ? "Home" : "Inicio";
  const items = [{ name: home, path: "/" }];
  if (page.path !== "/") items.push({ name: page.title.split("·")[0].trim(), path: page.path });

  return {
    "@type": "BreadcrumbList",
    "@id": `${ORIGIN}${page.path}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${ORIGIN}${item.path}`,
    })),
  };
}

export function buildGraph(content: SiteContent, page: SchemaPage, lang: string): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      clinicNode(content, lang),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${ORIGIN}/`,
        name: "Luxury Smile Architects",
        inLanguage: lang.startsWith("en") ? "en" : "es",
        publisher: { "@id": CLINIC_ID },
      },
      {
        "@type": "WebPage",
        "@id": `${ORIGIN}${page.path}#webpage`,
        url: `${ORIGIN}${page.path}`,
        name: page.title,
        description: page.description,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": CLINIC_ID },
        primaryImageOfPage: page.image,
        inLanguage: lang.startsWith("en") ? "en" : "es",
      },
      breadcrumb(page, lang),
      ...personNodes(content, lang),
      ...procedureNodes(content, lang),
    ],
  };
}
