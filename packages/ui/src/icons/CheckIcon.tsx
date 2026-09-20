/**
 * The tick inside a selected `Select` option and a ticked `Checkbox`. Internal, like
 * `CloseIcon` and `ChevronDownIcon`; decorative in both places, because the option's text and
 * the checkbox's label carry the meaning.
 */
export function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}
