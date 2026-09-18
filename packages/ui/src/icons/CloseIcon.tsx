/**
 * The library's one close glyph. `Alert`'s dismiss control, `Dialog`'s header control and each
 * toast's close control all draw it; each authored its own copy before this module existed.
 *
 * Internal on purpose: the barrel does not export it, so it is no part of the published surface
 * and consumers bring their own icon set. It is decorative everywhere it is used — the button
 * around it carries the accessible name — which is why it is `aria-hidden` and not focusable.
 * It declares no size; the control that holds it sizes it.
 */
export function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}
