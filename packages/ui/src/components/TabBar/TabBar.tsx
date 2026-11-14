import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import a11yStyles from '../../styles/a11y.module.css';
import { isCurrentPath } from '../NavMenu/currentPath';
import { defaultRenderLink } from '../NavMenu/NavMenu';
import type { LinkRenderProps, NavItem } from '../NavMenu/NavMenu';
import styles from './TabBar.module.css';

// The package's `types` carry no Node globals, so the declaration build does not know `process`.
// Declared at module scope, so it never collides with a global `process` where one exists.
declare const process: { env: { NODE_ENV?: string } };

export interface TabBarItem extends NavItem {
  /** Drawn above the label. Decorative: the label names the link. */
  icon: ReactNode;
}

export interface TabBarProps<Item extends TabBarItem = TabBarItem> {
  /** Two to five; a development-mode warning outside that, never a throw. */
  items: readonly Item[];
  currentPath: string;
  /** Accessible name for the navigation landmark. */
  label?: string;
  /** Lets the shell render router links; defaults to a plain anchor. */
  renderLink?: (item: Item, props: LinkRenderProps) => ReactElement;
  /**
   * A circular primary action drawn beside the pill, before it. Absent, no circle is drawn. The
   * node is the caller's, its button and its glow: the bar only positions the slot.
   */
  action?: ReactNode;
}

/**
 * The phone's bottom navigation: a pill of icon links fixed above the bottom edge, the current
 * page's link filled and showing its label. The other labels stay in the page for assistive
 * technology, so every link keeps its name.
 */
export function TabBar<Item extends TabBarItem = TabBarItem>({
  items,
  currentPath,
  label = 'Primary',
  renderLink = defaultRenderLink,
  action,
}: TabBarProps<Item>) {
  const itemCount = items.length;

  // The literal `process.env.NODE_ENV` is the one form the bundlers consumers use replace at
  // build time, so a production build drops this effect's body. `globalThis.process?.env` is never
  // replaced and the browser has no `process`, and a `typeof process` guard is not replaced
  // either, so a development build in a browser would silence the warning the guard exists for.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && (itemCount < 2 || itemCount > 5)) {
      console.warn(`TabBar: expected two to five items, got ${itemCount}.`);
    }
  }, [itemCount]);

  return (
    <div className={styles.root}>
      {action}
      <nav className={styles.nav} aria-label={label}>
        {/* `role="list"` is what the contract asks for here. (The house rule for restoring a
            list's semantics is scoped to `list-style: none` lists outside a `nav`; this one is
            inside one.) */}
        <ul className={styles.pill} role="list">
          {items.map((item) => {
            const isCurrent = isCurrentPath(item.href, currentPath);
            return (
              <li key={item.href}>
                {renderLink(item, {
                  className: styles.link,
                  'aria-current': isCurrent ? 'page' : undefined,
                  children: (
                    <>
                      <span className={styles.icon} aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className={isCurrent ? styles.label : a11yStyles.visuallyHidden}>
                        {item.label}
                      </span>
                    </>
                  ),
                })}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
