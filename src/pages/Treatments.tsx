import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus } from "lucide-react";

import { SectionReveal } from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useContent } from "@/lib/content";

interface Treatment {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  source: string;
}

export default function Treatments() {
  const { t } = useTranslation();
  const content = useContent();
  const items = t("treatments.items", { returnObjects: true }) as Treatment[];
  const [active, setActive] = useState<Treatment | null>(null);
  const img = (id: string) => content.services[id] ?? content.hero.fallback;

  return (
    <>
      <header className="px-6 pb-14 pt-36 lg:px-12 lg:pb-20 lg:pt-48">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <span className="eyebrow">{t("treatments.kicker")}</span>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <h1 className="display mt-7 text-[clamp(2.4rem,7vw,6rem)] text-foreground">
              {t("treatments.title")}
            </h1>
          </SectionReveal>
          <SectionReveal delay={0.16}>
            <p className="mt-7 max-w-md font-sans text-lg font-light text-muted">
              {t("treatments.subtitle")}
            </p>
          </SectionReveal>
        </div>
      </header>

      <section className="px-6 pb-32 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <SectionReveal as="article" key={item.id} delay={(i % 3) * 0.06}>
              <button
                type="button"
                onClick={() => setActive(item)}
                className="group block w-full overflow-hidden rounded-[3px] border border-border bg-surface text-left shadow-[0_1px_0_hsl(var(--border))] transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)]"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <img
                    src={img(item.id)}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 photo-scrim opacity-70" />
                  <span className="absolute right-4 top-4 font-serif text-2xl text-white/85">
                    0{i + 1}
                  </span>
                  <span className="absolute bottom-4 left-5 font-sans text-[0.56rem] uppercase tracking-[0.22em] text-white/90">
                    {item.tagline}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 p-6">
                  <h2 className="font-serif text-xl text-foreground transition-colors group-hover:text-gold">
                    {item.name}
                  </h2>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors group-hover:border-gold group-hover:text-gold">
                    <Plus className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </SectionReveal>
          ))}
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="grid-cols-1 md:grid-cols-2">
          {active && (
            <>
              <div className="relative hidden min-h-[320px] md:block">
                <img
                  src={img(active.id)}
                  alt={active.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-8 sm:p-10">
                <p className="eyebrow">{active.tagline}</p>
                <DialogTitle className="mt-4 text-3xl sm:text-4xl">
                  {active.name}
                </DialogTitle>
                <DialogDescription className="mt-5 text-base font-light leading-relaxed">
                  {active.summary}
                </DialogDescription>

                <div className="mt-9 flex flex-col gap-4">
                  <Button asChild size="lg">
                    <Link to="/contacto" onClick={() => setActive(null)}>
                      {t("common.bookCta")}
                    </Link>
                  </Button>
                  <a
                    href={`https://wa.me/${content.business.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                      t("treatments.waMessage", { name: active.name }),
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex items-center gap-2 font-sans text-[0.72rem] uppercase tracking-[0.2em] text-gold"
                  >
                    {t("common.moreInfo")}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
