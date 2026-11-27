import type { SheetSide } from './Dialog';

/** The way a sheet swipes to close: the way it slid in from, back toward its edge. */
export type SheetSwipeDirection = 'down' | 'right' | 'left';

/**
 * A bottom sheet swipes down. An end sheet swipes toward its edge: right, or left when the nearest
 * `dir` at or above `element` says `rtl`, which is how the skin turns the sheet around.
 */
export function sheetSwipeDirection(side: SheetSide, element: Element | null): SheetSwipeDirection {
  if (side === 'bottom') {
    return 'down';
  }
  return element?.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl' ? 'left' : 'right';
}
