import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useContent } from "@/lib/content";
import { denyConsent, grantConsent, initConsentMode, readConsent, startTracking } from "@/lib/tracking";

/**
 * Consent gate for Meta Pixel and GA4.
 *
 * Rendered only after mount, never in the prerendered HTML: what the banner
 * should show depends on `localStorage`, which the prerenderer has no view of,
 * so baking a decision into the shipped markup would be wrong for half the
 * visitors — and would not match what the browser renders.
 *
 * Declining is a single click, same as accepting. A banner whose only real
 * option is "accept" is not consent.
 */
export function ConsentBanner() {
  const { t } = useTranslation();
  const content = useContent();
  const [visible, setVisible] = useState(false);

  const ids = content.tracking;
  const configured = Boolean(ids.metaPixelId || ids.ga4MeasurementId);

  useEffect(() => {
    // Consent Mode defaults are set on every load, before any tag can exist.
    initConsentMode();

    if (!configured) return; // nothing to ask about yet
    const stored = readConsent();
    if (stored === "granted") void startTracking(ids);
    else if (stored === null) setVisible(true);
  }, [configured, ids]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("consent.title")}
      className="fixed inset-x-0 bottom-0 z-[95] border-t border-border/70 bg-surface/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <p className="max-w-2xl font-sans text-sm font-light leading-relaxed text-muted">
          {t("consent.text")}
        </p>
        <div className="flex shrink-0 items-center gap-6">
          <button
            type="button"
            onClick={() => {
              denyConsent();
              setVisible(false);
            }}
            className="link-underline font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted hover:text-foreground"
          >
            {t("consent.decline")}
          </button>
          <button
            type="button"
            onClick={() => {
              grantConsent(ids);
              setVisible(false);
            }}
            className="rounded-[3px] border border-gold/60 px-5 py-2.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/10"
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
