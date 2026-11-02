import { createContext } from 'react';

/**
 * Whether a control sits in a `Toolbar`, which then owns the one tab stop. Private to the library:
 * `src/index.ts` does not export it, and `Segmented` reads it to leave that stop alone. Its own
 * file so that reading it does not pull `Toolbar` and `Button` into `Segmented`.
 */
export const InsideToolbarContext = createContext(false);
