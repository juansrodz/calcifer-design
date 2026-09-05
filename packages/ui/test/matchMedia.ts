import { vi } from 'vitest';

type ChangeListener = (event: MediaQueryListEvent) => void;

/** Installs a window.matchMedia stub whose result is controlled by `matches`. Returns a setter to flip it. */
export function installMatchMedia(initialMatches: boolean) {
  let currentMatches = initialMatches;
  const listeners = new Set<ChangeListener>();

  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
    matches: currentMatches,
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener as ChangeListener);
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener as ChangeListener);
    },
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  }));

  return function setMatches(nextMatches: boolean) {
    currentMatches = nextMatches;
    for (const listener of listeners) {
      listener({ matches: nextMatches } as MediaQueryListEvent);
    }
  };
}
