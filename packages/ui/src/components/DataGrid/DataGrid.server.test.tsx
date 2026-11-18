import { composeStories } from '@storybook/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import { emulateScrollTo, scrollArea, scrollGridTo } from '../../../test/gridScroll';
import { DataGrid } from './DataGrid';
import * as stories from './DataGrid.stories';
import type * as FixturesModule from './fixtures';
import {
  createMockInventoryServer,
  filterableInventoryColumns,
  inventoryColumns,
  makeInventoryRows,
  type InventoryPage,
  type InventoryRow,
} from './fixtures';
import { createQueryMatcher, emptyDataGridQuery } from './query';
import type { DataGridQuery } from './types';

// Every request made of a mock inventory server, the stories' included, so a test can see what
// the story app asked for.
const fetchPageRequests = vi.hoisted(() => vi.fn());

vi.mock('./fixtures', async (importOriginal) => {
  const fixtures = await importOriginal<typeof FixturesModule>();
  return {
    ...fixtures,
    createMockInventoryServer: (options: FixturesModule.MockInventoryServerOptions) => {
      const server = fixtures.createMockInventoryServer(options);
      return {
        ...server,
        fetchPage: (request: Parameters<typeof server.fetchPage>[0]) => {
          fetchPageRequests(request);
          return server.fetchPage(request);
        },
      };
    },
  };
});

const { ServerMode, ServerFindingRows } = composeStories(stories);

type GridProps = React.ComponentProps<typeof DataGrid<InventoryRow>>;

function gridElement(overrides: Partial<GridProps> = {}) {
  return (
    <DataGrid<InventoryRow>
      gridId="server-grid"
      heading="Inventory"
      rows={makeInventoryRows(50)}
      columns={inventoryColumns}
      getRowId={(row) => row.id}
      mode="server"
      hasMore
      {...overrides}
    />
  );
}

function renderGrid(overrides: Partial<GridProps> = {}) {
  return render(gridElement(overrides));
}

function ariaRowIndexes(): string[] {
  return screen
    .getAllByRole('row')
    .map((row) => row.getAttribute('aria-rowindex'))
    .filter((rowIndex): rowIndex is string => rowIndex !== null);
}

/** The text of one column's cell in each rendered body row, top to bottom. */
function textOfEachRow(columnName: string): (string | null)[] {
  const columnIndex = screen
    .getAllByRole('columnheader')
    .findIndex((header) => header.textContent === columnName);
  return screen
    .getAllByRole('row')
    .filter((row) => row.closest('tbody') !== null)
    .map((row) => within(row).queryAllByRole('gridcell')[columnIndex]?.textContent ?? null);
}

function nameOfEachRow(): (string | null)[] {
  return textOfEachRow('Name');
}

/** How many of the server's 240 inventory rows the test accepts. */
function countOfServerRowsWhere(test: (row: InventoryRow) => boolean): number {
  return makeInventoryRows(240).filter(test).length;
}

// The ServerMode story's walk, with its axe check, takes about a second alone, the slowest of the
// grid's axe tests, and this file has timed out on a loaded machine; it gets more room. Nothing
// else changes.
const axeUnderLoad = { timeout: 15_000 };

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
  fetchPageRequests.mockClear();
});

afterEach(() => {
  restoreElementSize();
});

