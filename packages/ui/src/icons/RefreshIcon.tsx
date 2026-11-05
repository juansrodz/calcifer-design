/**
 * The refresh glyph: an open circular arrow. Internal on purpose, like the library's other
 * icons: the barrel does not export it and the button around it carries the accessible name.
 * It declares no size; the control that holds it sizes it.
 */
export function RefreshIcon() {
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
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.5 2.5v3h-3" />
    </svg>
  );
}
