import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Select } from '../Select/Select';
import { FilterBar, type FilterBarFilter, type FilterBarProps } from './FilterBar';
import * as stories from './FilterBar.stories';

const allStories = composeStories(stories);

const filters: FilterBarFilter[] = [
  { id: 'status', label: 'Status: Open' },
  { id: 'owner', label: 'Owner: Ana' },
  { id: 'year', label: 'Year: 2026' },
];

const search = { searchValue: '', searchLabel: 'Search', onSearchChange: () => undefined };

function removeButton(label: string) {
  return screen.getByRole('button', { name: `Remove filter ${label}` });
}

function clearButton() {
  return screen.getByRole('button', { name: 'Clear all' });
}

/** Holds the filters as a parent would, and passes everything else through. */
function WorkingBar({
  initial = filters,
  withSearch = true,
  ...rest
}: {
  initial?: FilterBarFilter[];
  withSearch?: boolean;
  children?: FilterBarProps['children'];
}) {
  const [active, setActive] = useState(initial);
  const common = {
    ...rest,
    activeFilters: active,
    onRemoveFilter: (id: string) => setActive(active.filter((filter) => filter.id !== id)),
    onClearAll: () => setActive([]),
  };
  return withSearch ? <FilterBar {...search} {...common} /> : <FilterBar {...common} />;
}

