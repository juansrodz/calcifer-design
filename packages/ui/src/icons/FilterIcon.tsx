/**
 * The filters glyph: a funnel. Internal on purpose, like the library's other icons: the barrel
 * does not export it and the button around it carries the accessible name. It declares no size;
 * the control that holds it sizes it.
 */
export function FilterIcon() {
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
      <path d="M2.5 3h11L9.25 8.1v4.65L6.75 14V8.1z" />
    </svg>
  );
}
