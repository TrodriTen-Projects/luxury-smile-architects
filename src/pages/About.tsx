import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MapPin, Clock, Check } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/SectionReveal";

export default function About() {
  const { t } = useTranslation();

  const [activeLocation, setActiveLocation] = useState<"clinic" | "lab" | null>(null);

  return (
    <>
      <header className="px-6 pb-12 pt-36 lg:px-12 lg:pt-48">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <span className="eyebrow">{t("about.kicker")}</span>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <h1 className="display mt-7 text-[clamp(2.6rem,8vw,6.5rem)] text-foreground">
              {t("about.title")}
            </h1>
          </SectionReveal>
        </div>
      </header>

      {/* Main Intro Image + Text */}
      <section className="px-6 pb-24 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <div className="relative aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] w-full overflow-hidden rounded-[2rem] bg-foreground/5">
              <img
                src="/media/images/about-hero.jpeg"
                alt={t("about.title")}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: "50% 40%" }}
              />
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div className="mx-auto mt-16 max-w-4xl text-center">
              <p className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] leading-snug text-foreground">
                "{t("about.introText")}"
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Identity Boxes */}
      <section className="border-t border-border py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <SectionReveal className="text-center">
            <h2 className="display text-[clamp(2rem,4vw,3.5rem)] uppercase text-gold">
              {t("about.identity.title")}
            </h2>
          </SectionReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {([1, 2, 3] as const).map((n, i) => (
              <SectionReveal key={n} delay={i * 0.1}>
                <div className="flex h-full flex-col gap-6 rounded-[1.75rem] border border-gold/60 bg-surface p-8 text-center shadow-[0_12px_34px_-20px_rgba(0,0,0,0.4)] sm:p-10">
                  <h3 className="font-sans text-xl font-bold uppercase tracking-widest text-foreground">
                    {t(`about.identity.box${n}Title`)}
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-muted sm:text-[1.05rem]">
                    {t(`about.identity.box${n}Text`)}
                  </p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Locations (Videos) */}
      <section className="section border-t border-border">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <span className="eyebrow">{t("about.locationsKicker")}</span>
            <h2 className="display mt-5 text-[clamp(2.2rem,5vw,4rem)]">
              {t("about.locationsTitle")}
            </h2>
          </SectionReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:gap-16">
            {/* Clinic Card */}
            <SectionReveal>
              <button
                type="button"
                onClick={() => setActiveLocation("clinic")}
                className="group relative block w-full overflow-hidden rounded-[1.75rem] border border-gold/60 bg-base p-1.5 shadow-[0_12px_34px_-20px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-2 text-left"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[1.4rem] bg-foreground/5">
                  <video
                    src="/media/video/reel-01.mp4"
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 transition-opacity group-hover:opacity-90">
                    <h3 className="font-serif text-3xl text-white mb-2">{t("about.clinicTitle")}</h3>
                    <p className="font-sans text-sm text-white/80 line-clamp-2">{t("about.clinicDesc")}</p>
                    <div className="mt-6 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-gold">
                      <span className="underline">{t("common.moreInfo")}</span>
                    </div>
                  </div>
                </div>
              </button>
            </SectionReveal>

            {/* Lab Card */}
            <SectionReveal delay={0.1}>
              <button
                type="button"
                onClick={() => setActiveLocation("lab")}
                className="group relative block w-full overflow-hidden rounded-[1.75rem] border border-gold/60 bg-base p-1.5 shadow-[0_12px_34px_-20px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-2 text-left"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[1.4rem] bg-foreground/5">
                  <video
                    src="/media/video/reel-02.mp4"
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 transition-opacity group-hover:opacity-90">
                    <h3 className="font-serif text-3xl text-white mb-2">{t("about.labTitle")}</h3>
                    <p className="font-sans text-sm text-white/80 line-clamp-2">{t("about.labDesc")}</p>
                    <div className="mt-6 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-gold">
                      <span className="underline">{t("common.moreInfo")}</span>
                    </div>
                  </div>
                </div>
              </button>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Financing */}
      <section className="border-t border-border bg-foreground px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-24">
            <div>
              <h2 className="display text-[clamp(2.4rem,5.5vw,4.5rem)] text-[hsl(var(--base))]">
                {t("about.financeTitle")}
              </h2>
              <p className="mt-6 max-w-2xl text-pretty font-sans text-xl font-light leading-relaxed text-[hsl(var(--base))]/80">
                {t("about.financeDesc")}
              </p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Button asChild variant="primary" className="bg-gold text-foreground hover:bg-gold-deep hover:text-base border-none px-6">
                <Link to="/contacto">{t("about.financeCta")}</Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Modals for Locations */}
      <Dialog open={activeLocation === "clinic"} onOpenChange={(open) => !open && setActiveLocation(null)}>
        <DialogContent className="max-w-md p-8">
          <DialogTitle className="text-2xl font-serif text-foreground mb-4">
            {t("about.clinicTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm font-sans text-muted leading-relaxed mb-6">
            {t("about.clinicDesc")}
          </DialogDescription>
          <div className="space-y-4">
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <span className="font-sans text-sm text-foreground">{t("contact.clinic.address")}</span>
            </div>
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <span className="font-sans text-sm text-foreground">{t("contact.clinic.hours")}</span>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button asChild variant="primary" className="flex-1">
              <Link to="/contacto" onClick={() => setActiveLocation(null)}>{t("common.bookCta")}</Link>
            </Button>
            <Button variant="outline" className="px-4" onClick={() => setActiveLocation(null)}>
              {t("common.back")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeLocation === "lab"} onOpenChange={(open) => !open && setActiveLocation(null)}>
        <DialogContent className="max-w-md p-8">
          <DialogTitle className="text-2xl font-serif text-foreground mb-4">
            {t("about.labTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm font-sans text-muted leading-relaxed mb-6">
            {t("about.labDesc")}
          </DialogDescription>
          <ul className="space-y-3 mb-8">
            <li className="flex gap-3 items-start">
              <Check className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <span className="font-sans text-sm text-foreground">Control de calidad absoluto sin intermediarios.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Check className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <span className="font-sans text-sm text-foreground">Materiales cerámicos de última generación.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Check className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <span className="font-sans text-sm text-foreground">Ajustes estéticos en tiempo real.</span>
            </li>
          </ul>
          <div className="mt-2 flex gap-3">
            <Button asChild variant="primary" className="flex-1">
              <Link to="/contacto" onClick={() => setActiveLocation(null)}>{t("common.bookCta")}</Link>
            </Button>
            <Button variant="outline" className="px-4" onClick={() => setActiveLocation(null)}>
              {t("common.back")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
