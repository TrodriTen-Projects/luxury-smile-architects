import { useTranslation } from "react-i18next";
import Autoplay from "embla-carousel-autoplay";
import { Star, ArrowUpRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { pick, type Review } from "@/lib/content";

interface Props {
  reviews: Review[];
  reviewsUrl: string;
  cta: string;
  empty: string;
}

/**
 * Hand-curated Google reviews from site.json (`reviews`), shown in a gold-framed
 * autoplay carousel that matches the patients/reels carousels. No API key, no
 * third-party script, 100% static. If the array is empty, shows a "see them on
 * Google" card linking to `reviewsUrl`.
 */
export function GoogleReviews({ reviews, reviewsUrl, cta, empty }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "es";

  if (reviews.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-6 rounded-[3px] border border-border bg-surface p-12 text-center">
        <span className="flex gap-1 text-gold">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} className="h-5 w-5 fill-current" />
          ))}
        </span>
        <p className="max-w-md font-sans text-sm font-light text-muted">{empty}</p>
        <a
          href={reviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline inline-flex items-center gap-2 font-sans text-[0.72rem] uppercase tracking-[0.2em] text-gold"
        >
          {cta}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[
        Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: false }),
      ]}
      className="mt-12"
    >
      <CarouselContent className="-ml-5">
        {reviews.map((r, i) => (
          <CarouselItem
            key={i}
            className="basis-[85%] pl-5 sm:basis-1/2 lg:basis-1/3"
          >
            {/* Gold frame — same lockup as the patients/reels cards */}
            <div className="h-full rounded-[1.75rem] border border-gold/60 bg-base p-1.5 shadow-[0_12px_34px_-20px_rgba(0,0,0,0.4)]">
              <figure className="flex h-full flex-col rounded-[1.4rem] bg-surface p-7">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-4 w-4",
                        s < Math.round(r.rating) ? "fill-current" : "opacity-25",
                      )}
                    />
                  ))}
                </div>
                <blockquote className="mt-4 whitespace-pre-line line-clamp-6 text-pretty font-sans text-sm font-light leading-relaxed text-foreground">
                  {pick(r.text, lang)}
                </blockquote>
                <figcaption className="mt-auto pt-5 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-muted">
                  {r.author}
                  {r.date ? ` · ${pick(r.date, lang)}` : ""}
                </figcaption>
              </figure>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-9 flex items-center justify-end gap-3">
        <CarouselPrevious className="static translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
    </Carousel>
  );
}
