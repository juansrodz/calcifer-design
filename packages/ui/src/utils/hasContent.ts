import type { ReactNode } from 'react';

/**
 * Internal, not exported from `src/index.ts`. Whether a slot holds something React draws: `true`,
 * `false`, `null` and `undefined` render nothing, and `''` renders an empty text node, so none of
 * them may leave an empty wrapper, a separating space or a dangling `aria-describedby` behind. `0`
 * is drawn (a count) and counts as content.
 */
export function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== '' && typeof node !== 'boolean';
}
