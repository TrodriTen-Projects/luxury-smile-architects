import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Autoplay from "embla-carousel-autoplay";
import { Instagram } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { SectionReveal } from "@/components/SectionReveal";
import { INSTAGRAM_PROFILE } from "@/data/instagram";
import { REEL_VIDEOS, VIDEO_POSTER } from "@/data/media";
import { useContent } from "@/lib/content";

function ReelVideo({ src, muted }: { src: string; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.preload = "auto";
          void v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.55 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={VIDEO_POSTER}
      muted={muted}
      loop
      playsInline
      preload="none"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export function ReelsSection() {
  const { t } = useTranslation();
  const content = useContent();


  // Reels = the clinic's own video clips (dropped in /public/media/video).
  // Instagram only allows embedding the full POST (header, likes, caption),
  // not the bare reel video — so to show clean playing reels, download them
  // as .mp4 and place them in that folder.
  const videos = content.videos.length ? content.videos : REEL_VIDEOS;

  if (videos.length === 0) return null;

  return (
    <section className="section relative overflow-hidden pt-8 sm:pt-12 lg:pt-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <SectionReveal>
              <span className="eyebrow">{t("reels.kicker")}</span>
            </SectionReveal>
            <SectionReveal delay={0.08}>
              <h2 className="display mt-6 text-[clamp(2.2rem,5vw,4rem)]">
                {t("reels.title")}
              </h2>
            </SectionReveal>
          </div>
          <SectionReveal delay={0.12}>
            <a
              href={INSTAGRAM_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline inline-flex items-center gap-2 font-sans text-[0.72rem] uppercase tracking-[0.2em] text-gold"
            >
              <Instagram className="h-4 w-4" />
              {t("common.followUs")}
            </a>
          </SectionReveal>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 2200, stopOnInteraction: false, stopOnMouseEnter: false })]}
          className="mt-14"
          aria-label={t("reels.title")}
        >
          <CarouselContent className="-ml-5">
            {videos.map((src, i) => (
              <CarouselItem
                key={src}
                className="basis-[74%] pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <div className="rounded-[1.75rem] border border-gold/60 bg-base p-1.5 shadow-[0_12px_34px_-20px_rgba(0,0,0,0.4)]">
                  <div className="group relative aspect-[9/16] overflow-hidden rounded-[1.4rem] bg-foreground/5">
                    <ReelVideo src={src} muted />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
                    <span className="absolute left-4 top-4 font-sans text-[0.56rem] uppercase tracking-[0.24em] text-white/90">
                      Reel {String(i + 1).padStart(2, "0")}
                    </span>
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
      </div>
    </section>
  );
}
