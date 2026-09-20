/**
 * The bar inside an indeterminate `Checkbox`. Internal, like the library's other icons; the
 * checkbox's own `aria-checked="mixed"` carries the state, so this is decorative.
 */
export function MinusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 8h8" />
    </svg>
  );
}
