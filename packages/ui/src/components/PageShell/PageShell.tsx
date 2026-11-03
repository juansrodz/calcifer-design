import type { ReactNode } from 'react';
import { SkipLink } from '../SkipLink/SkipLink';
import styles from './PageShell.module.css';

interface PageShellBaseProps {
  /** Becomes the `banner` landmark, as long as the shell is not inside a sectioning element. */
  header?: ReactNode;
  /** Becomes the `contentinfo` landmark, on the same condition as `header`. */
  footer?: ReactNode;
  /** The page's content: the `main` landmark. */
  children: ReactNode;
  /** The id of `main`, which the skip link targets. */
  mainId?: string;
  /** The skip link's text; `SkipLink`'s own default applies otherwise. */
  skipLinkLabel?: ReactNode;
}

interface PageShellWithSidebar extends PageShellBaseProps {
  /** Becomes a `complementary` landmark, stacked above the content at narrow widths. */
  sidebar: ReactNode;
  /** The sidebar's landmark name. Required with it: a page may have several, and each needs one. */
  sidebarLabel: string;
}

interface PageShellWithoutSidebar extends PageShellBaseProps {
  sidebar?: undefined;
  sidebarLabel?: undefined;
}

export type PageShellProps = PageShellWithSidebar | PageShellWithoutSidebar;

/** The page's landmarks, in reading order, with a skip link in front of them. */
export function PageShell({
  header,
  sidebar,
  sidebarLabel,
  footer,
  children,
  mainId = 'main',
  skipLinkLabel,
}: PageShellProps) {
  return (
    <div className={styles.root} data-has-sidebar={sidebar ? '' : undefined}>
      <SkipLink targetId={mainId}>{skipLinkLabel}</SkipLink>
      {header ? <header className={styles.header}>{header}</header> : null}
      {sidebar ? (
        <aside className={styles.sidebar} aria-label={sidebarLabel}>
          {sidebar}
        </aside>
      ) : null}
      {/* `tabIndex={-1}` makes it a target the skip link can focus, not a tab stop. */}
      <main id={mainId} className={styles.main} tabIndex={-1}>
        {children}
      </main>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </div>
  );
}
