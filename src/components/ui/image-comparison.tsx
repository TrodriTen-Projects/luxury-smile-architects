import * as React from "react";
import { cn } from "@/lib/utils";

export interface ImageComparisonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Initial handle position, 0–100. Default 50. */
  initial?: number;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Draggable before/after comparison slider (bundui-style).
 * Pointer + touch + keyboard accessible. Images lazy-loaded.
 */
const ImageComparison = React.forwardRef<HTMLDivElement, ImageComparisonProps>(
  (
    {
      beforeSrc,
      afterSrc,
      beforeAlt = "",
      afterAlt = "",
      beforeLabel,
      afterLabel,
      initial = 50,
      className,
      ...props
    },
    ref,
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState(clamp(initial));
    const [dragging, setDragging] = React.useState(false);
    const [containerWidth, setContainerWidth] = React.useState(0);

    React.useEffect(() => {
      const el = containerRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const updateFromClientX = React.useCallback((clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setPosition(clamp(pct));
    }, []);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      setDragging(true);
      updateFromClientX(e.clientX);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      updateFromClientX(e.clientX);
    };

    const stopDragging = (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      setDragging(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPosition((p) => clamp(p - step));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPosition((p) => clamp(p + step));
      } else if (e.key === "Home") {
        e.preventDefault();
        setPosition(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setPosition(100);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full select-none overflow-hidden bg-elevated",
          className,
        )}
        {...props}
      >
        <div
          ref={containerRef}
          className="relative h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          {/* AFTER — base layer (right side revealed) */}
          <img
            src={afterSrc}
            alt={afterAlt}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {afterLabel && (
            <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-gold/30 bg-base/70 px-4 py-1.5 font-sans text-[0.62rem] uppercase tracking-luxe text-beige backdrop-blur-sm">
              {afterLabel}
            </span>
          )}

          {/* BEFORE — clipped overlay (left side) */}
          <div
            className="absolute inset-0 h-full overflow-hidden"
            style={{ width: `${position}%` }}
          >
            <img
              src={beforeSrc}
              alt={beforeAlt}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={containerWidth ? { width: containerWidth } : undefined}
              className="absolute inset-0 h-full max-w-none object-cover"
            />
            {beforeLabel && (
              <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-foreground/15 bg-base/70 px-4 py-1.5 font-sans text-[0.62rem] uppercase tracking-luxe text-foreground/90 backdrop-blur-sm">
                {beforeLabel}
              </span>
            )}
          </div>

          {/* Handle */}
          <div
            className="absolute inset-y-0 z-20 w-px -translate-x-1/2 bg-gold/80"
            style={{ left: `${position}%` }}
          >
            <div
              role="slider"
              tabIndex={0}
              aria-label="Before / after comparison"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position)}
              onKeyDown={onKeyDown}
              className={cn(
                "absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-gold/60 bg-base/80 text-gold shadow-[0_0_24px_hsl(var(--gold)/0.25)] backdrop-blur-sm transition-transform",
                dragging && "scale-110",
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 6 4 12l5 6" />
                <path d="m15 6 5 6-5 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
ImageComparison.displayName = "ImageComparison";

export { ImageComparison };