describe('FilterBar', () => {
  it.each(Object.entries(allStories))('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  describe('search', () => {
    it('is a labelled search input that speaks in values', async () => {
      const onSearchChange = vi.fn();
      render(<FilterBar searchValue="" searchLabel="Find" onSearchChange={onSearchChange} />);
      const input = screen.getByRole('searchbox', { name: 'Find' });
      await userEvent.type(input, 'a');
      expect(onSearchChange).toHaveBeenCalledTimes(1);
      expect(onSearchChange).toHaveBeenCalledWith('a');
    });

    it('shows what it is given', () => {
      render(<FilterBar {...search} searchValue="abc" />);
      expect(screen.getByRole('searchbox')).toHaveValue('abc');
    });

    it('is left out when the bar is not given one', () => {
      render(<FilterBar activeFilters={filters} />);
      expect(screen.queryByRole('searchbox')).toBeNull();
    });

    it('requires a label with a search value in its type', () => {
      // @ts-expect-error A search needs its value, its handler and its label together.
      render(<FilterBar searchValue="" onSearchChange={() => undefined} />);
      expect(screen.getByRole('searchbox')).toBeVisible();
    });
  });

  it('renders the slots for filter controls', () => {
    render(
      <FilterBar {...search}>
        <Select label="Status" options={[{ value: 'open', label: 'Open' }]} />
      </FilterBar>,
    );
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeVisible();
  });

  describe('chips', () => {
    it('lists the filters in a named list', () => {
      render(<FilterBar activeFilters={filters} />);
      const list = screen.getByRole('list', { name: 'Active filters' });
      expect(within(list).getAllByRole('listitem')).toHaveLength(3);
      expect(within(list).getByText('Owner: Ana')).toBeVisible();
    });

    it('draws no list and no clear button with nothing active', () => {
      render(<FilterBar {...search} activeFilters={[]} onClearAll={() => undefined} />);
      expect(screen.queryByRole('list')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
    });

    it('names each remove button after its filter, and reports the id', async () => {
      const onRemoveFilter = vi.fn();
      render(<FilterBar activeFilters={filters} onRemoveFilter={onRemoveFilter} />);
      await userEvent.click(removeButton('Owner: Ana'));
      expect(onRemoveFilter).toHaveBeenCalledTimes(1);
      expect(onRemoveFilter).toHaveBeenCalledWith('owner');
    });

    it('draws no remove button without a handler, and no clear button either', () => {
      render(<FilterBar activeFilters={filters} />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('calls onClearAll, and takes no decision about the filters itself', async () => {
      const onClearAll = vi.fn();
      render(<FilterBar activeFilters={filters} onClearAll={onClearAll} />);
      await userEvent.click(clearButton());
      expect(onClearAll).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Owner: Ana')).toBeVisible();
    });

    it('takes every word from labels', () => {
      render(
        <FilterBar
          activeFilters={filters.slice(0, 1)}
          onRemoveFilter={() => undefined}
          onClearAll={() => undefined}
          labels={{
            activeFilters: 'Filtros activos',
            removeFilter: (label) => `Quitar ${label}`,
            clearAll: 'Limpiar',
          }}
        />,
      );
      expect(screen.getByRole('list', { name: 'Filtros activos' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Quitar Status: Open' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Limpiar' })).toBeVisible();
    });
  });

  describe('where focus goes', () => {
    it('moves to the next chip when a chip is removed', async () => {
      render(<WorkingBar />);
      await userEvent.click(removeButton('Status: Open'));
      expect(removeButton('Owner: Ana')).toHaveFocus();
    });

    it('moves to the previous chip when the last chip is removed', async () => {
      render(<WorkingBar />);
      await userEvent.click(removeButton('Year: 2026'));
      expect(removeButton('Owner: Ana')).toHaveFocus();
    });

    it('works from the keyboard, chip after chip', async () => {
      render(<WorkingBar />);
      removeButton('Status: Open').focus();
      await userEvent.keyboard('{Enter}');
      expect(removeButton('Owner: Ana')).toHaveFocus();
      await userEvent.keyboard(' ');
      expect(removeButton('Year: 2026')).toHaveFocus();
    });

    it('moves to the search when the only chip is removed, taking Clear with it', async () => {
      render(<WorkingBar initial={filters.slice(0, 1)} />);
      await userEvent.click(removeButton('Status: Open'));
      expect(screen.getByRole('searchbox')).toHaveFocus();
    });

    it('moves to the search when Clear all removes everything', async () => {
      render(<WorkingBar />);
      await userEvent.click(clearButton());
      expect(screen.getByRole('searchbox')).toHaveFocus();
    });

    it('moves to the first slotted control when there is no search', async () => {
      render(
        <WorkingBar withSearch={false}>
          <button type="button">Sort</button>
        </WorkingBar>,
      );
      await userEvent.click(clearButton());
      expect(screen.getByRole('button', { name: 'Sort' })).toHaveFocus();
    });

    it('moves to the bar itself when nothing in it can take focus', async () => {
      const { container } = render(<WorkingBar withSearch={false} />);
      await userEvent.click(clearButton());
      expect(container.firstElementChild).toHaveFocus();
      expect(container.firstElementChild).toHaveAttribute('tabindex', '-1');
    });

    it('skips a disabled slotted control', async () => {
      render(
        <WorkingBar withSearch={false}>
          <button type="button" disabled>
            Off
          </button>
          <button type="button">On</button>
        </WorkingBar>,
      );
      await userEvent.click(clearButton());
      expect(screen.getByRole('button', { name: 'On' })).toHaveFocus();
    });

    it('stays on Clear all when the parent keeps some filters', async () => {
      function KeepsOne() {
        const [active, setActive] = useState(filters);
        return (
          <FilterBar
            activeFilters={active}
            onRemoveFilter={() => undefined}
            onClearAll={() => setActive(filters.slice(0, 1))}
          />
        );
      }
      render(<KeepsOne />);
      await userEvent.click(clearButton());
      expect(clearButton()).toHaveFocus();
    });

    it('follows a removal that arrives later, while focus still waits there', async () => {
      const { rerender } = render(
        <FilterBar activeFilters={filters} onRemoveFilter={() => undefined} />,
      );
      await userEvent.click(removeButton('Owner: Ana'));
      expect(removeButton('Owner: Ana')).toHaveFocus();
      rerender(
        <FilterBar
          activeFilters={[filters[0] as FilterBarFilter, filters[2] as FilterBarFilter]}
          onRemoveFilter={() => undefined}
        />,
      );
      expect(removeButton('Year: 2026')).toHaveFocus();
    });

    it('does not take focus back once the user has moved on', async () => {
      const { rerender } = render(
        <>
          <FilterBar activeFilters={filters} onRemoveFilter={() => undefined} />
          <button type="button">Elsewhere</button>
        </>,
      );
      await userEvent.click(removeButton('Owner: Ana'));
      await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
      rerender(
        <>
          <FilterBar activeFilters={filters.slice(0, 1)} onRemoveFilter={() => undefined} />
          <button type="button">Elsewhere</button>
        </>,
      );
      expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
    });

    describe('after handing focus on', () => {
      /** Re-renders the bar on each keystroke in an input outside it, as a parent with state does. */
      function BarBesideInput({
        withSearch = false,
        children,
      }: {
        withSearch?: boolean;
        children?: FilterBarProps['children'];
      }) {
        const [active, setActive] = useState(filters.slice(0, 1));
        const [typed, setTyped] = useState('');
        const common = {
          activeFilters: active,
          onRemoveFilter: () => setActive([]),
          onClearAll: () => setActive([]),
          children,
        };
        return (
          <>
            {withSearch ? <FilterBar {...search} {...common} /> : <FilterBar {...common} />}
            <label>
              Outside
              <input value={typed} onChange={(event) => setTyped(event.target.value)} />
            </label>
          </>
        );
      }

      const slotted = <button type="button">Sort</button>;

      it.each([
        ['the search', 'chip', { withSearch: true }, () => screen.getByRole('searchbox')],
        ['the search', 'Clear all', { withSearch: true }, () => screen.getByRole('searchbox')],
        [
          'a slot control',
          'chip',
          { children: slotted },
          () => screen.getByRole('button', { name: 'Sort' }),
        ],
        [
          'a slot control',
          'Clear all',
          { children: slotted },
          () => screen.getByRole('button', { name: 'Sort' }),
        ],
        ['the bar itself', 'chip', {}, () => document.querySelector('[tabindex="-1"]')],
        ['the bar itself', 'Clear all', {}, () => document.querySelector('[tabindex="-1"]')],
      ])('lets go once it has reached %s from a %s', async (_target, source, props, target) => {
        render(<BarBesideInput {...props} />);
        await userEvent.click(source === 'chip' ? removeButton('Status: Open') : clearButton());
        expect(target()).toHaveFocus();
        const outside = screen.getByRole('textbox', { name: 'Outside' });
        await userEvent.click(outside);
        await userEvent.keyboard('hello');
        expect(outside).toHaveFocus();
        expect(outside).toHaveValue('hello');
      });
    });

    it('takes no focus when filters go while focus was never there', () => {
      const { rerender } = render(<FilterBar {...search} activeFilters={filters} />);
      rerender(<FilterBar {...search} activeFilters={[]} />);
      expect(document.body).toHaveFocus();
    });
  });

  describe('resultCount', () => {
    function liveRegion() {
      return screen.getByRole('status');
    }

    it('shows the count, and announces nothing on mount', () => {
      render(<FilterBar {...search} resultCount={12} />);
      expect(screen.getByText('12 results')).toBeVisible();
      expect(liveRegion()).toBeEmptyDOMElement();
    });

    it('announces politely when it changes', () => {
      const { rerender } = render(<FilterBar {...search} resultCount={12} />);
      expect(liveRegion()).toHaveAttribute('aria-live', 'polite');
      rerender(<FilterBar {...search} resultCount={3} />);
      expect(liveRegion()).toHaveTextContent('3 results');
    });

    it('says nothing new when a render leaves it the same', () => {
      const { rerender } = render(<FilterBar {...search} resultCount={12} />);
      rerender(<FilterBar {...search} searchValue="a" resultCount={12} />);
      expect(liveRegion()).toBeEmptyDOMElement();
    });

    it('announces a count coming back to what it was', () => {
      const { rerender } = render(<FilterBar {...search} resultCount={12} />);
      rerender(<FilterBar {...search} resultCount={3} />);
      rerender(<FilterBar {...search} resultCount={12} />);
      expect(liveRegion()).toHaveTextContent('12 results');
    });

    it('announces a count that arrives after none, and is silent while there is none', () => {
      const { rerender } = render(<FilterBar {...search} />);
      expect(liveRegion()).toBeEmptyDOMElement();
      expect(screen.queryByText(/results?$/)).toBeNull();
      rerender(<FilterBar {...search} resultCount={5} />);
      expect(liveRegion()).toHaveTextContent('5 results');
      rerender(<FilterBar {...search} />);
      expect(liveRegion()).toBeEmptyDOMElement();
    });

    it('says zero and one in good English', () => {
      const { rerender } = render(<FilterBar {...search} resultCount={0} />);
      expect(screen.getByText('0 results')).toBeVisible();
      rerender(<FilterBar {...search} resultCount={1} />);
      expect(liveRegion()).toHaveTextContent('1 result');
    });

    it('takes its wording from labels', () => {
      const labels = { resultCount: (count: number) => `${count} resultados` };
      const { rerender } = render(<FilterBar {...search} resultCount={2} labels={labels} />);
      expect(screen.getByText('2 resultados')).toBeVisible();
      rerender(<FilterBar {...search} resultCount={4} labels={labels} />);
      expect(liveRegion()).toHaveTextContent('4 resultados');
    });

    it('holds no filter logic: the count is only what it is told', () => {
      const { rerender } = render(
        <FilterBar {...search} activeFilters={filters} resultCount={9} />,
      );
      rerender(<FilterBar {...search} activeFilters={[]} resultCount={9} />);
      expect(screen.getByText('9 results')).toBeVisible();
      expect(liveRegion()).toBeEmptyDOMElement();
    });
  });
});
