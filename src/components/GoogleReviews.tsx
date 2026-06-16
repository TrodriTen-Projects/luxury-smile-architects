import { useEffect, useState } from "react";
import { Star, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/content";

interface Props {
  fallback: Review[];
  reviewsUrl: string;
  cta: string;
  empty: string;
}

/**
 * Fetches reviews from the same-origin `/api/reviews` Vercel function (which
 * holds the Google key server-side). Falls back to the manual `reviews` array,
 * then to a "see on Google" card. No third-party scripts, no client API key.
 */
export function GoogleReviews({ fallback, reviewsUrl, cta, empty }: Props) {
  const [live, setLive] = useState<Review[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/reviews", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && Array.isArray(data.reviews) && data.reviews.length) {
          setLive(data.reviews as Review[]);
        }
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-[3px] border border-border bg-elevated/60"
          />
        ))}
      </div>
    );
  }

  const list = live ?? fallback;

  if (list.length > 0) {
    return (
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r, i) => (
          <figure
            key={i}
            className="flex flex-col rounded-[3px] border border-border bg-surface p-7"
          >
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
            <blockquote className="mt-4 line-clamp-5 text-pretty font-sans text-sm font-light leading-relaxed text-foreground">
              {r.text}
            </blockquote>
            <figcaption className="mt-5 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-muted">
              {r.author}
              {r.date ? ` · ${r.date}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

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
