import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ImageComparison } from "@/components/ui/image-comparison";
import { SectionReveal } from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { useContent } from "@/lib/content";

interface Box {
  title: string;
  caption: string;
}

export default function Results() {
  const { t } = useTranslation();
  const content = useContent();
  const boxes = t("results.boxes", { returnObjects: true }) as Box[];
  const pairs = content.beforeAfter;

  return (
    <>
      <header className="px-6 pb-14 pt-36 lg:px-12 lg:pb-16 lg:pt-48">
        <div className="mx-auto max-w-[1400px]">
          <SectionReveal>
            <span className="eyebrow">{t("results.kicker")}</span>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <h1 className="display mt-7 text-[clamp(2.6rem,8vw,6.5rem)] text-foreground">
              {t("results.title")}
            </h1>
          </SectionReveal>
          <SectionReveal delay={0.16}>
            <p className="mt-7 max-w-md font-sans text-lg font-light text-muted">
              {t("results.subtitle")}
            </p>
          </SectionReveal>
        </div>
      </header>

      <section className="px-6 pb-32 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((pair, i) => {
            const box = boxes[i] ?? { title: "", caption: "" };
            return (
              <SectionReveal key={i} delay={(i % 3) * 0.06}>
                <div className="relative overflow-hidden rounded-[3px] border border-border">
                  <ImageComparison
                    beforeSrc={pair.before}
                    afterSrc={pair.after}
                    beforeLabel={t("results.before")}
                    afterLabel={t("results.after")}
                    beforeAlt={`${box.title}, ${t("results.before")}`}
                    afterAlt={`${box.title}, ${t("results.after")}`}
                    className="aspect-[4/3]"
                  />
                  <div className="photo-scrim pointer-events-none absolute inset-x-0 bottom-0 p-5">
                    <p className="font-serif text-lg text-white">{box.title}</p>
                    <p className="font-sans text-xs font-light text-white/75">
                      {box.caption}
                    </p>
                  </div>
                </div>
              </SectionReveal>
            );
          })}

          {/* 4th box: CTA */}
          <SectionReveal delay={0.08}>
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-7 rounded-[3px] border border-gold/40 bg-gold/[0.06] p-8 text-center">
              <h3 className="display text-[clamp(1.6rem,3vw,2.4rem)] text-foreground">
                {t("results.ctaTitle")}
              </h3>
              <Button asChild size="lg">
                <Link to="/contacto">{t("results.cta")}</Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
