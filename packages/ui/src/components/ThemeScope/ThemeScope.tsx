import { themeBrand, type Theme } from '@calcifer-design/tokens';
import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { suppressTransitionsForAFrame } from '../../utils/suppressTransitions';
import { PortalContainerContext } from './PortalContainerContext';
import styles from './ThemeScope.module.css';

/** The two modes; equals the tokens package's `ThemeName`. */
export type ThemeMode = 'light' | 'dark';

export interface ThemeScopeProps {
  /** From `defineTheme`; the generated sheet for it must be on the page (the consumer's build does that). */
  theme: Theme;
  /**
   * Pins the mode by writing `data-theme` on the wrapper. Left unset, the scope follows `<html>`'s
   * `data-theme` and then the OS preference. An unpinned scope nested in a pinned one does not
   * inherit the outer pin (it resolves from `<html>` and the OS); pin the inner one too. A change
   * of pin holds every transition in the scope still for that frame, so colours flip at once.
   */
  mode?: ThemeMode;
  /** Joined after the theme's class on the wrapper (an app's own layout class). */
  className?: string;
  children: ReactNode;
}

/**
 * Scopes a theme to its subtree and gives every portal inside it a host within the scope, so
 * dialogs, menus and toasts wear the theme too. Nested scopes each provide their own host; the
 * nearest wins.
 */
export function ThemeScope({ theme, mode, className, children }: ThemeScopeProps): ReactElement {
  // R19: the host element is held in state, never in a ref object. Base UI resolves `container`
  // once per identity in a layout effect, and a portal mounting in this first commit runs that
  // effect before the host's ref attaches; a ref object never changes identity, so that portal
  // would go to `<body>` for good. `null` makes Base UI wait, and the state change re-runs it.
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousModeRef = useRef(mode);
  // A changed pin holds the subtree's transitions still for the frame of the change, so text that
  // transitions its colour flips with the surface behind it instead of fading through a pairing
  // of low contrast. A layout effect: it runs in the commit that wrote the new `data-theme`,
  // before the browser renders it. The first render has nothing to change from.
  useLayoutEffect(() => {
    if (previousModeRef.current === mode || wrapperRef.current === null) {
      return undefined;
    }
    previousModeRef.current = mode;
    return suppressTransitionsForAFrame(wrapperRef.current);
  }, [mode]);
  // Checked through the tokens package's own symbol (L1-13): a theme from a second copy of the
  // package carries a different symbol and is refused like a hand-written object (L1-11).
  if (theme[themeBrand] !== true) {
    throw new Error('ThemeScope: theme must come from defineTheme');
  }
  return (
    <div
      className={[styles.root, theme.className, className].filter(Boolean).join(' ')}
      data-theme={mode}
      ref={wrapperRef}
    >
      <PortalContainerContext.Provider value={host}>{children}</PortalContainerContext.Provider>
      <div className={styles.portalHost} data-portal-host="" ref={setHost} />
    </div>
  );
}
