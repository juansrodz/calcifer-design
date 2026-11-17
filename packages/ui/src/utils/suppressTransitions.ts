/**
 * Marks an element for the frame of a mode change. The sheet of whatever owns the element holds
 * every transition beneath the mark still: `ThemeScope.module.css` for a scope, the Storybook
 * preview's own sheet for `<html>`.
 */
export const THEME_CHANGING_ATTRIBUTE = 'data-theme-changing';

/** How many holds on each element have yet to end; the mark comes off when the last one does. */
const pendingHolds = new WeakMap<HTMLElement, number>();

/**
 * Holds every transition under `element` still for the frame in which its mode changes, so text
 * that transitions `color` reaches its new value in the same frame as the surface behind it,
 * rather than fading through the old text on the new surface. The pattern of next-themes'
 * `disableTransitionOnChange`, scoped to `element` through an attribute instead of a `<style>`
 * injected for the whole document, which a strict `style-src` would refuse.
 *
 * Call it once the mode attribute has changed and before the browser renders. The style read
 * computes the new values while the mark is on, so no transition starts, and it cancels any that a
 * flush earlier in the same task had started. The mark stays on through the next frame, so that
 * frame is drawn without transitions even where the read did not restyle every descendant, and
 * comes off in the frame after, by when nothing is left to animate. Under `prefers-reduced-motion`
 * transitions are already near-instant (`base.css`); the mark changes nothing there.
 *
 * Browser-only: it runs from effects, never during a server render. Returns a release that ends
 * this hold at once, for a cleanup that comes before the frame does. Holds on one element overlap
 * safely (a scope's pin and `<html>` changing within two frames of each other): the mark stays
 * until the last of them ends.
 */
export function suppressTransitionsForAFrame(element: HTMLElement): () => void {
  pendingHolds.set(element, (pendingHolds.get(element) ?? 0) + 1);
  element.setAttribute(THEME_CHANGING_ATTRIBUTE, '');
  // Read for its side effect: forcing the style flush is the point.
  void window.getComputedStyle(element).transitionProperty;
  let released = false;
  const release = () => {
    if (released) {
      return;
    }
    released = true;
    window.cancelAnimationFrame(pendingFrame);
    const remainingHolds = (pendingHolds.get(element) ?? 1) - 1;
    if (remainingHolds > 0) {
      pendingHolds.set(element, remainingHolds);
    } else {
      pendingHolds.delete(element);
      element.removeAttribute(THEME_CHANGING_ATTRIBUTE);
    }
  };
  let pendingFrame = window.requestAnimationFrame(() => {
    pendingFrame = window.requestAnimationFrame(release);
  });
  return release;
}
