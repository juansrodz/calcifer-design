import { fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, useState, type FormEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe, axeDocument } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import { DataGrid } from './DataGrid';
import {
  filterableInventoryColumns,
  inventoryColumns,
  makeInventoryRows,
  type InventoryRow,
} from './fixtures';
import { createQueryMatcher, emptyDataGridQuery } from './query';
import type { DataGridQuery } from './types';
import { useDebouncedDraft } from './useDebouncedDraft';

type GridProps = React.ComponentProps<typeof DataGrid<InventoryRow>>;

const rowTotal = 40;

function renderGrid(overrides: Partial<GridProps> = {}) {
  return render(
    <DataGrid<InventoryRow>
      gridId="filter-grid"
      heading="Inventory"
      rows={makeInventoryRows(rowTotal)}
      columns={filterableInventoryColumns}
      getRowId={(row) => row.id}
      {...overrides}
    />,
  );
}

/** The ids of the fixture rows a test expects to see, in `rows` order. */
function idsOfRowsWhere(test: (row: InventoryRow) => boolean): string[] {
  return makeInventoryRows(rowTotal)
    .filter(test)
    .map((row) => row.id);
}

/** The text of one column's cell in every rendered body row, top to bottom. */
function cellTextsOf(columnName: string): string[] {
  const columnIndex = screen
    .getAllByRole('columnheader')
    .findIndex((header) => header.textContent === columnName);
  return screen
    .getAllByRole('row')
    .filter((row) => row.closest('tbody') !== null)
    .flatMap((row) => {
      const cells = within(row).queryAllByRole('gridcell');
      // The state row is one cell across every column.
      return cells.length > 1 ? [cells[columnIndex]?.textContent ?? ''] : [];
    });
}

function scrollArea(): HTMLElement {
  return document.querySelector('[data-grid-scroll]') as HTMLElement;
}

/** jsdom has no `scrollTo`; a browser scrolls and then fires a scroll event, and so does this. */
function emulateScrollTo() {
  const scrollElement = scrollArea();
  scrollElement.scrollTo = ((options: ScrollToOptions) => {
    scrollElement.scrollTop = options.top ?? 0;
    scrollElement.dispatchEvent(new Event('scroll'));
  }) as typeof scrollElement.scrollTo;
}

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
});

afterEach(() => {
  restoreElementSize();
});

