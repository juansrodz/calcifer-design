import 'vitest-axe/extend-expect';
import '@testing-library/jest-dom/vitest';

type ChangeListener = (event: MediaQueryListEvent) => void;

// jsdom has no matchMedia; library components may call it on mount, and Base UI's scroll
// lock calls `scrollTo` when a dialog opens. A stub that always reports `false` is the
// desktop branch, which is the one these tests assert against.
window.scrollTo = () => undefined;
window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: (_type: string, _listener: ChangeListener) => undefined,
    removeEventListener: (_type: string, _listener: ChangeListener) => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  }) as MediaQueryList;