describe('server mode', () => {
  it('does not sort rows itself in server mode', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const rows = makeInventoryRows(10).reverse();
    renderGrid({ rows, onQueryChange, hasMore: false });
    expect(onQueryChange).not.toHaveBeenCalled();
    const givenOrder = nameOfEachRow();

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));

    expect(nameOfEachRow()).toEqual(givenOrder);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith({
      sorting: [{ id: 'name', desc: false }],
      filters: {},
      matchMode: 'all',
      search: '',
    });
  });

  it('does not sort in server mode without onQueryChange', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    renderGrid({ onLoadMore, initialSorting: [{ id: 'sku', desc: false }] });
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    const skuHeader = screen.getByRole('columnheader', { name: 'SKU' });
    expect(skuHeader).not.toHaveAttribute('aria-sort');

    await user.click(nameHeader);
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    nameHeader.focus();
    await user.keyboard('{Enter}');
    expect(nameHeader).not.toHaveAttribute('aria-sort');

    // Nothing waits on a query the app never heard of: the grid still asks for more.
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('asks for more rows near the end', () => {
    const onLoadMore = vi.fn();
    const { rerender } = renderGrid({ onLoadMore });
    expect(onLoadMore).not.toHaveBeenCalled();

    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    // More rows arrived, and the user is at the new end, but a load is under way: only that holds
    // the grid back.
    rerender(gridElement({ onLoadMore, loadingMore: true, rows: makeInventoryRows(100) }));
    scrollGridTo(40 * 100);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(gridElement({ onLoadMore, loadingMore: false, rows: makeInventoryRows(100) }));
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('does not ask while loadingMore is set', () => {
    const onLoadMore = vi.fn();
    renderGrid({ onLoadMore, loadingMore: true });
    scrollGridTo(40 * 50);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not ask without more rows', () => {
    const onLoadMore = vi.fn();
    renderGrid({ onLoadMore, hasMore: false });
    scrollGridTo(40 * 50);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('asks again when the loaded rows do not fill the viewport', () => {
    const onLoadMore = vi.fn();
    renderGrid({ rows: makeInventoryRows(5), onLoadMore });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('a load that adds nothing does not loop', () => {
    const onLoadMore = vi.fn();
    const rows = makeInventoryRows(50);
    const { rerender } = renderGrid({ rows, onLoadMore });
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(gridElement({ rows, onLoadMore, loadingMore: true }));
    rerender(gridElement({ rows, onLoadMore, loadingMore: false }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    // Fifty more rows arrive, so the grid may ask again once the user is near the new end.
    rerender(gridElement({ rows: makeInventoryRows(100), onLoadMore }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    scrollGridTo(40 * 100);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('shows a load error with retry and pauses loading', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const { container } = renderGrid({ onLoadMore, loadError: 'Could not load rows' });
    scrollGridTo(40 * 50);
    expect(onLoadMore).not.toHaveBeenCalled();

    expect(screen.getByText('Could not load rows')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  // The error cell spans the table, which can be wider than the scroll area (a phone), so the
  // message and its retry button keep to the scroll area's width, where they can be seen.
  it('keeps the error row to the width of the scroll area', () => {
    renderGrid({ rows: [], hasMore: true, loadError: 'Could not load rows' });

    const errorBox = screen.getByText('Could not load rows').closest('td')
      ?.firstElementChild as HTMLElement;
    // The scroll area is 800px wide in the stubbed layout. The grid sets the width on the scroll
    // area, and the stylesheet makes it the content's maximum (pinned in token-reads). A maximum,
    // not a width: a width would count toward the table's minimum and keep the grid from shrinking
    // in a flex item or a grid track once it had been measured wide.
    expect(scrollArea()).toContainElement(errorBox);
    expect(errorBox).toHaveClass('inView');
    expect(scrollArea().style.getPropertyValue('--data-grid-view-inline-size')).toBe('800px');
    expect(errorBox.style.inlineSize).toBe('');
    expect(errorBox).toContainElement(screen.getByRole('button', { name: 'Try again' }));
  });

  it('numbers the error row within the rows of the grid', () => {
    const { rerender } = renderGrid({ loadError: 'Could not load rows' });
    // Header, 50 rows, then the error row; the total is not known, so the count is ARIA's -1.
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '-1');
    expect(screen.getByText('Could not load rows').closest('tr')).toHaveAttribute(
      'aria-rowindex',
      '52',
    );

    rerender(gridElement({ loadError: 'Could not load rows', totalRowCount: 1240 }));
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '1241');
  });

  it('shows only the error row when the first page failed', () => {
    renderGrid({ rows: [], hasMore: true, loadError: 'Could not load rows' });
    expect(screen.getByText('Could not load rows')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('No rows to show.')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '-1');
    expect(screen.getByText('Could not load rows').closest('tr')).toHaveAttribute(
      'aria-rowindex',
      '2',
    );
  });

  describe('error row keyboard', () => {
    function gridBetweenButtons(overrides: Partial<GridProps> = {}) {
      return (
        <>
          <button type="button">Before</button>
          {gridElement({ rows: makeInventoryRows(10), hasMore: false, ...overrides })}
          <button type="button">After</button>
        </>
      );
    }

    it('keeps the grid one tab stop, and reaches the retry button with the keys', async () => {
      const user = userEvent.setup();
      const onLoadMore = vi.fn();
      render(gridBetweenButtons({ loadError: 'Could not load rows', onLoadMore }));
      screen.getByRole('button', { name: 'Before' }).focus();
      await user.tab();
      expect(screen.getByRole('columnheader', { name: 'SKU' })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole('columnheader', { name: 'SKU' })).toHaveFocus();

      // The error row's cell is the last one, reached like any other.
      await user.keyboard('{Control>}{End}{/Control}');
      const errorCell = screen.getByText('Could not load rows').closest('td');
      expect(errorCell).toHaveFocus();
      const retryButton = screen.getByRole('button', { name: 'Try again' });
      expect(retryButton).toHaveAttribute('tabindex', '-1');

      await user.keyboard('{Enter}');
      expect(retryButton).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(onLoadMore).toHaveBeenCalledTimes(1);
      await user.keyboard('{Escape}');
      expect(errorCell).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(errorCell).not.toHaveFocus();
      expect(document.activeElement?.closest('tr')).toHaveAttribute('aria-rowindex', '11');
    });

    it('leaves the grid in one Tab from inside the retry button', async () => {
      const user = userEvent.setup();
      render(gridBetweenButtons({ loadError: 'Could not load rows' }));
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });
  });

  it('a retry that adds nothing does not loop either', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const rows = makeInventoryRows(50);
    const { rerender } = renderGrid({ rows, onLoadMore, loadError: 'Could not load rows' });
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    rerender(gridElement({ rows, onLoadMore }));
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('asks again at the same count after a failed load is cleared', () => {
    const onLoadMore = vi.fn();
    const rows = makeInventoryRows(50);
    const { rerender } = renderGrid({ rows, onLoadMore });
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    // The load fails, and the app clears the error with as many rows as before, as a refresh does.
    rerender(gridElement({ rows, onLoadMore, loadingMore: true }));
    rerender(gridElement({ rows, onLoadMore, loadError: 'Could not load rows' }));
    rerender(gridElement({ rows: makeInventoryRows(50), onLoadMore }));
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('asks again at the same count after a reload', () => {
    const onLoadMore = vi.fn();
    const { rerender } = renderGrid({ onLoadMore });
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    // The app reloads from the first page before the answer came, to as many rows as before.
    rerender(gridElement({ onLoadMore, loading: true }));
    rerender(gridElement({ onLoadMore }));
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('a query change scrolls to the top and clears the selection', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({
      selectionMode: 'multiple',
      defaultSelectedRowIds: ['item-1', 'item-2'],
      onSelectedRowIdsChange,
      onQueryChange: vi.fn(),
    });
    emulateScrollTo();
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    scrollGridTo(40 * 30);
    expect(ariaRowIndexes()).not.toContain('2');

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));

    expect(scrollArea().scrollTop).toBe(0);
    expect(ariaRowIndexes()).toContain('2');
    expect(screen.queryByText('2 selected')).not.toBeInTheDocument();
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith([]);
  });

  it('loads more after a query replaces the rows with as many', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    const rows = makeInventoryRows(50);
    const { rerender } = renderGrid({ rows, onLoadMore, onQueryChange });
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(gridElement({ rows: makeInventoryRows(100), onLoadMore, onQueryChange }));

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    // The old rows stay until the app replaces them, and nothing is asked of them meanwhile.
    scrollGridTo(40 * 100);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(gridElement({ rows: makeInventoryRows(50).reverse(), onLoadMore, onQueryChange }));
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('the footer shows loaded of total', () => {
    const { rerender } = renderGrid({ totalRowCount: 1240 });
    expect(screen.getByText('Showing 50 of 1,240 rows')).toBeInTheDocument();
    expect(screen.queryByText('Loading more rows…')).not.toBeInTheDocument();

    rerender(gridElement({ totalRowCount: 1240, loadingMore: true }));
    expect(screen.getByText('Showing 50 of 1,240 rows')).toBeInTheDocument();
    expect(screen.getByText('Loading more rows…')).toBeInTheDocument();
  });

  it('the footer counts the loaded rows when the total is not known', () => {
    renderGrid();
    expect(screen.getByText('50 rows')).toBeInTheDocument();
  });

  it('aria-rowcount uses the total', () => {
    renderGrid({ totalRowCount: 1240 });
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '1241');
  });

  it('aria-rowcount is -1, the unknown total, while there is more and no total is known', () => {
    const { rerender } = renderGrid();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '-1');

    // Everything is loaded: the count is known again, whether or not a total came with it.
    rerender(gridElement({ hasMore: false }));
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '51');

    // A load error does not make the total known.
    rerender(gridElement({ loadError: 'Could not load rows' }));
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '-1');
  });

  it('aria-rowcount adds the open panels to the total', () => {
    renderGrid({
      totalRowCount: 1240,
      renderExpandedRow: (row) => <p>Details of {row.name}</p>,
      defaultExpandedRowIds: ['item-2'],
    });
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '1242');
  });

  it('keeps announcing an empty grid', () => {
    renderGrid({ rows: [], hasMore: false });
    expect(screen.getByRole('status')).toHaveTextContent('No rows to show.');
  });

  it('ignores initialQuery filters and search without onQueryChange', () => {
    const initialQuery: Partial<DataGridQuery> = { filters: { status: 'out' }, search: 'bolt' };
    const { unmount } = renderGrid({
      columns: filterableInventoryColumns,
      rows: [],
      hasMore: false,
      initialQuery,
    });
    expect(screen.getByRole('status')).toHaveTextContent('No rows to show.');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    unmount();

    // With the handler the app filters by the same query, and its answer is empty.
    renderGrid({
      columns: filterableInventoryColumns,
      rows: [],
      hasMore: false,
      initialQuery,
      onQueryChange: vi.fn(),
    });
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});

describe('a controlled query in server mode', () => {
  const searchedQuery: DataGridQuery = { ...emptyDataGridQuery, search: 'bolt' };

  it('loads more when the app brings a new query and its rows together', () => {
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    const { rerender } = renderGrid({ query: emptyDataGridQuery, onQueryChange, onLoadMore });

    // A cache keyed by the query already holds the new query's first page.
    rerender(
      gridElement({
        query: searchedQuery,
        rows: makeInventoryRows(50).reverse(),
        onQueryChange,
        onLoadMore,
      }),
    );
    scrollGridTo(40 * 50);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('waits for new rows when the app changes only the query', () => {
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    const rows = makeInventoryRows(50);
    const { rerender } = renderGrid({ rows, query: emptyDataGridQuery, onQueryChange, onLoadMore });

    rerender(gridElement({ rows, query: searchedQuery, onQueryChange, onLoadMore }));
    scrollGridTo(40 * 50);
    // The loaded rows still answer the old query, so nothing more is asked of them.
    expect(onLoadMore).not.toHaveBeenCalled();

    rerender(
      gridElement({
        rows: makeInventoryRows(50).reverse(),
        query: searchedQuery,
        onQueryChange,
        onLoadMore,
      }),
    );
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});

// A cache keyed by the query answers a query it has seen with the very array it gave before, so
// when the user goes from A to B and back to A before B's page arrives, the rows on screen are
// A's again and loading must go on.
describe('a query that comes back before its new rows', () => {
  const rows = makeInventoryRows(50);

  it('loads more after the app brings back the first query with the same rows', () => {
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    const searchedQuery: DataGridQuery = { ...emptyDataGridQuery, search: 'bolt' };
    const { rerender } = renderGrid({ rows, query: emptyDataGridQuery, onQueryChange, onLoadMore });

    rerender(gridElement({ rows, query: searchedQuery, onQueryChange, onLoadMore }));
    rerender(gridElement({ rows, query: { ...emptyDataGridQuery }, onQueryChange, onLoadMore }));
    scrollGridTo(40 * 50);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('loads more after three header clicks bring the sort back to none', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    renderGrid({ rows, onQueryChange, onLoadMore });
    emulateScrollTo();

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    await user.click(nameHeader);
    await user.click(nameHeader);
    await user.click(nameHeader);
    expect(onQueryChange).toHaveBeenLastCalledWith(emptyDataGridQuery);
    scrollGridTo(40 * 50);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('loads more after a text filter is typed and then deleted', () => {
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    renderGrid({ rows, columns: filterableInventoryColumns, onQueryChange, onLoadMore });
    emulateScrollTo();
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const nameFilter = screen.getByRole('searchbox', { name: 'Filter by Name' });

    fireEvent.change(nameFilter, { target: { value: 'hex' } });
    fireEvent.keyDown(nameFilter, { key: 'Enter' });
    fireEvent.change(nameFilter, { target: { value: '' } });
    fireEvent.keyDown(nameFilter, { key: 'Enter' });
    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(onQueryChange).toHaveBeenLastCalledWith(emptyDataGridQuery);
    scrollGridTo(40 * 50);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('loads more after a select filter goes back to All', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    renderGrid({ rows, columns: filterableInventoryColumns, onQueryChange, onLoadMore });
    emulateScrollTo();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const statusFilter = screen.getByRole('combobox', { name: 'Filter by Status' });

    await user.click(statusFilter);
    await user.click(await screen.findByRole('option', { name: 'Low' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await user.click(statusFilter);
    await user.click(await screen.findByRole('option', { name: 'All' }));
    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(onQueryChange).toHaveBeenLastCalledWith(emptyDataGridQuery);
    scrollGridTo(40 * 50);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('still waits while the query differs from the one the rows answer', () => {
    const onLoadMore = vi.fn();
    const onQueryChange = vi.fn();
    const { rerender } = renderGrid({ rows, query: emptyDataGridQuery, onQueryChange, onLoadMore });

    rerender(
      gridElement({
        rows,
        query: { ...emptyDataGridQuery, search: 'bolt' },
        onQueryChange,
        onLoadMore,
      }),
    );
    rerender(
      gridElement({
        rows,
        query: { ...emptyDataGridQuery, search: 'nut' },
        onQueryChange,
        onLoadMore,
      }),
    );
    scrollGridTo(40 * 50);

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});

describe('ServerMode story', () => {
  it('loads, recovers from a failed page and sorts on the server', axeUnderLoad, async () => {
    const user = userEvent.setup();
    const { container } = render(<ServerMode />);
    expect(await screen.findByText('Showing 50 of 240 rows')).toBeInTheDocument();
    expect(nameOfEachRow()[0]).toBe('Hex bolt M6');
    emulateScrollTo();

    scrollGridTo(40 * 50);
    expect(await screen.findByText('Showing 100 of 240 rows')).toBeInTheDocument();

    // The third page fails once.
    scrollGridTo(40 * 100);
    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByText('Could not load rows')).toBeInTheDocument();
    await user.click(retry);
    expect(await screen.findByText('Showing 150 of 240 rows')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();

    // A sort starts again from the first page, sorted by the server.
    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(await screen.findByText('Showing 50 of 240 rows')).toBeInTheDocument();
    expect(nameOfEachRow()[0]).toBe('Box cutter');
    expect(scrollArea().scrollTop).toBe(0);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('finding rows in server mode', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks the server again when a filter changes', async () => {
    const user = userEvent.setup();
    render(<ServerFindingRows />);
    expect(await screen.findByText('Showing 50 of 240 rows')).toBeInTheDocument();
    fetchPageRequests.mockClear();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('combobox', { name: 'Filter by Status' }));
    await user.click(await screen.findByRole('option', { name: 'Low' }));

    expect(fetchPageRequests).toHaveBeenCalledTimes(1);
    expect(fetchPageRequests).toHaveBeenCalledWith({
      page: 0,
      query: { ...emptyDataGridQuery, filters: { status: 'low' } },
    });
    // The server counts every row that matches, not only the page it sends.
    const lowCount = countOfServerRowsWhere((row) => row.status === 'low');
    expect(lowCount).toBeGreaterThan(50);
    expect(await screen.findByText(`Showing 50 of ${lowCount} rows`)).toBeInTheDocument();
    expect(textOfEachRow('Status').every((status) => status === 'low')).toBe(true);
  });

  it('keeps the old rows and does not load more until the new rows arrive', async () => {
    vi.useFakeTimers();
    const delayMs = 300;
    const server = createMockInventoryServer({ total: 240, pageSize: 50, delayMs });
    const onLoadMore = vi.fn();
    // An app that says nothing of the wait while the next query's first page is on its way, so
    // only the grid's own rule keeps it from asking more of the rows on screen meanwhile.
    function SlowServerApp() {
      const [page, setPage] = useState<InventoryPage>(() => ({
        rows: makeInventoryRows(50),
        total: 240,
      }));
      return gridElement({
        columns: filterableInventoryColumns,
        rows: page.rows,
        totalRowCount: page.total,
        hasMore: page.rows.length < page.total,
        onLoadMore,
        onQueryChange: (query) => void server.fetchPage({ page: 0, query }).then(setPage),
      });
    }
    render(<SlowServerApp />);
    emulateScrollTo();

    // Fake timers hold the server's answer back: the grid is driven with `fireEvent`.
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const locationFilter = screen.getByRole('searchbox', { name: 'Filter by Location' });
    act(() => locationFilter.focus());
    fireEvent.change(locationFilter, { target: { value: 'B-07' } });
    fireEvent.keyDown(locationFilter, { key: 'Enter' });
    expect(fetchPageRequests).toHaveBeenLastCalledWith({
      page: 0,
      query: { ...emptyDataGridQuery, filters: { location: 'B-07' } },
    });

    // The rows on screen still answer the old query, at the top and at the end.
    expect(nameOfEachRow()[0]).toBe('Hex bolt M6');
    scrollGridTo(40 * 50);
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(textOfEachRow('Location')).toContain('A-01');
    expect(screen.getByText('Showing 50 of 240 rows')).toBeInTheDocument();

    // The first page of the new query lands at the end of the view, so the grid asks for more.
    await act(() => vi.advanceTimersByTimeAsync(delayMs));
    const matchCount = countOfServerRowsWhere((row) => row.location === 'B-07');
    expect(screen.getByText(`Showing 50 of ${matchCount} rows`)).toBeInTheDocument();
    expect(textOfEachRow('Location').every((location) => location === 'B-07')).toBe(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('asks the server again when the search changes', async () => {
    const user = userEvent.setup();
    render(<ServerFindingRows />);
    expect(await screen.findByText('Showing 50 of 240 rows')).toBeInTheDocument();
    fetchPageRequests.mockClear();

    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.keyboard('washer{Enter}');

    expect(fetchPageRequests).toHaveBeenCalledTimes(1);
    expect(fetchPageRequests).toHaveBeenCalledWith({
      page: 0,
      query: { ...emptyDataGridQuery, search: 'washer' },
    });
    const washerMatcher = createQueryMatcher(filterableInventoryColumns, {
      ...emptyDataGridQuery,
      search: 'washer',
    });
    const washerCount = countOfServerRowsWhere((row) => washerMatcher?.(row) ?? true);
    expect(washerCount).toBeGreaterThan(0);
    expect(
      await screen.findByText(`Showing ${Math.min(washerCount, 50)} of ${washerCount} rows`),
    ).toBeInTheDocument();
  });

  it('shows the filtered-empty state in server mode', async () => {
    const user = userEvent.setup();
    render(<ServerFindingRows />);
    expect(await screen.findByText('Showing 50 of 240 rows')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const nameFilter = screen.getByRole('searchbox', { name: 'Filter by Name' });
    // No item is called that, so the server answers with no rows.
    await user.type(nameFilter, 'Anvil{Enter}');
    expect(fetchPageRequests).toHaveBeenLastCalledWith({
      page: 0,
      query: { ...emptyDataGridQuery, filters: { name: 'Anvil' } },
    });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.'),
    );

    fetchPageRequests.mockClear();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(fetchPageRequests).toHaveBeenCalledTimes(1);
    expect(fetchPageRequests).toHaveBeenCalledWith({ page: 0, query: emptyDataGridQuery });
    expect(await screen.findByText('Showing 50 of 240 rows')).toBeInTheDocument();
    expect(nameFilter).toHaveValue('');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
