import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import { DataGrid } from './DataGrid';
import * as stories from './DataGrid.stories';
import { inventoryColumns, makeInventoryRows, type InventoryRow } from './fixtures';

const { ServerMode } = composeStories(stories);

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

function scrollArea(): HTMLElement {
  return document.querySelector('[data-grid-scroll]') as HTMLElement;
}

function scrollGridTo(scrollTop: number) {
  act(() => {
    scrollArea().scrollTop = scrollTop;
    scrollArea().dispatchEvent(new Event('scroll'));
  });
}

/** jsdom has no `scrollTo`; a browser scrolls and then fires a scroll event, and so does this. */
function emulateScrollTo() {
  const scrollElement = scrollArea();
  scrollElement.scrollTo = ((options: ScrollToOptions) => {
    scrollElement.scrollTop = options.top ?? 0;
    scrollElement.dispatchEvent(new Event('scroll'));
  }) as typeof scrollElement.scrollTo;
}

function ariaRowIndexes(): string[] {
  return screen
    .getAllByRole('row')
    .map((row) => row.getAttribute('aria-rowindex'))
    .filter((rowIndex): rowIndex is string => rowIndex !== null);
}

function nameOfEachRow(): (string | null)[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).queryAllByRole('gridcell')[1]?.textContent ?? null);
}

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
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
    const rows = makeInventoryRows(50);
    const { rerender } = renderGrid({ rows, onLoadMore });
    scrollGridTo(40 * 50);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(gridElement({ rows: makeInventoryRows(100), onLoadMore }));

    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    // The old rows stay until the app replaces them, and nothing is asked of them meanwhile.
    scrollGridTo(40 * 100);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(gridElement({ rows: makeInventoryRows(50).reverse(), onLoadMore }));
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
});

describe('ServerMode story', () => {
  it('loads, recovers from a failed page and sorts on the server', async () => {
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
