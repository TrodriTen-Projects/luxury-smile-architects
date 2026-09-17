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

/**
 * What has already run on this page. ConsentBanner's effect runs again whenever
 * the content object changes, and a second `config` or `init` would count the
 * same visit twice.
 */
const done = new Set<string>();

function once(key: string): boolean {
  if (done.has(key)) return false;
  done.add(key);
  return true;
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
  if (!isBrowser() || !once("consent-default")) return;
  window.dataLayer = window.dataLayer ?? [];
  // Google's snippet as published, `arguments` included. gtag.js takes its
  // commands from `arguments` objects on the dataLayer; the array a rest
  // parameter produces is not one, and consent, config and events pushed that
  // way never run.
  window.gtag =
    window.gtag ??
    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
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
  // Queued before gtag.js arrives, in the order Google's snippet uses, so an
  // event fired while the script is still downloading never runs ahead of the
  // config it belongs to.
  window.gtag?.("js", new Date());
  window.gtag?.("config", measurementId, { anonymize_ip: true });
  await loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
}

async function loadMetaPixel(pixelId: string): Promise<void> {
  // The official snippet is an inline stub whose only job is to queue calls
  // made before fbevents.js arrives. Written out here instead of inlined so
  // `script-src` stays free of 'unsafe-inline'.
  if (!window.fbq) {
    const fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      if (fbq.callMethod) Reflect.apply(fbq.callMethod, fbq, arguments);
      // eslint-disable-next-line prefer-rest-params
      else fbq.queue!.push(arguments);
    } as NonNullable<Window["fbq"]>;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }
  // Queued straight away, as the snippet does. Called after the download
  // instead, a Lead sent in the meantime reached fbevents.js before `init` and
  // was discarded.
  window.fbq?.("init", pixelId);
  window.fbq?.("track", "PageView");
  await loadScript("https://connect.facebook.net/en_US/fbevents.js");
}

/** Load whatever is configured. Called only after the visitor has agreed. */
export async function startTracking(ids: TrackingIds): Promise<void> {
  if (!isBrowser()) return;
  if (once("consent-update")) {
    window.gtag?.("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  }

  const tasks: Promise<void>[] = [];
  if (ids.ga4MeasurementId && once(`ga4:${ids.ga4MeasurementId}`)) {
    tasks.push(loadGa4(ids.ga4MeasurementId));
  }
  if (ids.metaPixelId && once(`meta:${ids.metaPixelId}`)) {
    tasks.push(loadMetaPixel(ids.metaPixelId));
  }
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

/**
 * Conversion event for the contact form. The form hands the visitor off to
 * WhatsApp, which is where the trail used to go cold: without it, Meta Ads had
 * no signal to optimise for and GA4 no goal to report.
 *
 * Only the event name is sent: no treatment, no contact details. This is a
 * dental clinic, and what someone asked about is health data. Nothing fires
 * without prior consent, and nothing leaves the browser if the tags were never
 * configured.
 */
export function trackLead(): void {
  if (!isBrowser() || readConsent() !== "granted") return;
  window.fbq?.("track", "Lead");
  window.gtag?.("event", "generate_lead");
}
