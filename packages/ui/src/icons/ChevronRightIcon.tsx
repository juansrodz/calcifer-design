/**
 * The chevron on a `DataGrid` row's expand button, which turns to point down while the row is open.
 * Internal, exactly as `ChevronDownIcon` is: the barrel does not export it. It is decorative — the
 * button carries the name — and declares no size; the control that holds it sizes it.
 */
export function ChevronRightIcon() {
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
      <path d="m6.25 4 4 4-4 4" />
    </svg>
  );
}
