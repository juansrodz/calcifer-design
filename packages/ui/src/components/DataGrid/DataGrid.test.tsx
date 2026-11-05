import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import { createDataGridColumnHelper, textValueOf } from './columns';
import { DataGrid } from './DataGrid';
import * as stories from './DataGrid.stories';
import { inventoryColumns, makeInventoryRows, type InventoryRow } from './fixtures';

const { Basic, Large, Loading, Empty, Compact } = composeStories(stories);

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1);
}

function nameOfEachRow(): (string | null)[] {
  return bodyRows().map((row) => within(row).getAllByRole('gridcell')[1]?.textContent ?? null);
}

function renderGrid(overrides: Partial<React.ComponentProps<typeof DataGrid<InventoryRow>>> = {}) {
  return render(
    <DataGrid<InventoryRow>
      gridId="test-grid"
      heading="Inventory"
      rows={makeInventoryRows(10)}
      columns={inventoryColumns}
      getRowId={(row) => row.id}
      {...overrides}
    />,
  );
}

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
});

afterEach(() => {
  restoreElementSize();
});

describe('DataGrid', () => {
  it('renders a grid named by its heading', async () => {
    const { container } = render(<Basic />);
    expect(screen.getByRole('grid', { name: 'Inventory' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Inventory' })).toBeInTheDocument();
    const headerNames = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(headerNames).toEqual([
      'SKU',
      'Name',
      'Category',
      'Location',
      'Quantity',
      'Status',
      'Updated',
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('numbers every header and cell by column', () => {
    render(<Basic />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((header) => header.getAttribute('aria-colindex'))).toEqual(
      headers.map((_header, index) => String(index + 1)),
    );
    const cells = bodyRows().flatMap((row) => within(row).getAllByRole('gridcell'));
    expect(cells.map((cell) => cell.getAttribute('aria-colindex'))).toEqual(
      cells.map((_cell, index) => String((index % headers.length) + 1)),
    );
  });

  it('counts every rendered column on the grid', () => {
    render(<Basic />);
    expect(screen.getByRole('grid')).toHaveAttribute(
      'aria-colcount',
      String(screen.getAllByRole('columnheader').length),
    );
  });

  it('renders without a ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    try {
      renderGrid();
      expect(bodyRows()).toHaveLength(10);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows an em dash for an empty data cell', () => {
    const locations = ['', '   ', 'A-01'];
    const rows = makeInventoryRows(3).map((row, index) => ({
      ...row,
      location: locations[index] ?? '',
    }));
    renderGrid({ rows });
    const locationCells = bodyRows().map(
      (row) => within(row).getAllByRole('gridcell')[3]?.textContent,
    );
    expect(locationCells[0]).toBe('—');
    expect(locationCells[1]).toBe('—');
    expect(locationCells[2]).toBe('A-01');
  });

  it('honours the heading level', () => {
    renderGrid({ headingLevel: 4 });
    expect(screen.getByRole('heading', { level: 4, name: 'Inventory' })).toBeInTheDocument();
  });

  it('renders the actions slot beside the heading', () => {
    renderGrid({ actions: <button type="button">Add item</button> });
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });

  it('sorts by a header, cycling ascending, descending and off', async () => {
    renderGrid();
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    const originalOrder = nameOfEachRow();
    expect(nameHeader).not.toHaveAttribute('aria-sort');

    await userEvent.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(nameOfEachRow()[0]).toBe('Box cutter');

    await userEvent.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(nameOfEachRow()[0]).toBe('Washer 8 mm');

    await userEvent.click(nameHeader);
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    expect(nameOfEachRow()).toEqual(originalOrder);
  });

  it('sorts a numeric column ascending first', async () => {
    renderGrid();
    const quantityHeader = screen.getByRole('columnheader', { name: 'Quantity' });
    await userEvent.click(quantityHeader);
    expect(quantityHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sorts in natural order', async () => {
    const rows = makeInventoryRows(3).map((row, index) => ({
      ...row,
      name: ['Item 10', 'Item 2', 'item 1'][index] ?? '',
    }));
    renderGrid({ rows });
    await userEvent.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(nameOfEachRow()).toEqual(['item 1', 'Item 2', 'Item 10']);
  });

  it('starts sorted when given an initial sorting', () => {
    renderGrid({ initialSorting: [{ id: 'name', desc: true }] });
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('adds a secondary sort with shift when multiSort is on', async () => {
    const user = userEvent.setup();
    renderGrid({ multiSort: true });
    await user.click(screen.getByRole('columnheader', { name: 'Category' }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    await user.keyboard('{/Shift}');
    expect(screen.getByRole('columnheader', { name: 'Category' })).toHaveAttribute('aria-sort');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort');
  });

  it('replaces the first sort on shift-click without multiSort', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(screen.getByRole('columnheader', { name: 'Category' }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    await user.keyboard('{/Shift}');
    expect(screen.getByRole('columnheader', { name: 'Category' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('does not sort when enableSorting is false', async () => {
    renderGrid({ enableSorting: false });
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    await userEvent.click(nameHeader);
    expect(nameHeader).not.toHaveAttribute('aria-sort');
  });

  it('does not sort a column that disables sorting', async () => {
    const columnHelper = createDataGridColumnHelper<InventoryRow>();
    const columns = columnHelper.columns([
      columnHelper.accessor('sku', { header: 'SKU', enableSorting: false }),
      columnHelper.accessor('name', { header: 'Name' }),
    ]);
    renderGrid({ columns });
    const skuHeader = screen.getByRole('columnheader', { name: 'SKU' });
    await userEvent.click(skuHeader);
    expect(skuHeader).not.toHaveAttribute('aria-sort');
    await userEvent.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('shows the row count in the footer', () => {
    const { rerender } = renderGrid();
    expect(screen.getByText('10 rows')).toBeInTheDocument();
    rerender(
      <DataGrid<InventoryRow>
        gridId="test-grid"
        heading="Inventory"
        rows={makeInventoryRows(1)}
        columns={inventoryColumns}
        getRowId={(row) => row.id}
      />,
    );
    expect(screen.getByText('1 row')).toBeInTheDocument();
  });

  it('removes the footer with hideFooter', () => {
    renderGrid({ hideFooter: true });
    expect(screen.queryByText('10 rows')).not.toBeInTheDocument();
  });

  it('replaces labels through the labels prop', () => {
    renderGrid({ labels: { rowCount: (count) => `${count} items` } });
    expect(screen.getByText('10 items')).toBeInTheDocument();
  });
});

describe('states, density and the toolbar', () => {
  it('shows a loading state with the header still visible', async () => {
    const { container } = renderGrid({
      loading: true,
      actions: <button type="button">Add item</button>,
    });
    expect(screen.getByRole('status')).toHaveTextContent('Loading rows…');
    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(inventoryColumns.length);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
    expect(within(screen.getByRole('grid')).queryByText('SKU-1000')).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the loading story without axe violations', async () => {
    const { container } = render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading rows…');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows an empty state and keeps the actions usable', async () => {
    const onAdd = vi.fn();
    const { container } = renderGrid({
      rows: [],
      actions: (
        <button type="button" onClick={onAdd}>
          Add item
        </button>
      ),
    });
    expect(screen.getByRole('status')).toHaveTextContent('No rows to show.');
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('replaces the empty message with emptyState', () => {
    renderGrid({ rows: [], emptyState: <p>Nothing stocked yet.</p> });
    expect(screen.getByText('Nothing stocked yet.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('grid')).queryByText('No rows to show.'),
    ).not.toBeInTheDocument();
  });

  it('announces the empty label politely even when emptyState is custom', () => {
    renderGrid({ rows: [], emptyState: <p>Nothing stocked yet.</p> });
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('No rows to show.');
  });

  it('keeps one persistent polite region that is empty while rows show', () => {
    const { rerender } = renderGrid();
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toBeEmptyDOMElement();

    rerender(
      <DataGrid<InventoryRow>
        gridId="test-grid"
        heading="Inventory"
        rows={[]}
        columns={inventoryColumns}
        getRowId={(row) => row.id}
      />,
    );
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('No rows to show.');
  });

  it('hides the visible state message from assistive technology', () => {
    renderGrid({ rows: [] });
    const visibleMessage = within(screen.getByRole('grid')).getByText('No rows to show.');
    expect(visibleMessage).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the empty story without axe violations', async () => {
    const { container } = render(<Empty />);
    expect(screen.getByRole('status')).toHaveTextContent('No rows to show.');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('draws a refresh button only when onRefresh is given', async () => {
    const onRefresh = vi.fn();
    const { rerender } = renderGrid();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();

    rerender(
      <DataGrid<InventoryRow>
        gridId="test-grid"
        heading="Inventory"
        rows={makeInventoryRows(10)}
        columns={inventoryColumns}
        getRowId={(row) => row.id}
        onRefresh={onRefresh}
      />,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Grid tools' });
    await userEvent.click(within(toolbar).getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    // A () => void callback is called bare, not handed the click event.
    expect(onRefresh).toHaveBeenCalledWith();
  });

  it('does not refresh again while refreshing', async () => {
    const onRefresh = vi.fn();
    renderGrid({ onRefresh, refreshing: true });
    const refreshButton = within(screen.getByRole('toolbar', { name: 'Grid tools' })).getByRole(
      'button',
      { name: 'Refresh' },
    );
    expect(refreshButton).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(refreshButton);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('keeps the toolbar between the heading and the actions', () => {
    renderGrid({ onRefresh: vi.fn(), actions: <button type="button">Add item</button> });
    const heading = screen.getByRole('heading', { name: 'Inventory' });
    const toolbar = screen.getByRole('toolbar', { name: 'Grid tools' });
    const action = screen.getByRole('button', { name: 'Add item' });
    expect(
      heading.compareDocumentPosition(toolbar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(toolbar.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('compact density keeps cells to one line and titles them', async () => {
    const { container } = renderGrid({ density: 'compact' });
    expect(screen.getByRole('grid')).toHaveAttribute('data-density', 'compact');
    const nameCell = within(bodyRows()[0] as HTMLElement).getAllByRole('gridcell')[1];
    expect(nameCell).toHaveAttribute('title', makeInventoryRows(1)[0]?.name);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('comfortable density does not title its cells', () => {
    renderGrid();
    expect(screen.getByRole('grid')).toHaveAttribute('data-density', 'comfortable');
    const nameCell = within(bodyRows()[0] as HTMLElement).getAllByRole('gridcell')[1];
    expect(nameCell).not.toHaveAttribute('title');
  });

  it('does not title a compact cell that has no text', () => {
    const columnHelper = createDataGridColumnHelper<InventoryRow>();
    const columns = columnHelper.columns([
      columnHelper.display({ id: 'menu', header: 'Menu', cell: () => <span>open</span> }),
    ]);
    renderGrid({ columns, density: 'compact' });
    const cell = within(bodyRows()[0] as HTMLElement).getAllByRole('gridcell')[0];
    expect(cell).not.toHaveAttribute('title');
  });

  it('shows the compact story', () => {
    render(<Compact />);
    expect(screen.getByRole('grid')).toHaveAttribute('data-density', 'compact');
  });

  it('labels replace the English defaults', () => {
    renderGrid({
      labels: { rowCount: (count) => `${count} filas`, loading: 'Cargando…' },
      loading: true,
    });
    expect(screen.getByText('10 filas')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
  });

  it('names the toolbar and the refresh button from the labels', () => {
    renderGrid({
      onRefresh: vi.fn(),
      labels: { toolbar: 'Herramientas', refresh: 'Actualizar' },
    });
    const toolbar = screen.getByRole('toolbar', { name: 'Herramientas' });
    expect(within(toolbar).getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
  });
});

describe('height', () => {
  function scrollArea(): HTMLElement {
    return document.querySelector('[data-grid-scroll]') as HTMLElement;
  }

  it('applies maxHeight inline', () => {
    renderGrid({ maxHeight: '20rem' });
    expect(scrollArea().style.maxHeight).toBe('20rem');
  });

  it('ignores maxHeight when fill is set', () => {
    renderGrid({ maxHeight: '20rem', fill: true });
    expect(scrollArea().style.maxHeight).toBe('');
  });
});

describe('virtualisation', () => {
  function scrollGridTo(scrollTop: number) {
    const scrollElement = document.querySelector('[data-grid-scroll]') as HTMLElement;
    act(() => {
      scrollElement.scrollTop = scrollTop;
      scrollElement.dispatchEvent(new Event('scroll'));
    });
  }

  function rowWithIndex(rowIndex: number): HTMLElement | undefined {
    return screen
      .getAllByRole('row')
      .find((row) => row.getAttribute('aria-rowindex') === String(rowIndex));
  }

  it('renders only the visible rows of a large set', () => {
    render(<Large />);
    expect(bodyRows().length).toBeLessThan(40);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '5001');
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '2');
  });

  it('hides the spacer rows from assistive technology', async () => {
    const { container } = render(<Large />);
    scrollGridTo(40 * 2000);
    const rowsInBody = [...container.querySelectorAll('tbody > tr')];
    const spacerRows = rowsInBody.filter((row) => !row.hasAttribute('aria-rowindex'));
    // One above the rendered window and one below it.
    expect(spacerRows).toHaveLength(2);
    for (const spacerRow of spacerRows) expect(spacerRow).toHaveAttribute('aria-hidden', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders later rows after scrolling', () => {
    render(<Large />);
    scrollGridTo(40 * 2000);
    expect(rowWithIndex(2002)).toBeDefined();
    expect(rowWithIndex(2)).toBeUndefined();
  });

  it('keeps the header in place', () => {
    render(<Large />);
    scrollGridTo(40 * 2000);
    expect(rowWithIndex(1)).toBeDefined();
    expect(screen.getAllByRole('columnheader')).toHaveLength(inventoryColumns.length);
  });
});

describe('textValueOf', () => {
  const columnHelper = createDataGridColumnHelper<InventoryRow>();
  const row = makeInventoryRows(1)[0] as InventoryRow;

  it('prefers the textValue of the column', () => {
    const column = columnHelper.accessor('name', {
      header: 'Name',
      textValue: (source) => `custom ${source.name}`,
    });
    expect(textValueOf(column, row)).toBe(`custom ${row.name}`);
  });

  it('falls back to a string, number or boolean accessor value', () => {
    expect(textValueOf(columnHelper.accessor('name', { header: 'Name' }), row)).toBe(row.name);
    expect(textValueOf(columnHelper.accessor('quantity', { header: 'Quantity' }), row)).toBe(
      String(row.quantity),
    );
    expect(
      textValueOf(
        columnHelper.accessor((source) => source.quantity > 0, { id: 'inStock', header: 'In' }),
        row,
      ),
    ).toBe(String(row.quantity > 0));
  });

  it('has no text for a display column or a non-primitive value', () => {
    expect(textValueOf(columnHelper.display({ id: 'menu', header: 'Menu' }), row)).toBeUndefined();
    expect(
      textValueOf(
        columnHelper.accessor((source) => [source.name], { id: 'list', header: 'List' }),
        row,
      ),
    ).toBeUndefined();
  });
});
