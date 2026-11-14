/**
 * The library's search glyph, drawn in `CloseIcon`'s style: a 16-unit box, a 1.5 stroke in the
 * current colour and round caps. `SearchField` leads with it.
 *
 * Internal on purpose, for the reason `CloseIcon` records: the barrel does not export it, it is
 * decorative (the field around it carries the accessible name, so it is `aria-hidden` and not
 * focusable) and it declares no size, because the holder sizes it.
 */
export function SearchIcon() {
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
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}
