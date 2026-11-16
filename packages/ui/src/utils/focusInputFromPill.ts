import type { MouseEvent } from 'react';

/**
 * Internal, not exported from `src/index.ts`. The `mousedown` handler of a pill that wraps an
 * input (`AffixInput`, `SearchField`). The input is one line tall inside a taller pill, so a press
 * on the glyph or above and below the text would focus nothing. Cancelling the press and focusing
 * the input puts the caret where a bare input's whole-box press would. The input and any button
 * inside keep their own presses, so a caret placed by pointer, a selection drag, a native picker
 * button and a clear control all behave as they do without the pill.
 *
 * Returns whether the press was taken over, so a caller can do more with it.
 */
export function focusInputFromPill(
  event: MouseEvent<HTMLElement>,
  input: HTMLElement | null,
): boolean {
  if (event.target instanceof Element && event.target.closest('input, button') !== null) {
    return false;
  }
  event.preventDefault();
  input?.focus();
  return true;
}
