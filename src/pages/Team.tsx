import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

import { SectionReveal } from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useContent, type TeamMember } from "@/lib/content";

interface Reason {
  id: string;
  title: string;
  description: string;
}

export default function Team() {
  const { t, i18n } = useTranslation();
  const content = useContent();
  const reasons = t("why.items", { returnObjects: true }) as Reason[];
  const [active, setActive] = useState<TeamMember | null>(null);

  const lang = (i18n.resolvedLanguage ?? "es").slice(0, 2) === "en" ? "en" : "es";
  const tx = (o: { es: string; en: string }) => o[lang] ?? o.es;

  return (
    <>
      <header className="px-6 pb-16 pt-36 lg:px-12 lg:pb-20 lg:pt-48">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <span className="eyebrow">{t("team.kicker")}</span>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <h1 className="display mt-7 text-[clamp(2.4rem,7vw,6rem)] text-foreground">
              {t("team.title")}
            </h1>
          </SectionReveal>
          <SectionReveal delay={0.16}>
            <p className="mt-8 max-w-md font-sans text-lg font-light text-muted">
              {t("team.subtitle")}
            </p>
          </SectionReveal>
        </div>
      </header>

      <section className="px-6 pb-32 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.team.map((member, i) => (
            <SectionReveal as="article" key={member.id} delay={(i % 3) * 0.08}>
              <button
                type="button"
                onClick={() => setActive(member)}
                className="group block w-full overflow-hidden rounded-[3px] border border-border bg-surface text-left transition-colors hover:border-gold/40"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                  />
                  <div className="photo-scrim absolute inset-0" />
                  <span className="absolute left-5 top-5 font-serif text-xl text-white/85">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm transition-colors group-hover:border-gold group-hover:text-gold">
                    <Plus className="h-4 w-4" />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h2 className="font-serif text-2xl text-white">{member.name}</h2>
                    <p className="mt-1 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-[#E3C88C]">
                      {tx(member.role)}
                    </p>
                  </div>
                </div>
              </button>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Why band */}
      <section className="section border-t border-border">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <span className="eyebrow">{t("why.kicker")}</span>
            <h2 className="display mt-6 max-w-3xl text-[clamp(2rem,4.5vw,3.4rem)]">
              {t("why.title")}
            </h2>
          </SectionReveal>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, i) => (
              <SectionReveal key={r.id} delay={(i % 4) * 0.06}>
                <span className="index-num text-xl">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-serif text-xl text-foreground">{r.title}</h3>
                <p className="mt-3 font-sans text-sm font-light leading-relaxed text-muted">
                  {r.description}
                </p>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="grid-cols-1 md:grid-cols-[0.85fr_1.15fr]">
          {active && (
            <>
              <div className="relative hidden min-h-[300px] md:block">
                <img
                  src={active.photo}
                  alt={active.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-8 sm:p-10">
                <p className="eyebrow">{tx(active.role)}</p>
                <DialogTitle className="mt-4 text-3xl sm:text-4xl">
                  {active.name}
                </DialogTitle>
                <p className="mt-2 font-sans text-sm text-muted">
                  {tx(active.credentials)}
                </p>
                <DialogDescription className="mt-6 text-base font-light leading-relaxed">
                  {tx(active.bio)}
                </DialogDescription>
                <Button asChild size="lg" className="mt-9">
                  <Link to="/contacto" onClick={() => setActive(null)}>
                    {t("common.bookCta")}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
