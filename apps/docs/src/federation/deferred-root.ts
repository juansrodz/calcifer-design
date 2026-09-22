import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { CreateRootOptions, Root } from '@module-federation/bridge-react/v19';

/**
 * Wraps `react-dom/client`'s `createRoot` so the returned root's `unmount()` never runs
 * synchronously inside one of React's own commits.
 *
 * The shell's `createRemoteAppComponent` calls this provider's `destroy()` — which calls
 * `root.unmount()` — from a `useEffect` cleanup. Navigating away from a mounted remote can run
 * that while React is still mid-commit on the surrounding tree, and React then logs "Attempted
 * to synchronously unmount a root while React was already rendering." Deferring to a microtask
 * lets the commit finish; `queueMicrotask` runs before the next paint, so nothing is visibly
 * delayed. Copied deliberately from `apps/showcase/src/federation/deferred-root.ts` in
 * portfolio-mfe: the two repositories cannot share it, and a remote that skips it logs the
 * error in someone else's console.
 */
export function createDeferredRoot(
  container: Element | DocumentFragment,
  options?: CreateRootOptions,
): Root {
  const root = createRoot(container, options);
  return {
    render(children: ReactNode) {
      root.render(children);
    },
    unmount() {
      queueMicrotask(() => root.unmount());
    },
  };
}