describe('client filtering', () => {
  it('shows only the rows that match the initial query', () => {
    const outIds = idsOfRowsWhere((row) => row.status === 'out');
    renderGrid({ initialQuery: { filters: { status: 'out' } } });

    const statuses = cellTextsOf('Status');
    expect(statuses).toHaveLength(outIds.length);
    expect(statuses.every((status) => status === 'out')).toBe(true);
    expect(cellTextsOf('SKU')).toEqual(
      outIds.map((rowId) => `SKU-${999 + Number(rowId.replace('item-', ''))}`),
    );
    expect(screen.getByText(`${outIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', String(outIds.length + 1));
  });

  it('lets initialQuery sorting win over initialSorting', () => {
    const { unmount } = renderGrid({
      initialSorting: [{ id: 'name', desc: false }],
      initialQuery: { sorting: [{ id: 'sku', desc: true }] },
    });
    expect(screen.getByRole('columnheader', { name: 'SKU' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
    expect(cellTextsOf('SKU')[0]).toBe(`SKU-${999 + rowTotal}`);
    unmount();

    // A query without a sort leaves the initial sort in place.
    renderGrid({
      initialSorting: [{ id: 'name', desc: false }],
      initialQuery: { filters: { status: 'out' } },
    });
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('drops filters it cannot apply', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    // No column is called `warehouse`, and the SKU column has no filter.
    renderGrid({
      initialQuery: { filters: { warehouse: 'North', sku: 'SKU-1000' } },
      onQueryChange,
    });
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', String(rowTotal + 1));

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ filters: {} }));
  });

  it('reports sorting changes in client mode', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderGrid({ initialQuery: { filters: { status: 'out' } }, onQueryChange });
    expect(onQueryChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith({
      sorting: [{ id: 'name', desc: false }],
      filters: { status: 'out' },
      matchMode: 'all',
      search: '',
    } satisfies DataGridQuery);
    const names = cellTextsOf('Name');
    expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second)));
    expect(cellTextsOf('Status').every((status) => status === 'out')).toBe(true);
  });

  it('scrolls to the top when the query changes', async () => {
    const user = userEvent.setup();
    renderGrid();
    emulateScrollTo();
    act(() => {
      scrollArea().scrollTop = 40 * 20;
      scrollArea().dispatchEvent(new Event('scroll'));
    });
    expect(scrollArea().scrollTop).toBe(40 * 20);

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));

    expect(scrollArea().scrollTop).toBe(0);
  });

  it('clears a highlight whose row the query hides', () => {
    const onHighlightChange = vi.fn();
    // item-4 is out of stock, so the query keeps it.
    const { unmount } = renderGrid({
      highlightedRowId: 'item-4',
      onHighlightChange,
      initialQuery: { filters: { status: 'out' } },
    });
    expect(onHighlightChange).not.toHaveBeenCalled();
    unmount();

    // item-1 is in stock, so the query hides it.
    renderGrid({
      highlightedRowId: 'item-1',
      onHighlightChange,
      initialQuery: { filters: { status: 'out' } },
    });
    expect(onHighlightChange).toHaveBeenCalledTimes(1);
    expect(onHighlightChange).toHaveBeenCalledWith(null);
  });

  it('selects only matching rows', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    const outIds = idsOfRowsWhere((row) => row.status === 'out');
    renderGrid({
      selectionMode: 'multiple',
      onSelectedRowIdsChange,
      initialQuery: { filters: { status: 'out' } },
    });

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(onSelectedRowIdsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(outIds);
    expect(screen.getByText(`${outIds.length} selected`)).toBeInTheDocument();
  });
});

describe('the filtered-empty state', () => {
  // Out-of-stock rows exist, but none of them is a hex bolt.
  const matchesNothing: Partial<DataGridQuery> = {
    filters: { status: 'out' },
    search: 'Hex bolt',
    sorting: [{ id: 'name', desc: true }],
    matchMode: 'any',
  };

  it('shows the filtered-empty state and clears filters from it', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const { container } = renderGrid({ initialQuery: matchesNothing, onQueryChange });

    const grid = screen.getByRole('grid');
    // The empty state's heading, under the card's h2.
    expect(
      within(grid).getByRole('heading', { level: 3, name: 'No rows match the search or filters.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');
    expect(screen.getByText(`0 of ${rowTotal} rows`)).toBeInTheDocument();
    expect(grid).toHaveAttribute('aria-rowcount', '2');
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(grid).getByRole('button', { name: 'Clear filters' }));

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith({
      sorting: [{ id: 'name', desc: true }],
      filters: {},
      matchMode: 'any',
      search: '',
    } satisfies DataGridQuery);
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(cellTextsOf('Name').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  // The state cell spans the table, which can be wider than the scroll area (a phone), so the
  // message and its button keep to the scroll area's width, where they can be seen.
  it('keeps the filtered-empty state to the width of the scroll area', () => {
    renderGrid({ initialQuery: matchesNothing });

    const button = within(screen.getByRole('grid')).getByRole('button', { name: 'Clear filters' });
    const stateBox = button.closest('td')?.firstElementChild as HTMLElement;
    // The scroll area is 800px wide in the stubbed layout.
    expect(stateBox.style.inlineSize).toBe('800px');
  });

  it('keeps the Clear filters button in the tab order', async () => {
    const user = userEvent.setup();
    renderGrid({ initialQuery: matchesNothing });

    // The toolbar is one tab stop, ahead of the grid.
    await user.tab();
    expect(screen.getByRole('toolbar', { name: 'Grid tools' })).toContainElement(
      document.activeElement as HTMLElement,
    );
    await user.tab();
    expect(screen.getByRole('columnheader', { name: 'SKU' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toHaveFocus();
  });

  it('renders filteredEmptyState with the clear action', async () => {
    const user = userEvent.setup();
    renderGrid({
      initialQuery: matchesNothing,
      filteredEmptyState: (clearFilters) => (
        <button type="button" onClick={clearFilters}>
          Show every item
        </button>
      ),
    });
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');

    await user.click(screen.getByRole('button', { name: 'Show every item' }));

    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show every item' })).not.toBeInTheDocument();
  });

  it('takes its words from labels', () => {
    renderGrid({
      initialQuery: matchesNothing,
      labels: {
        filteredEmpty: 'Ninguna fila coincide.',
        clearFilters: 'Quitar filtros',
        filteredRowCount: (shown, total) => `${shown} de ${total} filas`,
      },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Ninguna fila coincide.');
    expect(screen.getByRole('button', { name: 'Quitar filtros' })).toBeInTheDocument();
    expect(screen.getByText(`0 de ${rowTotal} filas`)).toBeInTheDocument();
  });

  it('shows the empty state, not the filtered one, when nothing filters', () => {
    renderGrid({ rows: [], initialQuery: { sorting: [{ id: 'name', desc: false }] } });
    expect(screen.getByRole('status')).toHaveTextContent('No rows to show.');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});

describe('a controlled query', () => {
  interface SearchOutsideProps {
    onQueryChange: (query: DataGridQuery) => void;
    onSelectedRowIdsChange: (rowIds: string[]) => void;
  }

  /** An app with its own search field outside the grid, holding the query itself. */
  function SearchOutside({ onQueryChange, onSelectedRowIdsChange }: SearchOutsideProps) {
    const [query, setQuery] = useState<DataGridQuery>(emptyDataGridQuery);
    return (
      <>
        <label>
          Find items
          <input
            value={query.search}
            onChange={(event) => setQuery({ ...query, search: event.target.value })}
          />
        </label>
        <DataGrid<InventoryRow>
          gridId="controlled-grid"
          heading="Inventory"
          rows={makeInventoryRows(rowTotal)}
          columns={filterableInventoryColumns}
          getRowId={(row) => row.id}
          selectionMode="multiple"
          onSelectedRowIdsChange={onSelectedRowIdsChange}
          query={query}
          onQueryChange={(nextQuery) => {
            onQueryChange(nextQuery);
            setQuery(nextQuery);
          }}
        />
      </>
    );
  }

  it('follows a controlled query from outside the grid', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onSelectedRowIdsChange = vi.fn();
    render(
      <SearchOutside
        onQueryChange={onQueryChange}
        onSelectedRowIdsChange={onSelectedRowIdsChange}
      />,
    );
    const hexBoltIds = idsOfRowsWhere((row) => row.name.startsWith('Hex bolt'));
    // item-1 is a hex bolt and stays in view; item-2 is a washer and leaves it.
    await user.click(screen.getByRole('checkbox', { name: 'Select SKU-1000' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select SKU-1001' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Find items' }), 'Hex bolt');

    expect(cellTextsOf('Name')).toHaveLength(hexBoltIds.length);
    expect(cellTextsOf('Name').every((name) => name.startsWith('Hex bolt'))).toBe(true);
    expect(screen.getByText(`${hexBoltIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select SKU-1000' })).not.toBeChecked();
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith([]);
    // The app changed the query itself, so the grid reports nothing.
    expect(onQueryChange).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox', { name: 'Find items' }), ' nowhere');
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ search: '' }));
    expect(screen.getByRole('textbox', { name: 'Find items' })).toHaveValue('');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
  });

  it('clears the selection when one change of a controlled query hides part of it', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    render(
      <SearchOutside onQueryChange={vi.fn()} onSelectedRowIdsChange={onSelectedRowIdsChange} />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Select SKU-1000' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select SKU-1001' }));
    onSelectedRowIdsChange.mockClear();

    // One change hides item-2 and keeps item-1, which the clear must not leave selected.
    await user.click(screen.getByRole('textbox', { name: 'Find items' }));
    await user.paste('Hex bolt');

    expect(onSelectedRowIdsChange.mock.calls).toEqual([[[]]]);
    expect(screen.getByRole('checkbox', { name: 'Select SKU-1000' })).not.toBeChecked();
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
  });

  it('shows a controlled query until the app changes it', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const isHexBolt = (row: InventoryRow) => row.name.startsWith('Hex bolt');
    const hexBoltCount = idsOfRowsWhere(isHexBolt).length;
    // The initial query's filter would change what the controlled search shows.
    expect(idsOfRowsWhere((row) => isHexBolt(row) && row.status === 'out')).not.toHaveLength(
      hexBoltCount,
    );
    renderGrid({
      query: { ...emptyDataGridQuery, search: 'Hex bolt' },
      // Ignored: a controlled query wins over it.
      initialQuery: { filters: { status: 'out' }, sorting: [{ id: 'sku', desc: true }] },
      onQueryChange,
    });
    expect(screen.getByText(`${hexBoltCount} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'SKU' })).not.toHaveAttribute('aria-sort');
    const shownNames = cellTextsOf('Name');

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith({
      ...emptyDataGridQuery,
      sorting: [{ id: 'name', desc: false }],
      search: 'Hex bolt',
    });
    // The app kept its query, so the grid still shows it.
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
    expect(cellTextsOf('Name')).toEqual(shownNames);
  });

  it('keeps an inline controlled query whose contents have not changed', () => {
    const onHighlightChange = vi.fn();
    const rows = makeInventoryRows(rowTotal);
    // A new query object on every render, with the same contents; it hides item-1, which the app
    // keeps highlighted.
    const gridElement = () => (
      <DataGrid<InventoryRow>
        gridId="inline-query-grid"
        heading="Inventory"
        rows={rows}
        columns={filterableInventoryColumns}
        getRowId={(row) => row.id}
        query={{ ...emptyDataGridQuery, filters: { status: 'out' } }}
        highlightedRowId="item-1"
        onHighlightChange={onHighlightChange}
      />
    );
    const { rerender } = render(gridElement());
    expect(onHighlightChange).toHaveBeenCalledTimes(1);

    rerender(gridElement());
    rerender(gridElement());

    // The shown rows are the same rows, so the hidden highlight is not reported again.
    expect(onHighlightChange).toHaveBeenCalledTimes(1);
  });

  it('is read-only without onQueryChange', async () => {
    const user = userEvent.setup();
    const rows = makeInventoryRows(rowTotal);
    const readOnlyGrid = (query: DataGridQuery) => (
      <DataGrid<InventoryRow>
        gridId="read-only-query-grid"
        heading="Inventory"
        rows={rows}
        columns={filterableInventoryColumns}
        getRowId={(row) => row.id}
        query={query}
      />
    );
    const outRows = rows.filter((row) => row.status === 'out');
    const outNamesDescending = outRows
      .map((row) => row.name)
      .sort((first, second) => second.localeCompare(first));
    const { rerender } = render(
      readOnlyGrid({
        ...emptyDataGridQuery,
        filters: { status: 'out' },
        sorting: [{ id: 'name', desc: true }],
      }),
    );

    // The filter and the sort apply, but nothing offers to change the query.
    expect(screen.getByText(`${outRows.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Filters/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Match filters' })).not.toBeInTheDocument();
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    for (const header of screen.getAllByRole('columnheader')) {
      expect(header).not.toHaveAttribute('data-sortable');
      if (header !== nameHeader) expect(header).not.toHaveAttribute('aria-sort');
    }
    expect(cellTextsOf('Name')).toEqual(outNamesDescending);

    // Neither a click nor Enter on a header changes the order.
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(nameHeader).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(cellTextsOf('Name')).toEqual(outNamesDescending);
    // The grid does not take the key: a header it cannot sort leaves Enter to the page.
    expect(fireEvent.keyDown(nameHeader, { key: 'Enter' })).toBe(true);
    await user.click(screen.getByRole('columnheader', { name: 'SKU' }));
    expect(screen.getByRole('columnheader', { name: 'SKU' })).not.toHaveAttribute('aria-sort');
    expect(cellTextsOf('Name')).toEqual(outNamesDescending);

    // Filtered to nothing, it says so, with no Clear filters button that would do nothing.
    rerender(
      readOnlyGrid({ ...emptyDataGridQuery, filters: { status: 'out' }, search: 'Hex bolt' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});

describe('useDebouncedDraft', () => {
  const searchDelay = 400;

  // Plain fake timers: the clock moves only when a test moves it, so the 399ms boundary is exact.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderDraft(initialCommitted = '') {
    const commit = vi.fn();
    const view = renderHook(({ committed }) => useDebouncedDraft(committed, commit, searchDelay), {
      initialProps: { committed: initialCommitted },
    });
    return { commit, ...view };
  }

  it('commits 400ms after the last change, not before', () => {
    const { commit, result } = renderDraft();

    act(() => result.current.change('b'));
    act(() => vi.advanceTimersByTime(300));
    act(() => result.current.change('bo'));
    act(() => vi.advanceTimersByTime(399));

    expect(result.current.draft).toBe('bo');
    expect(commit).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('bo');
  });

  it('commits a pending change at once on flush, and only once', () => {
    const { commit, result } = renderDraft();
    act(() => result.current.change('bolt'));

    act(() => result.current.flush());

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('bolt');
    act(() => vi.advanceTimersByTime(1000));
    expect(commit).toHaveBeenCalledTimes(1);

    // Nothing is pending now, so a second flush has nothing to say.
    act(() => result.current.flush());
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('sets the draft and commits at once on commitNow, dropping the pending change', () => {
    const { commit, result } = renderDraft();
    act(() => result.current.change('bol'));

    act(() => result.current.commitNow(''));

    expect(result.current.draft).toBe('');
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('');
    act(() => vi.advanceTimersByTime(1000));
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('drops a pending change when the committed value is reset elsewhere', () => {
    const { commit, result, rerender } = renderDraft('zzz');
    expect(result.current.draft).toBe('zzz');
    act(() => result.current.change('zzzx'));

    // "Clear filters" empties the query before the delay ends.
    rerender({ committed: '' });

    expect(result.current.draft).toBe('');
    act(() => vi.advanceTimersByTime(1000));
    expect(commit).not.toHaveBeenCalled();
    expect(result.current.draft).toBe('');
  });

  it('takes a committed value that changes while nothing is pending', () => {
    const { result, rerender } = renderDraft('bolt');

    rerender({ committed: 'washer' });

    expect(result.current.draft).toBe('washer');
  });

  it('keeps the typed draft when the committed value is its own, trimmed', () => {
    const { commit, result, rerender } = renderDraft();
    act(() => result.current.change('hex '));
    act(() => vi.advanceTimersByTime(searchDelay));
    expect(commit).toHaveBeenCalledWith('hex ');

    // The query holds the term trimmed, and the draft keeps the space the user typed.
    rerender({ committed: 'hex' });
    expect(result.current.draft).toBe('hex ');

    act(() => result.current.change('hex b'));
    expect(result.current.draft).toBe('hex b');
  });

  it('adopts a later reset to a value it once committed', () => {
    const { result, rerender } = renderDraft();
    act(() => result.current.change('bolt'));
    act(() => vi.advanceTimersByTime(searchDelay));
    rerender({ committed: 'bolt' });
    rerender({ committed: '' });
    expect(result.current.draft).toBe('');

    rerender({ committed: 'bolt' });

    expect(result.current.draft).toBe('bolt');
  });

  it('flushes a pending change on unmount, once, and nothing after', () => {
    const { commit, result, unmount } = renderDraft();
    act(() => result.current.change('bolt'));

    unmount();

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('bolt');
    vi.advanceTimersByTime(1000);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('commits nothing on unmount when nothing is pending', () => {
    const { commit, unmount } = renderDraft('bolt');

    unmount();

    expect(commit).not.toHaveBeenCalled();
  });

  it('commits through the newest commit, from its timer and on unmount', () => {
    const firstCommit = vi.fn();
    const { result, rerender, unmount } = renderHook(
      ({ commit }) => useDebouncedDraft('', commit, searchDelay),
      { initialProps: { commit: firstCommit } },
    );

    // The timer was set while the first commit was current.
    act(() => result.current.change('bolt'));
    const secondCommit = vi.fn();
    rerender({ commit: secondCommit });
    act(() => vi.advanceTimersByTime(searchDelay));

    expect(firstCommit).not.toHaveBeenCalled();
    expect(secondCommit).toHaveBeenCalledTimes(1);
    expect(secondCommit).toHaveBeenCalledWith('bolt');

    act(() => result.current.change('bolts'));
    const lastCommit = vi.fn();
    rerender({ commit: lastCommit });
    unmount();

    expect(lastCommit).toHaveBeenCalledTimes(1);
    expect(lastCommit).toHaveBeenCalledWith('bolts');
    expect(secondCommit).toHaveBeenCalledTimes(1);
  });
});

describe('the filters button and match mode', () => {
  it('counts filters and search on the filters button', async () => {
    const user = userEvent.setup();
    renderGrid({
      initialQuery: { filters: { name: 'Hex', status: 'out' }, search: 'bolt' },
    });

    const filtersButton = screen.getByRole('button', { name: 'Filters, 3 active' });
    expect(within(filtersButton).getByText('3')).toBeInTheDocument();
    expect(filtersButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(filtersButton);

    expect(filtersButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(filtersButton);

    expect(filtersButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows no count on the filters button when nothing is active', () => {
    renderGrid();

    const filtersButton = screen.getByRole('button', { name: 'Filters' });
    expect(filtersButton).toHaveTextContent('');
    expect(filtersButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('counts a search as one criterion', () => {
    renderGrid({ initialQuery: { search: 'bolt' } });

    const filtersButton = screen.getByRole('button', { name: 'Filters, 1 active' });
    expect(within(filtersButton).getByText('1')).toBeInTheDocument();
  });

  it('shows match mode while filtering and reports it', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const { container } = renderGrid({
      initialQuery: { filters: { status: 'out' } },
      onQueryChange,
    });

    const matchMode = screen.getByRole('group', { name: 'Match filters' });
    expect(within(matchMode).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(matchMode).getByRole('button', { name: 'Any' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(matchMode).getByRole('button', { name: 'Any' }));

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ matchMode: 'any' }));
    expect(within(matchMode).getByRole('button', { name: 'Any' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(matchMode).getByRole('button', { name: 'All' }));

    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ matchMode: 'all' }));
  });

  it('hides match mode with no column filter and the strip closed, and shows it when open', async () => {
    const user = userEvent.setup();
    // A search is not a column filter, so it does not bring match mode.
    renderGrid({ initialQuery: { search: 'bolt' } });
    expect(screen.queryByRole('group', { name: 'Match filters' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters, 1 active' }));

    expect(screen.getByRole('group', { name: 'Match filters' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters, 1 active' }));

    expect(screen.queryByRole('group', { name: 'Match filters' })).not.toBeInTheDocument();
  });

  it('orders the toolbar: search, match mode, then filters, then refresh', () => {
    renderGrid({
      initialQuery: { filters: { status: 'out' } },
      onRefresh: vi.fn(),
      enableSearch: true,
    });

    const toolbar = screen.getByRole('toolbar', { name: 'Grid tools' });
    expect(
      within(toolbar)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label') ?? button.textContent),
    ).toEqual(['Search', 'All', 'Any', 'Filters, 1 active', 'Refresh']);
  });

  it('offers no filters when no column has a filter', () => {
    renderGrid({ columns: inventoryColumns });

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Filters/ })).not.toBeInTheDocument();
  });

  it('offers no filters in server mode without onQueryChange', () => {
    renderGrid({
      mode: 'server',
      initialQuery: { filters: { status: 'out' } },
      onRefresh: vi.fn(),
    });

    const toolbar = screen.getByRole('toolbar', { name: 'Grid tools' });
    expect(within(toolbar).getAllByRole('button')).toHaveLength(1);
    expect(within(toolbar).getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Filters/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Match filters' })).not.toBeInTheDocument();
  });

  it('offers filters in server mode once onQueryChange is given', () => {
    renderGrid({
      mode: 'server',
      initialQuery: { filters: { status: 'out' } },
      onQueryChange: vi.fn(),
    });

    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Match filters' })).toBeInTheDocument();
  });

  it('takes its words from labels', () => {
    renderGrid({
      initialQuery: { filters: { status: 'out' } },
      labels: {
        filters: (activeCount) => `Filtros, ${activeCount}`,
        matchMode: 'Coincidir',
        matchAll: 'Todos',
        matchAny: 'Alguno',
      },
    });

    expect(screen.getByRole('button', { name: 'Filtros, 1' })).toBeInTheDocument();
    const matchMode = screen.getByRole('group', { name: 'Coincidir' });
    expect(within(matchMode).getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(within(matchMode).getByRole('button', { name: 'Alguno' })).toBeInTheDocument();
  });
});

describe('search', () => {
  const searchDelay = 400;

  afterEach(() => {
    vi.useRealTimers();
  });

  /** The ids of the fixture rows a search for `term` leaves, in `rows` order. */
  function idsOfRowsSearchedFor(term: string): string[] {
    const matcher = createQueryMatcher(filterableInventoryColumns, {
      ...emptyDataGridQuery,
      search: term,
    });
    if (matcher === null) throw new Error('a search term should give a matcher');
    return makeInventoryRows(rowTotal)
      .filter(matcher)
      .map((row) => row.id);
  }

  function searchButton(): HTMLElement {
    return screen.getByRole('button', { name: 'Search' });
  }

  function searchField(): HTMLElement {
    return screen.getByRole('searchbox', { name: 'Search rows' });
  }

  /** A click on a button: focus moves to it first, as a press of the pointer moves it. */
  function clickButton(button: HTMLElement) {
    act(() => button.focus());
    fireEvent.click(button);
  }

  it('opens search with focus in the field and filters after the pause', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    renderGrid({ enableSearch: true, onQueryChange });
    expect(searchButton()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('searchbox', { name: 'Search rows' })).not.toBeInTheDocument();

    clickButton(searchButton());

    expect(searchButton()).toHaveAttribute('aria-pressed', 'true');
    expect(searchField()).toHaveFocus();

    fireEvent.change(searchField(), { target: { value: 'bolt' } });
    act(() => vi.advanceTimersByTime(searchDelay - 1));
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(onQueryChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    const boltIds = idsOfRowsSearchedFor('bolt');
    expect(boltIds.length).toBeGreaterThan(0);
    expect(boltIds.length).toBeLessThan(rowTotal);
    expect(screen.getByText(`${boltIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith({ ...emptyDataGridQuery, search: 'bolt' });
    // The search counts on the filters button.
    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument();
  });

  it('searches at once on Enter and on clearing', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    renderGrid({ enableSearch: true, onQueryChange });
    clickButton(searchButton());

    fireEvent.change(searchField(), { target: { value: 'washer' } });
    fireEvent.keyDown(searchField(), { key: 'Enter' });

    const washerIds = idsOfRowsSearchedFor('washer');
    expect(screen.getByText(`${washerIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...emptyDataGridQuery, search: 'washer' });

    clickButton(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(onQueryChange).toHaveBeenLastCalledWith(emptyDataGridQuery);
    expect(searchField()).toHaveValue('');
    expect(searchField()).toHaveFocus();

    // Nothing was left waiting to commit afterwards.
    act(() => vi.advanceTimersByTime(searchDelay * 2));
    expect(onQueryChange).toHaveBeenCalledTimes(2);
  });

  it('never submits a form the grid sits in on Enter', () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <DataGrid<InventoryRow>
          gridId="search-form-grid"
          heading="Inventory"
          rows={makeInventoryRows(rowTotal)}
          columns={filterableInventoryColumns}
          getRowId={(row) => row.id}
          enableSearch
        />
      </form>,
    );
    clickButton(searchButton());
    fireEvent.change(searchField(), { target: { value: 'bolt' } });
    const enter = fireEvent.keyDown(searchField(), { key: 'Enter' });

    expect(enter).toBe(false);
    const boltIds = idsOfRowsSearchedFor('bolt');
    expect(screen.getByText(`${boltIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
  });

  it('clears, then closes, on Escape', () => {
    vi.useFakeTimers();
    renderGrid({ enableSearch: true });
    clickButton(searchButton());
    fireEvent.change(searchField(), { target: { value: 'bolt' } });
    fireEvent.keyDown(searchField(), { key: 'Enter' });
    expect(
      screen.getByText(`${idsOfRowsSearchedFor('bolt').length} of ${rowTotal} rows`),
    ).toBeInTheDocument();

    fireEvent.keyDown(searchField(), { key: 'Escape' });

    expect(searchField()).toHaveValue('');
    expect(searchField()).toHaveFocus();
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();

    fireEvent.keyDown(searchField(), { key: 'Escape' });

    expect(screen.queryByRole('searchbox', { name: 'Search rows' })).not.toBeInTheDocument();
    expect(searchButton()).toHaveFocus();
    expect(searchButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps the Escape that closes the field from anything around the grid', () => {
    // Above React's root, as a dialog's or a page's own key handling would be.
    const onAncestorKeyDown = vi.fn();
    document.body.addEventListener('keydown', onAncestorKeyDown);
    renderGrid({ enableSearch: true });
    clickButton(searchButton());

    const escape = fireEvent.keyDown(searchField(), { key: 'Escape' });
    document.body.removeEventListener('keydown', onAncestorKeyDown);

    expect(screen.queryByRole('searchbox', { name: 'Search rows' })).not.toBeInTheDocument();
    expect(escape).toBe(false);
    expect(onAncestorKeyDown).not.toHaveBeenCalled();
  });

  it('never hides an active search', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    renderGrid({ enableSearch: true, onQueryChange });
    clickButton(searchButton());
    fireEvent.change(searchField(), { target: { value: 'bolt' } });
    act(() => vi.advanceTimersByTime(searchDelay / 4));

    // The press takes focus from the field first, which commits what it holds.
    clickButton(searchButton());

    expect(screen.queryByRole('searchbox', { name: 'Search rows' })).not.toBeInTheDocument();
    expect(searchButton()).toHaveAttribute('aria-pressed', 'false');
    expect(searchButton()).toHaveFocus();
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(onQueryChange).toHaveBeenLastCalledWith(emptyDataGridQuery);
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();

    // Opened again, it starts empty, and closing it with no search reports nothing.
    clickButton(searchButton());
    expect(searchField()).toHaveValue('');
    const reportsSoFar = onQueryChange.mock.calls.length;
    clickButton(searchButton());
    expect(onQueryChange).toHaveBeenCalledTimes(reportsSoFar);
    act(() => vi.advanceTimersByTime(searchDelay * 2));
    expect(onQueryChange).toHaveBeenCalledTimes(reportsSoFar);
  });

  /** A grid whose app owns the query, with a button outside it that searches for washers. */
  function ControlledSearchGrid() {
    const [query, setQuery] = useState<DataGridQuery>(emptyDataGridQuery);
    return (
      <>
        <button type="button" onClick={() => setQuery({ ...query, search: 'washer' })}>
          Find washers
        </button>
        <DataGrid<InventoryRow>
          gridId="controlled-search-grid"
          heading="Inventory"
          rows={makeInventoryRows(rowTotal)}
          columns={filterableInventoryColumns}
          getRowId={(row) => row.id}
          enableSearch
          query={query}
          onQueryChange={setQuery}
        />
      </>
    );
  }

  it('shows the field for a search the app sets while it is closed', () => {
    render(<ControlledSearchGrid />);
    expect(screen.queryByRole('searchbox', { name: 'Search rows' })).not.toBeInTheDocument();

    clickButton(screen.getByRole('button', { name: 'Find washers' }));

    expect(searchField()).toHaveValue('washer');
    expect(searchButton()).toHaveAttribute('aria-pressed', 'true');
    const washerIds = idsOfRowsSearchedFor('washer');
    expect(screen.getByText(`${washerIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
  });

  it('keeps a field the app opened while the user clears it from inside', () => {
    render(<ControlledSearchGrid />);
    clickButton(screen.getByRole('button', { name: 'Find washers' }));
    act(() => searchField().focus());

    // Escape with text clears the search; the field the user is in stays, and keeps focus.
    fireEvent.keyDown(searchField(), { key: 'Escape' });

    expect(searchField()).toHaveValue('');
    expect(searchField()).toHaveFocus();
    expect(searchButton()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
  });

  it('opens on mount with the initial search, leaving focus where it is', () => {
    renderGrid({ enableSearch: true, initialQuery: { search: 'washer' } });

    expect(searchField()).toHaveValue('washer');
    expect(searchField()).not.toHaveFocus();
    expect(searchButton()).toHaveAttribute('aria-pressed', 'true');
    const washerIds = idsOfRowsSearchedFor('washer');
    expect(screen.getByText(`${washerIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
  });

  it('drops a pending search when Clear filters clears the query', () => {
    vi.useFakeTimers();
    renderGrid({ enableSearch: true, initialQuery: { search: 'Nothing like this' } });
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');
    act(() => searchField().focus());

    fireEvent.change(searchField(), { target: { value: 'Nothing like this at all' } });
    act(() => vi.advanceTimersByTime(searchDelay / 3));
    clickButton(screen.getByRole('button', { name: 'Clear filters' }));
    act(() => vi.advanceTimersByTime(500));

    expect(searchField()).toHaveValue('');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  // The committed search is already empty, so clearing the query leaves it unchanged and the
  // draft's own reset does not fire: only the commit when focus leaves the field drops the text.
  it('drops a pending search when Clear filters clears a column filter', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    renderGrid({
      enableSearch: true,
      initialQuery: { filters: { name: 'Nothing like this' } },
      onQueryChange,
    });
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');
    clickButton(searchButton());

    fireEvent.change(searchField(), { target: { value: 'bolt' } });
    act(() => vi.advanceTimersByTime(searchDelay / 3));
    clickButton(screen.getByRole('button', { name: 'Clear filters' }));
    act(() => vi.advanceTimersByTime(searchDelay * 2));

    expect(searchField()).toHaveValue('');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(onQueryChange).toHaveBeenLastCalledWith(emptyDataGridQuery);
  });

  it('offers no search in server mode without onQueryChange', () => {
    const { rerender } = renderGrid({ mode: 'server', enableSearch: true, onRefresh: vi.fn() });

    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();

    rerender(
      <DataGrid<InventoryRow>
        gridId="filter-grid"
        heading="Inventory"
        rows={makeInventoryRows(rowTotal)}
        columns={filterableInventoryColumns}
        getRowId={(row) => row.id}
        mode="server"
        enableSearch
        onQueryChange={vi.fn()}
      />,
    );

    expect(searchButton()).toBeInTheDocument();
  });

  it('offers no search for a read-only query', () => {
    renderGrid({ enableSearch: true, query: { ...emptyDataGridQuery, search: 'bolt' } });

    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search rows' })).not.toBeInTheDocument();
    const boltIds = idsOfRowsSearchedFor('bolt');
    expect(screen.getByText(`${boltIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
  });

  it('has no axe violations with the field open', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid({ enableSearch: true });
    await user.click(searchButton());
    await user.keyboard('bolt');

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes its words from labels', async () => {
    const user = userEvent.setup();
    renderGrid({
      enableSearch: true,
      labels: { search: 'Buscar', searchField: 'Buscar filas', clearSearch: 'Borrar búsqueda' },
    });
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.keyboard('bolt');

    expect(screen.getByRole('searchbox', { name: 'Buscar filas' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Borrar búsqueda' })).toBeInTheDocument();
  });
});

describe('the filter strip', () => {
  const textFilterDelay = 300;

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * The timed tests use plain fake timers, so the clock moves only when a test moves it. They drive
   * the grid with `fireEvent`: user-event waits on Testing Library's async wrapper, which drains
   * with a `setTimeout` that plain fake timers never fire.
   */
  function openStrip(filtersButtonName = 'Filters') {
    fireEvent.click(screen.getByRole('button', { name: filtersButtonName }));
  }

  /** A click on a button: focus moves to it first, as a press of the pointer moves it. */
  function clickButton(name: string) {
    const button = screen.getByRole('button', { name });
    act(() => button.focus());
    fireEvent.click(button);
  }

  function stripRow(): HTMLElement {
    const strip = document.querySelector<HTMLElement>('thead tr[aria-rowindex="2"]');
    if (strip === null) throw new Error('the filter strip is not rendered');
    return strip;
  }

  function filterField(columnName: string): HTMLElement {
    return screen.getByRole('searchbox', { name: `Filter by ${columnName}` });
  }

  function bodyRows(): HTMLElement[] {
    return screen.getAllByRole('row').filter((row) => row.closest('tbody') !== null);
  }

  /** An app holding the query itself, as the grid reports it. */
  function ControlledGrid({ onQueryChange }: { onQueryChange: (query: DataGridQuery) => void }) {
    const [query, setQuery] = useState<DataGridQuery>(emptyDataGridQuery);
    return (
      <DataGrid<InventoryRow>
        gridId="controlled-strip-grid"
        heading="Inventory"
        rows={makeInventoryRows(rowTotal)}
        columns={filterableInventoryColumns}
        getRowId={(row) => row.id}
        query={query}
        onQueryChange={(nextQuery) => {
          onQueryChange(nextQuery);
          setQuery(nextQuery);
        }}
      />
    );
  }

  it('opens the strip with a labelled filter for each filterable column', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid({
      selectionMode: 'multiple',
      renderExpandedRow: (row) => <p>{row.name}</p>,
      renderRowActions: (row) => <button type="button">Edit {row.name}</button>,
    });
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-rowcount', String(rowTotal + 1));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    const stripCells = within(stripRow()).getAllByRole('gridcell');
    // The checkbox and expand columns, the seven columns, then the row actions column.
    expect(stripCells.map((cell) => cell.getAttribute('aria-colindex'))).toEqual(
      Array.from({ length: 10 }, (_unused, index) => String(index + 1)),
    );
    // Name, Category, Location and Status are the second, third, fourth and sixth columns, after
    // the checkbox and expand ones.
    expect(stripCells[3]).toContainElement(filterField('Name'));
    expect(stripCells[4]).toContainElement(
      screen.getByRole('combobox', { name: 'Filter by Category' }),
    );
    expect(stripCells[5]).toContainElement(filterField('Location'));
    expect(stripCells[7]).toContainElement(
      screen.getByRole('combobox', { name: 'Filter by Status' }),
    );
    expect(screen.getAllByRole('searchbox')).toHaveLength(2);
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    for (const [index, cell] of stripCells.entries()) {
      if (![3, 4, 5, 7].includes(index)) expect(cell).toBeEmptyDOMElement();
    }
    expect(grid).toHaveAttribute('aria-rowcount', String(rowTotal + 2));
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '3');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('lets each filter take its width from its column', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    // A browser gives an input 20 characters of width by default, which widened the filtered
    // columns and squeezed the others when the strip opened; one character leaves the width to the
    // cell, whose control fills it.
    const controls = [
      ...within(stripRow()).getAllByRole('searchbox'),
      ...within(stripRow()).getAllByRole('combobox'),
    ];
    expect(controls).toHaveLength(4);
    for (const control of controls) expect(control).toHaveAttribute('size', '1');
  });

  it('filters 300ms after typing stops, at once on Enter', () => {
    vi.useFakeTimers();
    renderGrid();
    openStrip();
    const nameFilter = filterField('Name');
    act(() => nameFilter.focus());

    // Each change starts the wait again.
    fireEvent.change(nameFilter, { target: { value: '(' } });
    act(() => vi.advanceTimersByTime(textFilterDelay - 1));
    fireEvent.change(nameFilter, { target: { value: '(2)' } });
    act(() => vi.advanceTimersByTime(textFilterDelay - 1));
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    const secondCycleIds = idsOfRowsWhere((row) => row.name.includes('(2)'));
    expect(screen.getByText(`${secondCycleIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(cellTextsOf('Name').every((name) => name.includes('(2)'))).toBe(true);

    const locationFilter = filterField('Location');
    act(() => locationFilter.focus());
    fireEvent.change(locationFilter, { target: { value: 'B-07' } });
    fireEvent.keyDown(locationFilter, { key: 'Enter' });

    const bothIds = idsOfRowsWhere((row) => row.name.includes('(2)') && row.location === 'B-07');
    expect(bothIds.length).toBeLessThan(secondCycleIds.length);
    expect(screen.getByText(`${bothIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters, 2 active' })).toBeInTheDocument();
  });

  it('keeps filtering while the strip is closed', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.type(filterField('Name'), 'Washer{Enter}');
    const washerCount = idsOfRowsWhere((row) => row.name.startsWith('Washer')).length;
    expect(screen.getByText(`${washerCount} of ${rowTotal} rows`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters, 1 active' }));

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText(`${washerCount} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(cellTextsOf('Name').every((name) => name.startsWith('Washer'))).toBe(true);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', String(washerCount + 1));
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '2');

    await user.click(screen.getByRole('button', { name: 'Filters, 1 active' }));

    expect(filterField('Name')).toHaveValue('Washer');
  });

  it('removes a text filter when its field is cleared', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderGrid({ onQueryChange });
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.type(filterField('Name'), 'Washer{Enter}');
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { name: 'Washer' } }),
    );
    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument();

    await user.clear(filterField('Name'));
    await user.keyboard('{Enter}');

    expect(onQueryChange).toHaveBeenCalledTimes(2);
    const lastQuery = onQueryChange.mock.lastCall?.[0] as DataGridQuery;
    expect(lastQuery.filters).not.toHaveProperty('name');
    expect(lastQuery.filters).toEqual({});
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
  });

  it('drops a pending filter when the query is cleared', () => {
    vi.useFakeTimers();
    renderGrid({ initialQuery: { filters: { name: 'Nothing like this' } } });
    openStrip('Filters, 1 active');
    const nameFilter = filterField('Name');
    expect(nameFilter).toHaveValue('Nothing like this');

    act(() => nameFilter.focus());
    fireEvent.change(nameFilter, { target: { value: 'Nothing like this at all' } });
    act(() => vi.advanceTimersByTime(textFilterDelay / 3));
    clickButton('Clear filters');
    act(() => vi.advanceTimersByTime(400));

    expect(nameFilter).toHaveValue('');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });

  it("drops a pending filter when Clear filters clears another column's filter", () => {
    vi.useFakeTimers();
    // No row is at this location, so the grid is empty before anything is typed in Name, and the
    // Name filter's committed value is empty before and after Clear filters.
    renderGrid({ initialQuery: { filters: { location: 'Nowhere' } } });
    openStrip('Filters, 1 active');
    const nameFilter = filterField('Name');

    act(() => nameFilter.focus());
    fireEvent.change(nameFilter, { target: { value: 'Hex' } });
    act(() => vi.advanceTimersByTime(textFilterDelay / 3));
    clickButton('Clear filters');
    act(() => vi.advanceTimersByTime(400));

    expect(nameFilter).toHaveValue('');
    expect(filterField('Location')).toHaveValue('');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });

  it('applies every pending filter when the strip closes', async () => {
    const user = userEvent.setup();
    renderGrid();
    const filtersButton = screen.getByRole('button', { name: 'Filters' });
    await user.click(filtersButton);
    // Two drafts at once: typed without focus moving off the filters button.
    fireEvent.change(filterField('Name'), { target: { value: '(2)' } });
    fireEvent.change(filterField('Location'), { target: { value: 'B-07' } });
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();

    await user.click(filtersButton);

    const bothIds = idsOfRowsWhere((row) => row.name.includes('(2)') && row.location === 'B-07');
    expect(screen.getByText(`${bothIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters, 2 active' })).toBeInTheDocument();
  });

  it('reports every pending filter of a controlled query when the strip closes', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<ControlledGrid onQueryChange={onQueryChange} />);
    const filtersButton = screen.getByRole('button', { name: 'Filters' });
    await user.click(filtersButton);
    fireEvent.change(filterField('Name'), { target: { value: '(2)' } });
    fireEvent.change(filterField('Location'), { target: { value: 'B-07' } });

    await user.click(filtersButton);

    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { name: '(2)', location: 'B-07' } }),
    );
    const bothIds = idsOfRowsWhere((row) => row.name.includes('(2)') && row.location === 'B-07');
    expect(screen.getByText(`${bothIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
  });

  it('selects only matching rows after filtering', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({ selectionMode: 'multiple', onSelectedRowIdsChange });
    // item-1 is a hex bolt and stays in view; item-2 is a washer and leaves it.
    await user.click(screen.getByRole('checkbox', { name: 'Select SKU-1000' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select SKU-1001' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.type(filterField('Name'), 'Hex{Enter}');

    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select SKU-1000' })).not.toBeChecked();
    onSelectedRowIdsChange.mockClear();

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    const hexBoltIds = idsOfRowsWhere((row) => row.name.startsWith('Hex'));
    expect(onSelectedRowIdsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(hexBoltIds);
    expect(screen.getByText(`${hexBoltIds.length} selected`)).toBeInTheDocument();
  });

  it('counts the strip in the places of the state row and the error row', async () => {
    const user = userEvent.setup();
    const { unmount } = renderGrid({ initialQuery: { filters: { location: 'Nowhere' } } });
    await user.click(screen.getByRole('button', { name: 'Filters, 1 active' }));

    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '3');
    const stateMessage = within(screen.getByRole('grid')).getByText(
      'No rows match the search or filters.',
    );
    expect(stateMessage.closest('tr')).toHaveAttribute('aria-rowindex', '3');
    unmount();

    const loadedRows = 10;
    renderGrid({
      mode: 'server',
      rows: makeInventoryRows(loadedRows),
      totalRowCount: rowTotal,
      onQueryChange: vi.fn(),
      loadError: 'Could not load rows',
    });
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    const errorCell = screen.getByText('Could not load rows').closest('td') as HTMLElement;
    // The header, the strip and the loaded rows come before it.
    expect(errorCell.closest('tr')).toHaveAttribute('aria-rowindex', String(loadedRows + 3));
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', String(rowTotal + 2));
    await user.tab();
    await user.keyboard('{Control>}{End}{/Control}');
    expect(errorCell).toHaveFocus();
  });

  it('takes its filter names from labels', async () => {
    const user = userEvent.setup();
    renderGrid({ labels: { filterBy: (columnName) => `Filtrar por ${columnName}` } });
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('searchbox', { name: 'Filtrar por Name' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filtrar por Location' })).toBeInTheDocument();
  });
});

describe('the choice filters', () => {
  type User = ReturnType<typeof userEvent.setup>;

  async function openStrip(user: User, filtersButtonName = 'Filters') {
    await user.click(screen.getByRole('button', { name: filtersButtonName }));
  }

  function choiceFilter(columnName: string): HTMLElement {
    return screen.getByRole('combobox', { name: `Filter by ${columnName}` });
  }

  function optionNames(): string[] {
    return screen.queryAllByRole('option').map((option) => option.textContent ?? '');
  }

  function highlightedOptionName(): string | undefined {
    return screen.queryAllByRole('option').find((option) => option.hasAttribute('data-highlighted'))
      ?.textContent;
  }

  function lastFilters(onQueryChange: ReturnType<typeof vi.fn>): DataGridQuery['filters'] {
    return (onQueryChange.mock.lastCall?.[0] as DataGridQuery).filters;
  }

  it('filters by one status from a select filter', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderGrid({ onQueryChange });
    await openStrip(user);
    const statusFilter = choiceFilter('Status');
    expect(statusFilter).toHaveValue('All');

    await user.click(statusFilter);
    // "All" shows as chosen while nothing else is.
    expect(await screen.findByRole('option', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(optionNames()).toEqual(['All', 'In stock', 'Low', 'Out']);
    await user.click(screen.getByRole('option', { name: 'Low' }));

    const lowIds = idsOfRowsWhere((row) => row.status === 'low');
    expect(screen.getByText(`${lowIds.length} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(cellTextsOf('Status').every((status) => status === 'low')).toBe(true);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith(
      expect.objectContaining({ filters: { status: 'low' } }),
    );
    expect(statusFilter).toHaveValue('Low');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());

    await user.click(statusFilter);
    expect(await screen.findByRole('option', { name: 'Low' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-selected', 'false');
    await user.click(screen.getByRole('option', { name: 'All' }));

    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(lastFilters(onQueryChange)).toEqual({});
    expect(statusFilter).toHaveValue('All');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
  });

  it('filters by several categories', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderGrid({ onQueryChange });
    await openStrip(user);
    const categoryFilter = choiceFilter('Category');
    expect(categoryFilter).toHaveAttribute('placeholder', 'All');
    expect(categoryFilter).toHaveAccessibleDescription('All');

    await user.click(categoryFilter);
    await user.click(await screen.findByRole('option', { name: 'Tools' }));

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(lastFilters(onQueryChange)).toEqual({ category: ['Tools'] });
    expect(categoryFilter).toHaveAttribute('placeholder', 'Tools');
    expect(categoryFilter).toHaveAccessibleDescription('Tools');

    // The list stays open while options toggle.
    await user.click(screen.getByRole('option', { name: 'Safety' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(onQueryChange).toHaveBeenCalledTimes(2);
    const categories = lastFilters(onQueryChange).category;
    expect(categories).toHaveLength(2);
    expect(categories).toEqual(expect.arrayContaining(['Tools', 'Safety']));
    expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-selected', 'false');

    // An open list hides the rest of the page from assistive technology, so the rows are read
    // with it closed.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(new Set(cellTextsOf('Category'))).toEqual(new Set(['Tools', 'Safety']));
    const shownCount = idsOfRowsWhere((row) => ['Tools', 'Safety'].includes(row.category)).length;
    expect(screen.getByText(`${shownCount} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(categoryFilter).toHaveValue('');
    expect(categoryFilter).toHaveAttribute('placeholder', '2 selected');
    expect(categoryFilter).toHaveAccessibleDescription('2 selected');

    // Choosing "All" clears the filter and leaves the list open.
    await user.click(categoryFilter);
    await user.click(await screen.findByRole('option', { name: 'All' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(onQueryChange).toHaveBeenCalledTimes(3);
    expect(lastFilters(onQueryChange)).toEqual({});
    expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Tools' })).toHaveAttribute('aria-selected', 'false');
    expect(categoryFilter).toHaveAttribute('placeholder', 'All');
    expect(screen.getByText(`${rowTotal} rows`)).toBeInTheDocument();
  });

  it('narrows the options as the user types', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderGrid({ initialQuery: { filters: { status: 'low' } }, onQueryChange });
    await openStrip(user, 'Filters, 1 active');
    const categoryFilter = choiceFilter('Category');

    // Case does not matter, and "All" is no option to match while a query is typed.
    await user.type(categoryFilter, 'PA');
    expect(optionNames()).toEqual(['Packaging']);

    await user.clear(categoryFilter);
    expect(optionNames()).toEqual(['All', 'Fasteners', 'Packaging', 'Safety', 'Tools']);

    // Choosing from a narrowed list keeps it open, narrowed.
    await user.type(categoryFilter, 'to');
    await user.click(screen.getByRole('option', { name: 'Tools' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(optionNames()).toEqual(['Tools']);
    expect(lastFilters(onQueryChange)).toEqual({ status: 'low', category: ['Tools'] });

    // What is typed over a select's text narrows its list too. Neither typing nor emptying the
    // text is a choice: the filter stays until an item is chosen, and the text comes back as the
    // list closes.
    await user.keyboard('{Escape}');
    const statusFilter = choiceFilter('Status');
    await user.type(statusFilter, 'ow');
    expect(optionNames()).toEqual(['Low']);
    await user.clear(statusFilter);
    expect(optionNames()).toEqual(['All', 'In stock', 'Low', 'Out']);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(statusFilter).toHaveValue('Low');
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it("replaces a select's text with what is typed, entered by a click or from its cell", async () => {
    const user = userEvent.setup();
    renderGrid();
    await openStrip(user);
    const statusFilter = choiceFilter('Status');
    const statusCell = statusFilter.closest('td') as HTMLElement;

    // A click focuses the input with its text selected, so typing replaces "All".
    await user.type(statusFilter, 'lo');

    expect(statusFilter).toHaveValue('lo');
    expect(optionNames()).toEqual(['Low']);
    expect(screen.queryByText('No matching options')).not.toBeInTheDocument();

    // Closing the list puts the choice back; a second Escape leaves the cell.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(statusFilter).toHaveValue('All');
    await user.keyboard('{Escape}');
    expect(statusCell).toHaveFocus();

    // Entering the cell from the keyboard selects the text too.
    await user.keyboard('{Enter}');
    expect(statusFilter).toHaveFocus();
    await user.keyboard('lo');

    expect(statusFilter).toHaveValue('lo');
    expect(optionNames()).toEqual(['Low']);
    expect(screen.queryByText('No matching options')).not.toBeInTheDocument();
  });

  it("selects a select's text again once a pointer's press has placed its caret", async () => {
    const user = userEvent.setup();
    renderGrid();
    await openStrip(user);
    const statusFilter = choiceFilter('Status') as HTMLInputElement;

    // A browser focuses the input as the press begins, then puts the caret where it landed.
    fireEvent.pointerDown(statusFilter);
    act(() => statusFilter.focus());
    statusFilter.setSelectionRange(1, 1);
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    expect(statusFilter.selectionStart).toBe(0);
    expect(statusFilter.selectionEnd).toBe('All'.length);
  });

  interface OpeningKeystrokeCase {
    columnName: string;
    /** The column's place in the grid, counted from 0. */
    columnIndex: number;
    filters: DataGridQuery['filters'];
    typed: string;
    shownOptions: string[];
  }

  const statusCase = { columnName: 'Status', columnIndex: 5, typed: 'l', shownOptions: ['Low'] };
  const categoryCase = {
    columnName: 'Category',
    columnIndex: 2,
    typed: 'p',
    shownOptions: ['Packaging'],
  };

  it.each<[string, OpeningKeystrokeCase]>([
    ['a select whose value no option offers', { ...statusCase, filters: { status: 'gone' } }],
    [
      'a multi-select whose value no option offers',
      { ...categoryCase, filters: { category: ['Gone'] } },
    ],
    ['a multi-select with nothing chosen', { ...categoryCase, filters: {} }],
  ])(
    'keeps the keystroke that opens the list of %s',
    async (_case, { columnName, columnIndex, filters, typed, shownOptions }) => {
      const user = userEvent.setup();
      renderGrid({ initialQuery: { filters } });
      await user.click(screen.getByRole('button', { name: /^Filters/ }));
      // Into the strip from the header, along to the column, and into its cell: no click, so the
      // list is closed until the key below opens it.
      await user.tab();
      await user.keyboard(`{ArrowDown}{ArrowRight>${columnIndex}/}{Enter}`);
      const filter = choiceFilter(columnName);
      expect(filter).toHaveFocus();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      await user.keyboard(typed);

      expect(filter).toHaveValue(typed);
      expect(await screen.findByRole('listbox')).toBeInTheDocument();
      expect(optionNames()).toEqual(shownOptions);
    },
  );

  it('says when no option matches', async () => {
    const user = userEvent.setup();
    renderGrid();
    await openStrip(user);
    const categoryFilter = choiceFilter('Category');

    await user.type(categoryFilter, 'zzz');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    // The message is a polite status, so it is heard as the list empties.
    expect(screen.getByText('No matching options')).toHaveAttribute('role', 'status');

    await user.clear(categoryFilter);

    expect(screen.queryByText('No matching options')).not.toBeInTheDocument();
    expect(optionNames()).toHaveLength(5);
  });

  it('closes the list on Escape before leaving the cell', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderGrid({
      initialQuery: { filters: { status: 'low', category: ['Tools'] } },
      onQueryChange,
    });
    await openStrip(user, 'Filters, 2 active');

    for (const [columnName, shown] of [
      ['Status', { value: 'Low' }],
      ['Category', { placeholder: 'Tools' }],
    ] as const) {
      const filter = choiceFilter(columnName);
      const cell = filter.closest('td') as HTMLElement;
      await user.click(filter);
      expect(await screen.findByRole('listbox')).toBeInTheDocument();
      expect(filter).toHaveFocus();

      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      expect(filter).toHaveFocus();
      expect(filter).toHaveAttribute('aria-expanded', 'false');
      expect(cell).toHaveAttribute('data-focused');

      await user.keyboard('{Escape}');

      expect(cell).toHaveFocus();
      // Leaving the cell keeps the filter.
      if ('value' in shown) expect(filter).toHaveValue(shown.value);
      else expect(filter).toHaveAttribute('placeholder', shown.placeholder);
    }
    expect(onQueryChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Filters, 2 active' })).toBeInTheDocument();
  });

  it('keeps the arrow keys inside an open list', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderGrid({ onQueryChange });
    await openStrip(user);
    await user.tab();
    // Down to the strip, then along to the Status column, the sixth.
    await user.keyboard('{ArrowDown}{ArrowRight>5/}');
    const statusFilter = choiceFilter('Status');
    const statusCell = statusFilter.closest('td') as HTMLElement;
    expect(statusCell).toHaveFocus();
    expect(statusFilter).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{Enter}');
    expect(statusFilter).toHaveFocus();
    expect(statusFilter).toHaveAttribute('tabindex', '0');

    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await waitFor(() => expect(highlightedOptionName()).toBe('All'));

    await user.keyboard('{ArrowDown}{ArrowDown}');

    expect(highlightedOptionName()).toBe('Low');
    expect(statusFilter).toHaveFocus();
    expect(statusCell).toHaveAttribute('data-focused');

    await user.keyboard('{ArrowUp}{Enter}');

    expect(lastFilters(onQueryChange)).toEqual({ status: 'in stock' });
    expect(statusFilter).toHaveValue('In stock');
    expect(statusFilter).toHaveFocus();
    expect(statusCell).toHaveAttribute('data-focused');
  });

  it('adds no tab stop of its own while the list is open', async () => {
    const user = userEvent.setup();
    renderGrid();
    await openStrip(user);
    const statusFilter = choiceFilter('Status');
    const statusCell = statusFilter.closest('td') as HTMLElement;

    await user.click(statusFilter);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    // Base UI's dismiss control for screen readers sits beside the input, and only their cursor
    // reaches it; the grid must not make it a stop.
    await user.tab({ shift: true });

    expect(statusCell).not.toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
  });

  it('never submits a form the grid sits in on Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <DataGrid<InventoryRow>
          gridId="form-grid"
          heading="Inventory"
          rows={makeInventoryRows(rowTotal)}
          columns={filterableInventoryColumns}
          getRowId={(row) => row.id}
        />
        <button type="submit">Save</button>
      </form>,
    );
    await openStrip(user);

    await user.type(screen.getByRole('searchbox', { name: 'Filter by Name' }), 'Washer{Enter}');

    const washerCount = idsOfRowsWhere((row) => row.name.startsWith('Washer')).length;
    expect(screen.getByText(`${washerCount} of ${rowTotal} rows`)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    // Enter picks the highlighted option of a select, then of a multi-select. Opening a list
    // highlights its choice, "All" here.
    await user.click(choiceFilter('Status'));
    await waitFor(() => expect(highlightedOptionName()).toBe('All'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(choiceFilter('Status')).toHaveValue('In stock');
    await user.click(choiceFilter('Category'));
    await waitFor(() => expect(highlightedOptionName()).toBe('All'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(choiceFilter('Category')).toHaveAttribute('placeholder', 'Fasteners');
    expect(onSubmit).not.toHaveBeenCalled();

    // And with the list closed, Enter does nothing at all.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters, 3 active' })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no axe violations with the list open', async () => {
    const user = userEvent.setup();
    renderGrid({ initialQuery: { filters: { category: ['Tools', 'Safety'] } } });
    await openStrip(user, 'Filters, 1 active');

    await user.click(choiceFilter('Category'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(await axeDocument()).toHaveNoViolations();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await user.click(choiceFilter('Status'));
    expect(await screen.findByRole('option', { name: 'Low' })).toBeInTheDocument();
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('takes its words from labels', async () => {
    const user = userEvent.setup();
    renderGrid({
      initialQuery: { filters: { category: ['Tools', 'Safety'] } },
      labels: {
        filterBy: (columnName) => `Filtrar por ${columnName}`,
        filterAll: 'Todas',
        filterSelectedCount: (count) => `${count} elegidas`,
        filterNoOptions: 'Ninguna opción coincide',
      },
    });
    await openStrip(user, 'Filters, 1 active');

    const statusFilter = screen.getByRole('combobox', { name: 'Filtrar por Status' });
    expect(statusFilter).toHaveValue('Todas');
    const categoryFilter = screen.getByRole('combobox', { name: 'Filtrar por Category' });
    expect(categoryFilter).toHaveAttribute('placeholder', '2 elegidas');
    expect(categoryFilter).toHaveAccessibleDescription('2 elegidas');

    await user.type(categoryFilter, 'zzz');
    expect(screen.getByText('Ninguna opción coincide')).toBeInTheDocument();
    await user.clear(categoryFilter);
    expect(screen.getByRole('option', { name: 'Todas' })).toBeInTheDocument();
  });
});
