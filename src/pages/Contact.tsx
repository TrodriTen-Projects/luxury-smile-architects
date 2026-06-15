import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Check,
  ArrowUpRight,
  Navigation,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionReveal } from "@/components/SectionReveal";
import { GoogleReviews } from "@/components/GoogleReviews";
import { buildContactSchema } from "@/lib/validation";
import { sanitizeLine, sanitizeBlock } from "@/lib/sanitize";
import { useContent } from "@/lib/content";

interface Treatment {
  id: string;
  name: string;
}
type FieldErrors = Partial<Record<string, string>>;

const EMPTY = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  treatment: "",
  message: "",
  consent: false,
  company: "",
};

export default function Contact() {
  const { t } = useTranslation();
  const content = useContent();
  const treatments = t("treatments.items", { returnObjects: true }) as Treatment[];
  const schema = useMemo(() => buildContactSchema(t), [t]);

  const place =
    content.business.placeQuery ||
    `${t("contact.clinic.address")}, ${t("contact.clinic.area")}`;
  const encPlace = encodeURIComponent(place);
  const mapEmbedUrl = `https://www.google.com/maps?q=${encPlace}&output=embed`;
  const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encPlace}`;
  const wazeUrl = `https://waze.com/ul?q=${encPlace}&navigate=yes`;

  const [values, setValues] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const set = (key: keyof typeof EMPTY, value: string | boolean) =>
    setValues((v) => ({ ...v, [key]: value }));

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${t("contact.clinic.address")}, ${t("contact.clinic.area")}`,
  )}`;
  const whatsappUrl = `https://wa.me/${t("contact.clinic.whatsapp").replace(/[^\d]/g, "")}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const cleaned = {
      firstName: sanitizeLine(values.firstName, 60),
      lastName: sanitizeLine(values.lastName, 60),
      phone: sanitizeLine(values.phone, 20),
      email: sanitizeLine(values.email, 120),
      treatment: sanitizeLine(values.treatment, 60),
      message: sanitizeBlock(values.message, 2000),
      consent: values.consent,
      company: sanitizeLine(values.company, 0),
    };
    if (cleaned.company) {
      setStatus("success");
      return;
    }
    const parsed = schema.safeParse(cleaned);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setStatus("submitting");
    try {
      const d = parsed.data;
      const to = t("contact.clinic.email");
      const subject = `${t("nav.book")}: ${d.firstName} ${d.lastName}`;
      const body = [
        `${t("contact.form.firstName")}: ${d.firstName} ${d.lastName}`,
        `${t("contact.form.phone")}: ${d.phone}`,
        `${t("contact.form.email")}: ${d.email}`,
        `${t("contact.form.treatment")}: ${d.treatment}`,
        d.message ? `${t("contact.form.message")}: ${d.message}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus("success");
      setValues({ ...EMPTY });
    } catch {
      setStatus("error");
    }
  };

  const rows = [
    { icon: MapPin, label: t("contact.clinic.addressLabel"), value: `${t("contact.clinic.address")}, ${t("contact.clinic.area")}`, href: mapsUrl, external: true },
    { icon: Phone, label: t("contact.clinic.phoneLabel"), value: t("contact.clinic.phone"), href: `tel:${t("contact.clinic.phone").replace(/[^\d+]/g, "")}` },
    { icon: MessageCircle, label: t("contact.clinic.whatsappLabel"), value: t("contact.clinic.whatsapp"), href: whatsappUrl, external: true },
    { icon: Mail, label: t("contact.clinic.emailLabel"), value: t("contact.clinic.email"), href: `mailto:${t("contact.clinic.email")}` },
    { icon: Clock, label: t("contact.clinic.hoursLabel"), value: t("contact.clinic.hours") },
  ];

  return (
    <>
      <header className="px-6 pb-12 pt-36 lg:px-12 lg:pt-48">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <span className="eyebrow">{t("contact.kicker")}</span>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <h1 className="display mt-7 text-[clamp(2.6rem,8vw,6.5rem)] text-foreground">
              {t("contact.title")}
            </h1>
          </SectionReveal>
          <SectionReveal delay={0.16}>
            <p className="mt-8 max-w-md font-sans text-lg font-light text-muted">
              {t("contact.subtitle")}
            </p>
          </SectionReveal>
        </div>
      </header>

      <section className="px-6 pb-32 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Clinic info */}
          <SectionReveal>
            <ul className="flex flex-col">
              {rows.map((row) => {
                const Inner = (
                  <>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-gold">
                      <row.icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-sans text-[0.58rem] uppercase tracking-[0.24em] text-muted">
                        {row.label}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1.5 font-sans text-base text-foreground">
                        {row.value}
                        {row.href && (
                          <ArrowUpRight className="h-3.5 w-3.5 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={row.label} className="border-b border-border/60 first:border-t">
                    {row.href ? (
                      <a
                        href={row.href}
                        {...(row.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="group flex items-center gap-5 py-6 transition-colors hover:text-gold"
                      >
                        {Inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-5 py-6">{Inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </SectionReveal>

          {/* Form */}
          <SectionReveal delay={0.1}>
            {status === "success" ? (
              <div className="flex min-h-[440px] flex-col items-center justify-center gap-6 border border-border/70 bg-surface/40 p-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-gold/10 text-gold">
                  <Check className="h-6 w-6" />
                </span>
                <h2 className="font-serif text-3xl text-foreground">
                  {t("contact.form.successTitle")}
                </h2>
                <p className="max-w-sm font-sans text-sm font-light text-muted">
                  {t("contact.form.success")}
                </p>
                <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
                  {t("common.back")}
                </Button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-7">
                <div className="grid gap-7 sm:grid-cols-2">
                  <Field id="firstName" label={t("contact.form.firstName")} error={errors.firstName}>
                    <Input id="firstName" autoComplete="given-name" value={values.firstName} aria-invalid={!!errors.firstName} onChange={(e) => set("firstName", e.target.value)} />
                  </Field>
                  <Field id="lastName" label={t("contact.form.lastName")} error={errors.lastName}>
                    <Input id="lastName" autoComplete="family-name" value={values.lastName} aria-invalid={!!errors.lastName} onChange={(e) => set("lastName", e.target.value)} />
                  </Field>
                </div>
                <div className="grid gap-7 sm:grid-cols-2">
                  <Field id="phone" label={t("contact.form.phone")} error={errors.phone}>
                    <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} aria-invalid={!!errors.phone} onChange={(e) => set("phone", e.target.value)} />
                  </Field>
                  <Field id="email" label={t("contact.form.email")} error={errors.email}>
                    <Input id="email" type="email" autoComplete="email" value={values.email} aria-invalid={!!errors.email} onChange={(e) => set("email", e.target.value)} />
                  </Field>
                </div>

                <Field id="treatment" label={t("contact.form.treatment")} error={errors.treatment}>
                  <select
                    id="treatment"
                    value={values.treatment}
                    aria-invalid={!!errors.treatment}
                    onChange={(e) => set("treatment", e.target.value)}
                    className={cn(
                      "h-11 w-full rounded-none border-0 border-b border-border bg-transparent px-0 font-sans text-base text-foreground transition-colors",
                      "focus-visible:border-gold focus-visible:outline-none focus-visible:ring-0",
                      "aria-[invalid=true]:border-red-400/70",
                      !values.treatment && "text-muted/70",
                    )}
                  >
                    <option value="" disabled className="bg-surface text-muted">
                      {t("contact.form.treatmentPlaceholder")}
                    </option>
                    {treatments.map((tr) => (
                      <option key={tr.id} value={tr.name} className="bg-surface text-foreground">
                        {tr.name}
                      </option>
                    ))}
                    <option value={t("contact.form.otherTreatment")} className="bg-surface text-foreground">
                      {t("contact.form.otherTreatment")}
                    </option>
                  </select>
                </Field>

                <Field id="message" label={t("contact.form.message")} error={errors.message}>
                  <Textarea id="message" value={values.message} placeholder={t("contact.form.messagePlaceholder")} onChange={(e) => set("message", e.target.value)} />
                </Field>

                {/* Honeypot */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="company">Company</label>
                  <input id="company" type="text" tabIndex={-1} autoComplete="off" value={values.company} onChange={(e) => set("company", e.target.value)} />
                </div>

                <label className="flex items-start gap-3 font-sans text-xs font-light text-muted">
                  <input type="checkbox" checked={values.consent} onChange={(e) => set("consent", e.target.checked)} aria-invalid={!!errors.consent} className="mt-0.5 h-4 w-4 shrink-0 accent-gold" />
                  <span>
                    {t("contact.form.consent")}
                    {errors.consent && (
                      <span className="mt-1 block text-red-400" role="alert">
                        {errors.consent}
                      </span>
                    )}
                  </span>
                </label>

                {status === "error" && (
                  <p className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
                    {t("contact.form.error")}
                  </p>
                )}

                <Button type="submit" size="lg" className="mt-2 w-full" disabled={status === "submitting"}>
                  {status === "submitting" ? t("contact.form.submitting") : t("contact.form.submit")}
                </Button>
              </form>
            )}
          </SectionReveal>
        </div>
      </section>

      {/* ---------- MAP + DIRECTIONS ---------- */}
      <section className="section border-t border-border">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">{t("contact.map.kicker")}</span>
              <h2 className="display mt-5 text-[clamp(1.8rem,4vw,3rem)]">
                {t("contact.map.title")}
              </h2>
              <p className="mt-4 font-sans text-sm text-muted">
                {t("contact.clinic.address")}, {t("contact.clinic.area")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="primary" size="sm">
                <a href={mapsDirUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="h-4 w-4" />
                  {t("contact.map.maps")}
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
                  {t("contact.map.waze")}
                </a>
              </Button>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1} className="mt-10">
            <div className="overflow-hidden rounded-[3px] border border-border">
              <iframe
                title={t("contact.map.title")}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full sm:h-[440px]"
                style={{ border: 0, filter: "grayscale(0.2)" }}
              />
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ---------- REVIEWS (Google) ---------- */}
      <section className="section border-t border-border">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">{t("contact.reviews.kicker")}</span>
              <h2 className="display mt-5 text-[clamp(1.8rem,4vw,3rem)]">
                {t("contact.reviews.title")}
              </h2>
              {content.business.rating && (
                <p className="mt-4 inline-flex items-center gap-2 font-sans text-sm text-foreground">
                  <span className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  {content.business.rating}
                  {content.business.reviewsCount
                    ? ` · ${content.business.reviewsCount}`
                    : ""}
                </p>
              )}
            </div>
            <a
              href={content.business.reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline inline-flex items-center gap-2 font-sans text-[0.72rem] uppercase tracking-[0.2em] text-gold"
            >
              {t("contact.reviews.cta")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </SectionReveal>

          <GoogleReviews
            placeId={content.business.placeId}
            apiKey={content.business.googleApiKey}
            fallback={content.reviews}
            reviewsUrl={content.business.reviewsUrl}
            cta={t("contact.reviews.cta")}
            empty={t("contact.reviews.empty")}
          />
        </div>
      </section>
    </>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="mt-2 font-sans text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
