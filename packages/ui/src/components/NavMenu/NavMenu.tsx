import { Menu } from '@base-ui/react/menu';
import { useState, type ReactElement, type ReactNode } from 'react';
import { minWidth, useMediaQuery } from '../../hooks/useMediaQuery';
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

export interface NavMenuProps {
  items: NavItem[];
  currentPath: string;
  /** Accessible name for the navigation landmark. */
  label?: string;
  /** Lets the shell render router links; defaults to a plain anchor. */
  renderLink?: (item: NavItem, props: LinkRenderProps) => ReactElement;
}

function defaultRenderLink(
  item: NavItem,
  { children, ...linkProps }: LinkRenderProps,
): ReactElement {
  return (
    <a href={item.href} {...linkProps}>
      {children}
    </a>
  );
}

function isCurrent(item: NavItem, currentPath: string): boolean {
  return item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href);
}

export function NavMenu({
  items,
  currentPath,
  label = 'Primary',
  renderLink = defaultRenderLink,
}: NavMenuProps) {
  const isWide = useMediaQuery(minWidth('md'));
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
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.href}>
              {renderLink(item, {
                className: styles.link,
                'aria-current': isCurrent(item, currentPath) ? 'page' : undefined,
                children: item.label,
              })}
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className={styles.root} aria-label={label}>
      <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
        <Menu.Trigger className={styles.trigger} aria-label={open ? 'Close menu' : 'Open menu'}>
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.positioner} side="bottom" align="end" sideOffset={8}>
            <Menu.Popup className={styles.popup}>
              {items.map((item) => (
                <Menu.Item
                  key={item.href}
                  className={styles.item}
                  render={renderLink(item, {
                    className: styles.link,
                    'aria-current': isCurrent(item, currentPath) ? 'page' : undefined,
                    children: item.label,
                  })}
                />
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </nav>
  );
}
