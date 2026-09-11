/**
 * Analytics loading, gated on consent.
 *
 * This is a healthcare clinic in Spain, so Meta Pixel and GA4 may not fire
 * before the visitor explicitly agrees: nothing here touches the network until
 * `grantConsent()` runs. Both IDs live in `site.json` (`tracking.*`) and are
 * read at runtime like the rest of the content, so switching accounts is a CMS
 * edit and never a code change. An empty ID simply leaves that tag off.
 *
 * No inline script anywhere: everything is initialised from the app bundle,
 * which is already `'self'`, so the CSP never needs `'unsafe-inline'`.
 */

const STORAGE_KEY = "lsa-consent";

export type ConsentChoice = "granted" | "denied";

export interface TrackingIds {
  metaPixelId: string;
  ga4MeasurementId: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && window.__PRERENDER__ !== true;
}

export function readConsent(): ConsentChoice | null {
  if (!isBrowser()) return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
}

function storeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* private mode: the choice holds for this page view only */
  }
}

/**
 * Google Consent Mode v2 defaults. Runs on every load, before any tag exists,
 * so that if gtag is loaded later it already knows storage is denied. Pure
 * `dataLayer` bookkeeping — no request leaves the browser.
 */
export function initConsentMode(): void {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer ?? [];
  const gtag: (...args: unknown[]) => void = (...args) => {
    window.dataLayer!.push(args);
  };
  window.gtag = window.gtag ?? gtag;
  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const element = document.createElement("script");
    element.src = src;
    element.async = true;
    element.onload = () => resolve();
    element.onerror = () => reject(new Error(`no se pudo cargar ${src}`));
    document.head.appendChild(element);
  });
}

async function loadGa4(measurementId: string): Promise<void> {
  await loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  window.gtag?.("js", new Date());
  window.gtag?.("config", measurementId, { anonymize_ip: true });
}

async function loadMetaPixel(pixelId: string): Promise<void> {
  // The official snippet is an inline stub whose only job is to queue calls
  // made before fbevents.js arrives. Written out here instead of inlined so
  // `script-src` stays free of 'unsafe-inline'.
  if (!window.fbq) {
    const queue: unknown[] = [];
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else queue.push(args);
    }) as NonNullable<Window["fbq"]>;
    fbq.queue = queue;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
  }
  await loadScript("https://connect.facebook.net/en_US/fbevents.js");
  window.fbq?.("init", pixelId);
  window.fbq?.("track", "PageView");
}

/** Load whatever is configured. Called only after the visitor has agreed. */
export async function startTracking(ids: TrackingIds): Promise<void> {
  if (!isBrowser()) return;
  window.gtag?.("consent", "update", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });

  const tasks: Promise<void>[] = [];
  if (ids.ga4MeasurementId) tasks.push(loadGa4(ids.ga4MeasurementId));
  if (ids.metaPixelId) tasks.push(loadMetaPixel(ids.metaPixelId));
  // A blocked or failed tag must never take the page down with it.
  await Promise.allSettled(tasks);
}

export function grantConsent(ids: TrackingIds): void {
  storeConsent("granted");
  void startTracking(ids);
}

export function denyConsent(): void {
  storeConsent("denied");
  // Nothing to unload: no tag was ever fetched.
}
