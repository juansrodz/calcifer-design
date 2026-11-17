import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './TabBar.stories';

const { Default, WithAction, ThreeItems, RouterLinks, Dark } = composeStories(stories);

const FIVE_LABELS = ['Events', 'My items', 'People', 'Alerts', 'Profile'];

// The default story's own five items, so a test that changes the count draws from the same data.
const fiveItems = Default.args.items ?? [];
const sixthItem = { href: '/settings', label: 'Settings', icon: <span /> };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TabBar', () => {
  it.each([
    ['Default', Default],
    ['WithAction', WithAction],
    ['ThreeItems', ThreeItems],
    ['RouterLinks', RouterLinks],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders one navigation named Primary holding a list of five links', () => {
    render(<Default />);
    const navigation = screen.getByRole('navigation', { name: 'Primary' });
    const list = within(navigation).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(within(list).getAllByRole('link')).toHaveLength(5);
  });

  it('takes the navigation name from `label`', () => {
    render(<Default label="Event pages" />);
    expect(screen.getByRole('navigation', { name: 'Event pages' })).toBeInTheDocument();
  });

  it('marks exactly one link current, the one whose path contains the current path', () => {
    render(<Default />);
    const current = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName('Events');
  });

  it('names every link by its label, the hidden ones included', () => {
    render(<Default />);
    for (const label of FIVE_LABELS) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('shows only the current link’s label; the others’ spans carry the visually-hidden class', () => {
    render(<Default />);
    const shown = screen.getByText('Events');
    expect(shown).not.toHaveClass('visuallyHidden');
    for (const label of FIVE_LABELS.filter((entry) => entry !== 'Events')) {
      expect(screen.getByText(label)).toHaveClass('visuallyHidden');
    }
  });

  it('hides each icon from assistive technology', () => {
    render(<Default />);
    for (const link of screen.getAllByRole('link')) {
      expect(link.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('puts the action ahead of the navigation in the document, and draws none by default', () => {
    const { container, rerender } = render(<WithAction />);
    const action = screen.getByRole('button', { name: 'Add event' });
    const navigation = screen.getByRole('navigation', { name: 'Primary' });
    expect(
      action.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    rerender(<Default />);
    expect(container.firstElementChild?.firstElementChild).toBe(
      screen.getByRole('navigation', { name: 'Primary' }),
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hands `renderLink` each item object, extra field intact, and wears its links', () => {
    render(<RouterLinks />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link).toHaveAttribute('data-router', '');
    }
    // The story's `renderLink` writes the item's own `routeId` field onto each link.
    expect(links.map((link) => link.getAttribute('data-route-id'))).toEqual([
      'events',
      'items',
      'people',
      'alerts',
      'profile',
    ]);
  });

  describe('the item-count warning', () => {
    it('warns once for one item and once for six, naming the count', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { rerender } = render(<Default items={fiveItems.slice(0, 1)} />);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenLastCalledWith('TabBar: expected two to five items, got 1.');

      rerender(<Default items={[...fiveItems, sixthItem]} />);
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenLastCalledWith('TabBar: expected two to five items, got 6.');
    });

    it('does not warn again on a re-render with the same count', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { rerender } = render(<Default items={fiveItems.slice(0, 1)} />);
      rerender(<Default items={fiveItems.slice(0, 1)} currentPath="/people" />);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it.each([2, 3, 4, 5])('does not warn for %i items', (count) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Default items={fiveItems.slice(0, count)} />);
      expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn for the five items of the default story', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Default />);
      expect(warn).not.toHaveBeenCalled();
    });
  });
});
