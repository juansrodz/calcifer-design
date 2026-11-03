import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { CardList } from './CardList';
import * as stories from './CardList.stories';

const allStories = composeStories(stories);

const people = [
  { id: 7, name: 'Ana' },
  { id: 9, name: 'Ben' },
];

function renderPeople(
  props: Partial<Parameters<typeof CardList<(typeof people)[number]>>[0]> = {},
) {
  return render(
    <CardList
      aria-label="People"
      items={people}
      getKey={(person) => person.id}
      renderItem={(person) => <span>{person.name}</span>}
      {...props}
    />,
  );
}

describe('CardList', () => {
  it.each(Object.entries(allStories))('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('infers the item type from items, with no cast', () => {
    render(
      <CardList
        aria-label="People"
        items={people}
        getKey={(person) => {
          expectTypeOf(person).toEqualTypeOf<{ id: number; name: string }>();
          return person.id;
        }}
        renderItem={(person) => {
          expectTypeOf(person).toEqualTypeOf<{ id: number; name: string }>();
          return person.name;
        }}
      />,
    );
    expect(screen.getByText('Ana')).toBeVisible();
  });

  it('refuses a key function for the wrong type, and takes a read-only array', () => {
    const frozen: readonly string[] = ['one'];
    render(
      <CardList
        aria-label="Words"
        items={frozen}
        // @ts-expect-error A string has no `id`.
        getKey={(word) => word.id ?? word}
        renderItem={(word) => word}
      />,
    );
    expect(screen.getByText('one')).toBeVisible();
  });

  it('requires aria-label in its type', () => {
    // @ts-expect-error `aria-label` is required.
    render(<CardList items={people} getKey={(person) => person.id} renderItem={() => 'x'} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders a named list with one item for each, in order', () => {
    renderPeople();
    const list = screen.getByRole('list', { name: 'People' });
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((row) => row.tagName)).toEqual(['LI', 'LI']);
    expect(rows.map((row) => row.textContent)).toEqual(['Ana', 'Ben']);
    expect(list).not.toHaveAttribute('aria-busy');
  });

  describe('the columns', () => {
    it('uses the given width, held by min() so it can never pass the list’s own', () => {
      renderPeople({ minColumnWidth: '40rem' });
      const list = screen.getByRole('list');
      expect(list.style.getPropertyValue('--card-list-min-column')).toBe('40rem');
    });

    it('has a default that needs no prop', () => {
      renderPeople();
      expect(screen.getByRole('list').style.getPropertyValue('--card-list-min-column')).toBe('');
    });
  });

  describe('while loading with nothing to show yet', () => {
    it('is busy, with skeletons that are not read out', () => {
      renderPeople({ items: [], loading: true, skeletonCount: 3 });
      const list = screen.getByRole('list', { name: 'People' });
      expect(list).toHaveAttribute('aria-busy', 'true');
      // Hidden items are out of the accessibility tree, and still drawn.
      expect(within(list).queryAllByRole('listitem')).toEqual([]);
      expect(list.querySelectorAll('li')).toHaveLength(3);
      for (const item of list.querySelectorAll('li')) {
        expect(item).toHaveAttribute('aria-hidden', 'true');
        expect(item).toHaveTextContent('');
      }
    });

    it('draws six skeletons by default', () => {
      renderPeople({ items: [], loading: true });
      expect(screen.getByRole('list').querySelectorAll('li')).toHaveLength(6);
    });

    it.each([
      [-1, 0],
      [2.7, 2],
      [Number.NaN, 0],
      [Number.POSITIVE_INFINITY, 0],
      [1e21, 100],
    ])('copes with a skeletonCount of %s, drawing %s', (skeletonCount, drawn) => {
      renderPeople({ items: [], loading: true, skeletonCount });
      expect(screen.getByRole('list').querySelectorAll('li')).toHaveLength(drawn);
    });

    it('does not show the empty state', () => {
      renderPeople({ items: [], loading: true, emptyState: <p>Nothing here</p> });
      expect(screen.queryByText('Nothing here')).toBeNull();
    });
  });

  describe('while loading with items already there', () => {
    it('keeps the items, so that a refresh loses no focus or place, and is busy', () => {
      renderPeople({ loading: true, skeletonCount: 2 });
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-busy', 'true');
      expect(within(list).getAllByRole('listitem')).toHaveLength(2);
      expect(list.querySelectorAll('li')).toHaveLength(2);
    });
  });

  describe('with nothing to show', () => {
    it('shows the empty state, and no empty list', () => {
      renderPeople({ items: [], emptyState: <p>Nothing here</p> });
      expect(screen.getByText('Nothing here')).toBeVisible();
      expect(screen.queryByRole('list')).toBeNull();
    });

    it('draws nothing without one', () => {
      const { container } = renderPeople({ items: [] });
      expect(container).toBeEmptyDOMElement();
    });

    it('does not show it once there are items', () => {
      renderPeople({ emptyState: <p>Nothing here</p> });
      expect(screen.queryByText('Nothing here')).toBeNull();
    });
  });
});
