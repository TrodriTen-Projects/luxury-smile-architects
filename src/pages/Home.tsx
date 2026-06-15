import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import { ArrowDown, ArrowUpRight, Camera } from "lucide-react";

import { SectionReveal } from "@/components/SectionReveal";
import { ReelsSection } from "@/components/ReelsSection";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useContent } from "@/lib/content";

interface Treatment {
  id: string;
  name: string;
  tagline: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const { t } = useTranslation();
  const content = useContent();
  const treatments = t("treatments.items", { returnObjects: true }) as Treatment[];
  const patients = content.patients;

  return (
    <>
      {/* ---------- HERO (editorial photo) ---------- */}
      <section className="relative min-h-[100svh] overflow-hidden">
        {/* Image: full-bleed on mobile, contained right half on desktop */}
        <div className="pointer-events-none absolute inset-0 lg:left-[48%]">
          <img
            src={content.hero.image}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = content.hero.fallback;
            }}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="h-full w-full object-cover"
            style={{ objectPosition: content.hero.position }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-base/30 lg:bg-gradient-to-r lg:from-base lg:via-base/20 lg:to-transparent" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-base/70 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] items-center px-6 pt-24 lg:px-12">
          <div className="w-full lg:w-[54%] lg:pr-10">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="eyebrow"
          >
            {t("hero.kicker")}
          </motion.p>

          <h1 className="display mt-7 text-[clamp(2.8rem,7vw,6rem)]">
            <motion.span
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.08 }}
              className="block text-foreground"
            >
              {t("hero.title")}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.18 }}
              className="display-light block italic text-gold-gradient"
            >
              {t("hero.titleAccent")}
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.34 }}
            className="mt-10 flex max-w-md flex-col gap-7 border-t border-foreground/15 pt-7"
          >
            <p className="font-sans text-base font-light text-foreground/75">
              {t("hero.subtitle")}
            </p>
            <div className="flex items-center gap-8">
              <Link
                to="/contacto"
                className="link-underline font-sans text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-gold"
              >
                {t("hero.ctaPrimary")}
              </Link>
              <Link
                to="/resultados"
                className="link-underline font-sans text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-foreground"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 1 }}
          className="pointer-events-none absolute bottom-8 left-6 z-10 hidden text-muted lg:left-12 lg:flex"
        >
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.span>
        </motion.div>
      </section>

      {/* ---------- STORYTELLING (text only) ---------- */}
      <section className="section border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <SectionReveal>
            <span className="eyebrow">{t("home.introKicker")}</span>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <h2 className="display mt-6 text-[clamp(2rem,5vw,3.6rem)] text-foreground">
              {t("home.introTitle")}
            </h2>
          </SectionReveal>
          <SectionReveal delay={0.16}>
            <p className="mx-auto mt-7 max-w-xl text-pretty font-sans text-lg font-light leading-relaxed text-muted">
              {t("home.introText")}
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ---------- TREATMENTS preview (all) ---------- */}
      <section className="section border-t border-border">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal className="flex items-end justify-between">
            <div>
              <span className="eyebrow">{t("home.treatmentsKicker")}</span>
              <h2 className="display mt-6 text-[clamp(2.2rem,5vw,4rem)]">
                {t("home.treatmentsTitle")}
              </h2>
            </div>
            <Link
              to="/tratamientos"
              className="link-underline hidden font-sans text-[0.72rem] uppercase tracking-[0.2em] text-gold sm:inline"
            >
              {t("common.allTreatments")}
            </Link>
          </SectionReveal>

          <ul className="mt-14">
            {treatments.map((item, i) => (
              <SectionReveal as="li" key={item.id} delay={(i % 3) * 0.04}>
                <Link
                  to="/tratamientos"
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 border-t border-border py-6 transition-colors last:border-b hover:bg-elevated"
                >
                  <span className="index-num text-xl sm:text-2xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-5">
                    <span className="font-serif text-xl text-foreground transition-colors group-hover:text-gold sm:text-2xl">
                      {item.name}
                    </span>
                    <span className="font-sans text-[0.64rem] uppercase tracking-[0.22em] text-muted">
                      {item.tagline}
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                </Link>
              </SectionReveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- CTA band (after treatments, before carousels) ---------- */}
      <section className="border-y border-border bg-elevated/50">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-8 px-6 py-20 text-center lg:px-12 lg:py-24">
          <SectionReveal>
            <h2 className="display text-[clamp(2rem,5vw,3.6rem)] text-foreground">
              {t("home.ctaTitle")}
            </h2>
          </SectionReveal>
          <SectionReveal delay={0.06}>
            <p className="mx-auto max-w-2xl text-pretty font-sans text-base font-light leading-relaxed text-muted">
              {t("home.ctaText")}
            </p>
          </SectionReveal>
          <SectionReveal delay={0.12}>
            <Button asChild size="lg">
              <Link to="/contacto">{t("common.bookCta")}</Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* ---------- PATIENTS carousel (autoplay) ---------- */}
      <section className="section border-t border-border">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal className="flex items-end justify-between">
            <div>
              <span className="eyebrow">{t("home.resultsKicker")}</span>
              <h2 className="display mt-6 text-[clamp(2.2rem,5vw,4rem)]">
                {t("home.resultsTitle")}
              </h2>
            </div>
            <Link
              to="/resultados"
              className="link-underline hidden font-sans text-[0.72rem] uppercase tracking-[0.2em] text-gold sm:inline"
            >
              {t("common.viewResults")}
            </Link>
          </SectionReveal>

          {patients.length > 0 ? (
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 3200, stopOnInteraction: false, stopOnMouseEnter: true })]}
              className="mt-12"
            >
              <CarouselContent className="-ml-5">
                {patients.map((src, i) => (
                  <CarouselItem key={i} className="basis-[78%] pl-5 sm:basis-1/2 lg:basis-1/3">
                    <div className="rounded-[1.75rem] border border-gold/60 bg-base p-1.5 shadow-[0_12px_34px_-20px_rgba(0,0,0,0.4)]">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.4rem] bg-elevated">
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-9 flex items-center justify-end gap-3">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </Carousel>
          ) : (
            <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-[3/4] items-center justify-center rounded-[3px] border border-dashed border-border bg-elevated/40 text-muted/40"
                >
                  <Camera className="h-7 w-7" strokeWidth={1.2} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- REELS ---------- */}
      <ReelsSection />
    </>
  );
}
