import { useEffect, useRef, useState } from "react";
import { Star, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/content";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
  profile_photo_url?: string;
}

let mapsLoader: Promise<void> | null = null;

function loadMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key,
    )}&libraries=places&loading=async`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("maps_load_failed"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

interface Props {
  placeId: string | null;
  apiKey: string | null;
  fallback: Review[];
  reviewsUrl: string;
  cta: string;
  empty: string;
}

export function GoogleReviews({ placeId, apiKey, fallback, reviewsUrl, cta, empty }: Props) {
  const live = Boolean(placeId && apiKey);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [failed, setFailed] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!live || !placeId || !apiKey) return;
    let active = true;
    loadMaps(apiKey)
      .then(() => {
        const g = (window as any).google;
        if (!g?.maps?.places || !holder.current) {
          setFailed(true);
          return;
        }
        const service = new g.maps.places.PlacesService(holder.current);
        service.getDetails(
          { placeId, fields: ["reviews", "rating", "user_ratings_total"] },
          (place: any, status: string) => {
            if (!active) return;
            if (status === "OK" && place?.reviews?.length) {
              setReviews(
                place.reviews.map((r: GoogleReview) => ({
                  author: r.author_name,
                  rating: r.rating,
                  text: r.text,
                  date: r.relative_time_description,
                })),
              );
            } else {
              setFailed(true);
            }
          },
        );
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [live, placeId, apiKey]);

  // Decide what to render: live reviews, then manual fallback, else empty card.
  const loadingLive = live && !failed && reviews === null;
  const list = reviews ?? (live && !failed ? null : fallback);

  if (loadingLive) {
    return (
      <>
        <div ref={holder} className="hidden" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-[3px] border border-border bg-elevated/60"
            />
          ))}
        </div>
      </>
    );
  }

  if (list && list.length > 0) {
    return (
      <>
        <div ref={holder} className="hidden" />
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
                    className={cn("h-4 w-4", s < Math.round(r.rating) ? "fill-current" : "opacity-25")}
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
      </>
    );
  }

  return (
    <>
      <div ref={holder} className="hidden" />
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
    </>
  );
}
