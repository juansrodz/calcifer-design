import { themeBrand, type Theme } from '@calcifer-design/tokens';
import { useState, type ReactElement, type ReactNode } from 'react';
import { PortalContainerContext } from './PortalContainerContext';
import styles from './ThemeScope.module.css';

/** The two modes; equals the tokens package's `ThemeName`. */
export type ThemeMode = 'light' | 'dark';

export interface ThemeScopeProps {
  /** From `defineTheme`; the generated sheet for it must be on the page (the consumer's build does that). */
  theme: Theme;
  /** Pins the mode by writing `data-theme` on the wrapper. Absent, the scope follows `<html>`'s attribute, then the OS. */
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
  // Checked through the tokens package's own symbol (L1-13): a theme from a second copy of the
  // package carries a different symbol and is refused like a hand-written object (L1-11).
  if (theme[themeBrand] !== true) {
    throw new Error('ThemeScope: theme must come from defineTheme');
  }
  return (
    <div
      className={[styles.root, theme.className, className].filter(Boolean).join(' ')}
      data-theme={mode}
    >
      <PortalContainerContext.Provider value={host}>{children}</PortalContainerContext.Provider>
      <div className={styles.portalHost} data-portal-host="" ref={setHost} />
    </div>
  );
}
