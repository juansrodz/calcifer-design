import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installMatchMedia } from '../../../test/matchMedia';
import { NavMenu } from './NavMenu';
import type { LinkRenderProps, NavItem, NavMenuProps } from './NavMenu';
import * as stories from './NavMenu.stories';

const { Desktop, Mobile, Vertical } = composeStories(stories);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NavMenu at desktop width', () => {
  it('renders a nav with links and marks the current page', async () => {
    installMatchMedia(true);
    const { container } = render(<Desktop />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not treat a sibling path that merely shares a prefix as current, but does treat a nested path as current', () => {
    installMatchMedia(true);
    const items = [
      { href: '/', label: 'Home' },
      { href: '/projects', label: 'Projects' },
    ];
    const { rerender } = render(<Desktop items={items} currentPath="/projects-archive" />);
    expect(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current');

    rerender(<Desktop items={items} currentPath="/projects/showcase" />);
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('NavMenu over any item type', () => {
  type IconItem = { href: string; label: string; icon: string };
  const iconItems: readonly IconItem[] = [
    { href: '/events', label: 'Events', icon: 'calendar' },
    { href: '/people', label: 'People', icon: 'group' },
  ];

  function renderIconLink(
    item: IconItem,
    { children, ...linkProps }: LinkRenderProps,
  ): ReactElement {
    return (
      <a href={item.href} data-icon={item.icon} {...linkProps}>
        {children}
      </a>
    );
  }

  it('accepts a readonly array of a wider item type and hands `renderLink` the whole item', () => {
    installMatchMedia(true);
    expectTypeOf<NavMenuProps<IconItem>['items']>().toEqualTypeOf<readonly IconItem[]>();
    expectTypeOf<NavMenuProps<IconItem>['renderLink']>().toEqualTypeOf<
      ((item: IconItem, props: LinkRenderProps) => ReactElement) | undefined
    >();

    render(
      <NavMenu<IconItem> items={iconItems} currentPath="/events" renderLink={renderIconLink} />,
    );
    expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute('data-icon', 'calendar');
    expect(screen.getByRole('link', { name: 'People' })).toHaveAttribute('data-icon', 'group');
  });

  it('keeps the plain item type the default, so existing callers compile unchanged', () => {
    expectTypeOf<NavMenuProps['items']>().toEqualTypeOf<readonly NavItem[]>();
  });

  it('types `renderLink` by the item type, so a renderer written for another type does not fit', () => {
    expectTypeOf<NavMenuProps['renderLink']>().not.toEqualTypeOf<
      NavMenuProps<IconItem>['renderLink']
    >();
  });
});

describe('NavMenu orientation', () => {
  it('lays the list out horizontally by default', () => {
    installMatchMedia(true);
    render(<Desktop />);
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('writes the vertical orientation on the list, axe-clean', async () => {
    installMatchMedia(true);
    const { container } = render(<Vertical />);
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is ignored at mobile width: the menu button renders and no list does', () => {
    installMatchMedia(false);
    render(<Vertical />);
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('NavMenu at mobile width', () => {
  it('collapses into a menu button and opens with the keyboard', async () => {
    installMatchMedia(false);
    const { container } = render(<Mobile />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menuitem', { name: 'About' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('closes on Escape', async () => {
    installMatchMedia(false);
    render(<Mobile />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(await screen.findByRole('menuitem', { name: 'About' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: 'About' })).not.toBeInTheDocument();
  });

  it('closes when the current path changes', async () => {
    installMatchMedia(false);
    const { rerender } = render(<Mobile currentPath="/projects" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(await screen.findByRole('menuitem', { name: 'About' })).toBeInTheDocument();
    rerender(<Mobile currentPath="/about" />);
    expect(screen.queryByRole('menuitem', { name: 'About' })).not.toBeInTheDocument();
  });

  it('takes its button names from labels, keeping each default it is not given', async () => {
    installMatchMedia(false);
    const { unmount } = render(<Mobile labels={{ open: 'Abrir menú', close: 'Cerrar menú' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toBeInTheDocument();
    unmount();
    render(<Mobile labels={{ open: 'Abrir menú' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('wears the tier-wide popup skin, so it cannot drift from Menu and Popover', async () => {
    installMatchMedia(false);
    render(<Mobile />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const popup = await screen.findByRole('menu');
    expect(popup).toHaveClass('surface');
    expect(popup).toHaveAttribute('data-popup', 'menu');
  });
});
