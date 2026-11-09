import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import { DataGrid } from './DataGrid';
import { filterableInventoryColumns, makeInventoryRows, type InventoryRow } from './fixtures';
import { emptyDataGridQuery } from './query';
import type { DataGridQuery } from './types';

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
    .slice(1)
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
    expect(within(grid).getByText('No rows match the filters.')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the filters.');
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

  it('keeps the Clear filters button in the tab order', async () => {
    const user = userEvent.setup();
    renderGrid({ initialQuery: matchesNothing });

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
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the filters.');

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
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the filters.');

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
});
