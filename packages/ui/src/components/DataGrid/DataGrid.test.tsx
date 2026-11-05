import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { createDataGridColumnHelper, textValueOf } from './columns';
import { DataGrid } from './DataGrid';
import * as stories from './DataGrid.stories';
import { inventoryColumns, makeInventoryRows, type InventoryRow } from './fixtures';

const { Basic } = composeStories(stories);

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
