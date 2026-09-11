/**
 * Entry-animation suppression, used on both sides of prerendering.
 *
 * During the build pass (`scripts/prerender.mjs` sets `__PRERENDER__` before
 * the app boots) every reveal must mount at its finished state. Waiting for the
 * animations to play instead is not deterministic: `whileInView` reveals inside
 * a horizontal carousel never enter the viewport at all, so they would be
 * serialised still at `opacity: 0` and the page would ship half-invisible.
 *
 * In the browser the same suppression applies while hydrating that markup: the
 * HTML already shows the finished frame, so replaying the entry would snap
 * everything back to `opacity: 0` and fade it in again — a flash on every first
 * load, and a pointless correction for React to make.
 *
 * Suppression covers only the first client render. `releaseEntryAnimations`
 * runs once the tree is mounted, so client-side navigation animates normally.
 */

declare global {
  interface Window {
    /** Set by the prerenderer before the bundle runs. Absent in real browsers. */
    __PRERENDER__?: boolean;
  }
}

/** True while the prerenderer is driving the page. */
const isPrerenderPass = typeof window !== "undefined" && window.__PRERENDER__ === true;

/**
 * True when the server delivered markup for this load, i.e. the page was
 * prerendered and React must hydrate rather than mount from scratch. False
 * during the prerender pass itself — the root is empty there.
 */
export const wasPrerendered: boolean =
  !isPrerenderPass &&
  typeof document !== "undefined" &&
  (document.getElementById("root")?.childElementCount ?? 0) > 0;

let suppressing = isPrerenderPass || wasPrerendered;

/**
 * Wraps a Framer Motion `initial` prop.
 *
 * Returns `skipValue` while suppressing and `value` otherwise. The default
 * `false` tells Framer Motion to mount straight at the `animate` target. Pass an
 * explicit variant name when the element is variant-driven, since `false` has no
 * unambiguous target in that case.
 */
export function entryInitial<T>(value: T, skipValue: T | false = false): T | false {
  return suppressing ? skipValue : value;
}

/**
 * True while entry animations are suppressed. Use it for looping `animate`
 * props, which have no fixed frame to serialise: a repeating keyframe captured
 * mid-cycle lands on an arbitrary transform the client can never reproduce.
 */
export function isSuppressingEntry(): boolean {
  return suppressing;
}

/** Called once after hydration so later route changes animate as usual. */
export function releaseEntryAnimations(): void {
  if (isPrerenderPass) return; // keep the serialised DOM stable until capture
  suppressing = false;
}
