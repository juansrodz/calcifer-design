/**
 * The chevron on a `Select` trigger. Internal, exactly as `CloseIcon` is: the barrel does not
 * export it, so consumers bring their own icon set. It is decorative — Base UI marks
 * `Select.Icon` `aria-hidden` itself — and declares no size; the control that holds it sizes it.
 */
export function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4 6.25 4 4 4-4" />
    </svg>
  );
}
