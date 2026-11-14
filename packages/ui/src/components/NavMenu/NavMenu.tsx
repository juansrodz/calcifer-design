import { Menu } from '@base-ui/react/menu';
import { useState, type ReactElement, type ReactNode } from 'react';
import { minWidth, useMediaQuery } from '../../hooks/useMediaQuery';
import { usePortalContainer } from '../ThemeScope/PortalContainerContext';
import popupStyles from '../../styles/popup.module.css';
import { isCurrentPath } from './currentPath';
import styles from './NavMenu.module.css';

export interface NavItem {
  href: string;
  label: string;
}

export interface LinkRenderProps {
  className: string;
  'aria-current'?: 'page';
  children: ReactNode;
}

/**
 * `Item` is the shape of one entry: anything with an `href` and a `label`. The shell passes its own
 * (a typed route, an icon) and gets the same object back in `renderLink`.
 */
export interface NavMenuProps<Item extends NavItem = NavItem> {
  items: readonly Item[];
  currentPath: string;
  /** Accessible name for the navigation landmark. */
  label?: string;
  /** Lets the shell render router links; defaults to a plain anchor. */
  renderLink?: (item: Item, props: LinkRenderProps) => ReactElement;
  /**
   * `'vertical'` stacks the links for a sidebar, each one as wide as the list. It applies to the
   * wide layout only: below `md` the links are already a column inside the menu, so it is ignored.
   */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * The plain anchor both `NavMenu` and `TabBar` fall back on when the shell passes no `renderLink`.
 * Shared between the two components, so it is exported from this module, but it is not in the
 * package's exports.
 */
export function defaultRenderLink(
  item: NavItem,
  { children, ...linkProps }: LinkRenderProps,
): ReactElement {
  return (
    <a href={item.href} {...linkProps}>
      {children}
    </a>
  );
}

function linkPropsFor(item: NavItem, currentPath: string): LinkRenderProps {
  return {
    className: styles.link,
    'aria-current': isCurrentPath(item.href, currentPath) ? 'page' : undefined,
    children: item.label,
  };
}

export function NavMenu<Item extends NavItem = NavItem>({
  items,
  currentPath,
  label = 'Primary',
  renderLink = defaultRenderLink,
  orientation = 'horizontal',
}: NavMenuProps<Item>) {
  const isWide = useMediaQuery(minWidth('md'));
  const container = usePortalContainer();
  const [open, setOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState(currentPath);

  // Adjust state during render rather than in an effect: closing the menu is a
  // response to the `currentPath` prop changing, not a synchronization with an
  // external system, so it belongs in the render body per React's guidance on
  // avoiding unnecessary effects.
  if (currentPath !== previousPath) {
    setPreviousPath(currentPath);
    setOpen(false);
  }

  if (isWide) {
    return (
      <nav className={styles.root} aria-label={label}>
        <ul className={styles.list} data-orientation={orientation}>
          {items.map((item) => (
            <li key={item.href}>{renderLink(item, linkPropsFor(item, currentPath))}</li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className={styles.root} aria-label={label}>
      <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
        <Menu.Trigger className={styles.trigger} aria-label={open ? 'Close menu' : 'Open menu'}>
          <svg
            className={styles.triggerIcon}
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d={open ? 'M4 4l10 10M14 4L4 14' : 'M2 5h14M2 9h14M2 13h14'} />
          </svg>
        </Menu.Trigger>
        <Menu.Portal container={container}>
          <Menu.Positioner className={popupStyles.layer} side="bottom" align="end" sideOffset={8}>
            <Menu.Popup className={popupStyles.surface} data-popup="menu">
              {items.map((item) => (
                <Menu.Item
                  key={item.href}
                  className={styles.item}
                  render={renderLink(item, linkPropsFor(item, currentPath))}
                />
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </nav>
  );
}
