import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installElementSize } from '../../../test/elementSize';
import { axe } from '../../../test/axe';
import { createDataGridColumnHelper } from './columns';
import { DataGrid } from './DataGrid';
import { inventoryColumns, makeInventoryRows, type InventoryRow } from './fixtures';

const columnHelper = createDataGridColumnHelper<InventoryRow>();

function renderGrid(overrides: Partial<React.ComponentProps<typeof DataGrid<InventoryRow>>> = {}) {
  return render(
    <DataGrid<InventoryRow>
      gridId="selection-grid"
      heading="Inventory"
      rows={makeInventoryRows(10)}
      columns={inventoryColumns}
      getRowId={(row) => row.id}
      {...overrides}
    />,
  );
}

/** The body row for `item-<number>`, found by its SKU cell (`SKU-1000` is `item-1`). */
function rowOfItem(itemNumber: number): HTMLElement {
  const row = screen.getByText(`SKU-${String(999 + itemNumber)}`).closest('tr');
  if (!row) throw new Error(`item-${itemNumber} is not rendered`);
  return row;
}

function cellOfItem(itemNumber: number, columnName: string): HTMLElement {
  const row = rowOfItem(itemNumber);
  // Counted through the header, so a checkbox column in front shifts both alike.
  const columnIndex = screen
    .getAllByRole('columnheader')
    .findIndex((header) => header.textContent === columnName);
  const cell = row.querySelectorAll<HTMLElement>('td')[columnIndex];
  if (!cell) throw new Error(`no ${columnName} cell for item-${itemNumber}`);
  return cell;
}

function rowCheckbox(itemNumber: number): HTMLElement {
  return screen.getByRole('checkbox', { name: `Select SKU-${String(999 + itemNumber)}` });
}

function selectAllCheckbox(): HTMLElement {
  return screen.getByRole('checkbox', { name: 'Select all rows' });
}

/** The ids of the rows the grid reports selected, from the last change it announced. */
function lastSelection(onSelectedRowIdsChange: ReturnType<typeof vi.fn>): string[] {
  return onSelectedRowIdsChange.mock.lastCall?.[0] as string[];
}

function itemIds(...itemNumbers: number[]): string[] {
  return itemNumbers.map((itemNumber) => `item-${itemNumber}`);
}

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
});

afterEach(() => {
  restoreElementSize();
});

describe('row events', () => {
  it('reports click, double click and context menu', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onRowDoubleClick = vi.fn();
    const onRowContextMenu = vi.fn();
    renderGrid({ onRowClick, onRowDoubleClick, onRowContextMenu });
    const cell = cellOfItem(2, 'SKU');

    await user.click(cell);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-2' }),
      expect.objectContaining({ type: 'click' }),
    );

    await user.dblClick(cell);
    expect(onRowDoubleClick).toHaveBeenCalledTimes(1);
    expect(onRowDoubleClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-2' }),
      expect.objectContaining({ type: 'dblclick' }),
    );

    await user.pointer({ keys: '[MouseRight]', target: cell });
    expect(onRowContextMenu).toHaveBeenCalledTimes(1);
    expect(onRowContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-2' }),
      expect.objectContaining({ type: 'contextmenu' }),
    );
    // The row's own menu replaces the browser's.
    expect(onRowContextMenu.mock.calls[0]?.[1].defaultPrevented).toBe(true);
  });

  it('leaves the native context menu alone without a handler', async () => {
    const user = userEvent.setup();
    renderGrid({ onRowClick: vi.fn() });
    const contextMenuEvents: Event[] = [];
    const recordContextMenu = (event: Event) => contextMenuEvents.push(event);
    document.addEventListener('contextmenu', recordContextMenu);
    try {
      await user.pointer({ keys: '[MouseRight]', target: cellOfItem(2, 'SKU') });
      expect(contextMenuEvents).toHaveLength(1);
      expect(contextMenuEvents[0]?.defaultPrevented).toBe(false);
    } finally {
      document.removeEventListener('contextmenu', recordContextMenu);
    }
  });

  it("the context menu key and Shift+F10 open the row's context menu", async () => {
    const user = userEvent.setup();
    const onRowContextMenu = vi.fn();
    renderGrid({ onRowContextMenu });
    cellOfItem(3, 'SKU').focus();

    await user.keyboard('{ContextMenu}');
    expect(onRowContextMenu).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'item-3' }),
      expect.objectContaining({ type: 'keydown', key: 'ContextMenu' }),
    );
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(onRowContextMenu).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'item-3' }),
      expect.objectContaining({ type: 'keydown', key: 'F10' }),
    );
    expect(onRowContextMenu).toHaveBeenCalledTimes(2);
  });

  it('one key press opens the context menu once, even when the browser adds a contextmenu event', async () => {
    const user = userEvent.setup();
    const onRowContextMenu = vi.fn();
    renderGrid({ onRowContextMenu });
    const cell = cellOfItem(3, 'SKU');
    cell.focus();

    fireEvent.keyDown(cell, { key: 'ContextMenu' });
    fireEvent.contextMenu(cell);
    expect(onRowContextMenu).toHaveBeenCalledTimes(1);

    // The echo was swallowed, so the next one is a real right-click.
    fireEvent.contextMenu(cell);
    expect(onRowContextMenu).toHaveBeenCalledTimes(2);

    // A key press the browser never echoes must not swallow the next real right-click.
    fireEvent.keyDown(cell, { key: 'F10', shiftKey: true });
    expect(onRowContextMenu).toHaveBeenCalledTimes(3);
    await user.pointer({ keys: '[MouseRight]', target: cell });
    expect(onRowContextMenu).toHaveBeenCalledTimes(4);
  });

  it('Enter on a body cell is a row click', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderGrid({ onRowClick });
    cellOfItem(3, 'SKU').focus();
    await user.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-3' }),
      expect.objectContaining({ type: 'keydown', key: 'Enter' }),
    );
  });

  it('clicks on controls inside a cell are not row clicks', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onRowDoubleClick = vi.fn();
    const onHighlightChange = vi.fn();
    const onButtonClick = vi.fn();
    const onSpanClick = vi.fn();
    const onSpanKeyDown = vi.fn();
    const onLinkClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const columns = columnHelper.columns([
      columnHelper.accessor('sku', { header: 'SKU' }),
      columnHelper.display({
        id: 'controls',
        header: 'Controls',
        cell: (context) => (
          <>
            <a href={`#${context.row.original.id}`} onClick={onLinkClick}>
              Open {context.row.original.name}
            </a>
            <button type="button" onClick={onButtonClick}>
              Edit {context.row.original.name}
            </button>
            <span role="button" tabIndex={0} onClick={onSpanClick} onKeyDown={onSpanKeyDown}>
              Peek {context.row.original.name}
            </span>
          </>
        ),
      }),
    ]);
    renderGrid({
      columns,
      onRowClick,
      onRowDoubleClick,
      onHighlightChange,
      highlightOnClick: true,
    });

    await user.click(screen.getByRole('button', { name: 'Edit Washer 8 mm' }));
    await user.click(screen.getByRole('link', { name: 'Open Washer 8 mm' }));
    await user.dblClick(screen.getByRole('button', { name: 'Edit Washer 8 mm' }));
    expect(onButtonClick).toHaveBeenCalledTimes(3);
    expect(onLinkClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Peek Washer 8 mm' }));
    expect(onSpanClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
    expect(onRowDoubleClick).not.toHaveBeenCalled();
    expect(onHighlightChange).not.toHaveBeenCalled();
    expect(rowOfItem(2)).not.toHaveAttribute('data-highlighted');

    // The cell around the controls still counts.
    await user.click(rowOfItem(2).querySelectorAll('td')[1] as HTMLElement);
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it('does not report clicks in the header', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderGrid({ onRowClick, highlightOnClick: true });
    await user.click(screen.getByRole('columnheader', { name: 'SKU' }));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('shows a pointer only when rows react to clicks', () => {
    const { rerender } = renderGrid();
    expect(rowOfItem(1)).not.toHaveAttribute('data-clickable');
    rerender(
      <DataGrid<InventoryRow>
        gridId="selection-grid"
        heading="Inventory"
        rows={makeInventoryRows(10)}
        columns={inventoryColumns}
        getRowId={(row) => row.id}
        onRowClick={vi.fn()}
      />,
    );
    expect(rowOfItem(1)).toHaveAttribute('data-clickable');
  });
});

describe('highlight', () => {
  it('highlightOnClick toggles one highlighted row', async () => {
    const user = userEvent.setup();
    renderGrid({ highlightOnClick: true });

    await user.click(cellOfItem(2, 'SKU'));
    expect(rowOfItem(2)).toHaveAttribute('aria-selected', 'true');
    expect(rowOfItem(2)).toHaveAttribute('data-highlighted');

    await user.click(cellOfItem(2, 'SKU'));
    expect(rowOfItem(2)).not.toHaveAttribute('aria-selected', 'true');
    expect(rowOfItem(2)).not.toHaveAttribute('data-highlighted');

    await user.click(cellOfItem(2, 'SKU'));
    await user.click(cellOfItem(3, 'SKU'));
    expect(rowOfItem(3)).toHaveAttribute('data-highlighted');
    expect(rowOfItem(2)).not.toHaveAttribute('data-highlighted');
    expect(rowOfItem(2)).not.toHaveAttribute('aria-selected', 'true');
  });

  it('a highlighted row has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid({ highlightOnClick: true });
    await user.click(cellOfItem(2, 'SKU'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not highlight without highlightOnClick', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(cellOfItem(2, 'SKU'));
    expect(rowOfItem(2)).not.toHaveAttribute('data-highlighted');
  });

  it('Enter on a body cell highlights the row too', async () => {
    const user = userEvent.setup();
    renderGrid({ highlightOnClick: true });
    cellOfItem(3, 'SKU').focus();
    await user.keyboard('{Enter}');
    expect(rowOfItem(3)).toHaveAttribute('data-highlighted');
    await user.keyboard('{Enter}');
    expect(rowOfItem(3)).not.toHaveAttribute('data-highlighted');
  });

  it('reports the new highlight, and null when it clears', async () => {
    const user = userEvent.setup();
    const onHighlightChange = vi.fn();
    renderGrid({ highlightOnClick: true, onHighlightChange });
    await user.click(cellOfItem(2, 'SKU'));
    expect(onHighlightChange).toHaveBeenLastCalledWith('item-2');
    await user.click(cellOfItem(2, 'SKU'));
    expect(onHighlightChange).toHaveBeenLastCalledWith(null);
  });

  it('highlight can be controlled', async () => {
    const user = userEvent.setup();
    const onHighlightChange = vi.fn();
    const props = {
      gridId: 'selection-grid',
      heading: 'Inventory',
      rows: makeInventoryRows(10),
      columns: inventoryColumns,
      getRowId: (row: InventoryRow) => row.id,
      highlightOnClick: true,
      onHighlightChange,
    };
    const { rerender } = render(<DataGrid<InventoryRow> {...props} highlightedRowId="item-4" />);
    expect(rowOfItem(4)).toHaveAttribute('data-highlighted');

    await user.click(cellOfItem(2, 'SKU'));
    expect(onHighlightChange).toHaveBeenCalledWith('item-2');
    expect(rowOfItem(4)).toHaveAttribute('data-highlighted');
    expect(rowOfItem(2)).not.toHaveAttribute('data-highlighted');

    await user.click(cellOfItem(4, 'SKU'));
    expect(onHighlightChange).toHaveBeenLastCalledWith(null);
    expect(rowOfItem(4)).toHaveAttribute('data-highlighted');

    rerender(<DataGrid<InventoryRow> {...props} highlightedRowId="item-2" />);
    expect(rowOfItem(2)).toHaveAttribute('data-highlighted');
    expect(rowOfItem(4)).not.toHaveAttribute('data-highlighted');

    rerender(<DataGrid<InventoryRow> {...props} highlightedRowId={null} />);
    expect(rowOfItem(2)).not.toHaveAttribute('data-highlighted');
  });
});

describe('checkbox selection', () => {
  it('adds a checkbox column with select-all', () => {
    renderGrid({ selectionMode: 'multiple' });
    const grid = screen.getByRole('grid', { name: 'Inventory' });
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');
    // The checkbox column counts among the rendered columns.
    expect(grid).toHaveAttribute('aria-colcount', '8');
    expect(selectAllCheckbox()).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(11);
    expect(rowCheckbox(1)).toBeInTheDocument();
    const firstCells = rowOfItem(1).querySelectorAll('td');
    expect(firstCells).toHaveLength(8);
    expect(firstCells[0]).toHaveAttribute('aria-colindex', '1');
    expect(firstCells[1]).toHaveAttribute('aria-colindex', '2');
    expect(screen.getAllByRole('columnheader')[1]).toHaveAttribute('aria-colindex', '2');
    for (const itemNumber of [1, 2, 3]) {
      expect(rowOfItem(itemNumber)).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('has no checkbox column without selectionMode', () => {
    renderGrid();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('grid')).not.toHaveAttribute('aria-multiselectable');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '7');
  });

  it('names a row checkbox after the row label', () => {
    renderGrid({ selectionMode: 'multiple', getRowLabel: (row) => row.name });
    expect(screen.getByRole('checkbox', { name: 'Select Hex bolt M6' })).toBeInTheDocument();
  });

  it('select-all shows mixed and skips rows that cannot be selected', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({
      selectionMode: 'multiple',
      isRowSelectable: (row) => row.status !== 'out',
      onSelectedRowIdsChange,
    });
    expect(selectAllCheckbox()).toHaveAttribute('aria-checked', 'false');

    await user.click(rowCheckbox(2));
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith(itemIds(2));
    expect(selectAllCheckbox()).toHaveAttribute('aria-checked', 'mixed');
    expect(rowOfItem(2)).toHaveAttribute('aria-selected', 'true');

    await user.click(selectAllCheckbox());
    // Items 4 and 8 are out of stock; the ids come in row order.
    expect(lastSelection(onSelectedRowIdsChange)).toEqual(itemIds(1, 2, 3, 5, 6, 7, 9, 10));
    expect(selectAllCheckbox()).toHaveAttribute('aria-checked', 'true');
    expect(rowCheckbox(4)).toHaveAttribute('aria-checked', 'false');
    expect(rowCheckbox(4)).toHaveAttribute('aria-disabled', 'true');
    expect(rowOfItem(4)).not.toHaveAttribute('aria-selected');
    expect(rowOfItem(3)).toHaveAttribute('aria-selected', 'true');

    await user.click(selectAllCheckbox());
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith([]);
    expect(selectAllCheckbox()).toHaveAttribute('aria-checked', 'false');
  });

  it('Space toggles the focused row; Shift selects a range; Ctrl or Cmd toggles one', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({ selectionMode: 'multiple', onSelectedRowIdsChange, highlightOnClick: true });

    cellOfItem(2, 'SKU').focus();
    await user.keyboard('[Space]');
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith(itemIds(2));
    expect(rowCheckbox(2)).toHaveAttribute('aria-checked', 'true');

    cellOfItem(5, 'SKU').focus();
    await user.keyboard('{Shift>}[Space]{/Shift}');
    expect(lastSelection(onSelectedRowIdsChange)).toEqual(itemIds(2, 3, 4, 5));

    await user.keyboard('{Shift>}');
    await user.click(cellOfItem(7, 'SKU'));
    await user.keyboard('{/Shift}');
    // The range runs from the last toggled row (2), which a range does not move.
    expect(lastSelection(onSelectedRowIdsChange)).toEqual(itemIds(2, 3, 4, 5, 6, 7));

    await user.keyboard('{Control>}');
    await user.click(cellOfItem(3, 'SKU'));
    await user.keyboard('{/Control}');
    expect(lastSelection(onSelectedRowIdsChange)).toEqual(itemIds(2, 4, 5, 6, 7));

    await user.keyboard('{Meta>}');
    await user.click(cellOfItem(3, 'SKU'));
    await user.click(cellOfItem(9, 'SKU'));
    await user.keyboard('{/Meta}');
    expect(lastSelection(onSelectedRowIdsChange)).toEqual(itemIds(2, 3, 4, 5, 6, 7, 9));

    // Selecting by gesture is not a highlight.
    expect(rowOfItem(3)).not.toHaveAttribute('data-highlighted');
  });

  it('Shift on a checkbox selects a range, and a plain click toggles one', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({ selectionMode: 'multiple', onSelectedRowIdsChange });
    await user.click(rowCheckbox(3));
    await user.keyboard('{Shift>}');
    await user.click(rowCheckbox(6));
    await user.keyboard('{/Shift}');
    expect(lastSelection(onSelectedRowIdsChange)).toEqual(itemIds(3, 4, 5, 6));
    await user.click(rowCheckbox(4));
    expect(lastSelection(onSelectedRowIdsChange)).toEqual(itemIds(3, 5, 6));
  });

  it('a plain click on a row does not select it', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    const onRowClick = vi.fn();
    renderGrid({ selectionMode: 'multiple', onSelectedRowIdsChange, onRowClick });
    await user.click(cellOfItem(2, 'SKU'));
    expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it('Space on a row that cannot be selected does nothing', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({
      selectionMode: 'multiple',
      isRowSelectable: (row) => row.status !== 'out',
      onSelectedRowIdsChange,
    });
    cellOfItem(4, 'SKU').focus();
    await user.keyboard('[Space]');
    expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
  });

  it('Space in the checkbox column toggles the row, and on the header toggles select-all', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({ selectionMode: 'multiple', onSelectedRowIdsChange });

    rowOfItem(3).querySelectorAll('td')[0]?.focus();
    await user.keyboard('[Space]');
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith(itemIds(3));

    screen.getAllByRole('columnheader')[0]?.focus();
    await user.keyboard('[Space]');
    expect(lastSelection(onSelectedRowIdsChange)).toHaveLength(10);
    await user.keyboard('[Space]');
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith([]);
  });

  it('keeps the grid to one tab stop with the checkbox column in it', () => {
    renderGrid({ selectionMode: 'multiple' });
    const tabStops = screen.getByRole('grid').querySelectorAll('[tabindex]:not([tabindex="-1"])');
    expect(tabStops).toHaveLength(1);
  });

  it('Enter on a checkbox cell enters it without adding the mirror input to the tab order', async () => {
    const user = userEvent.setup();
    renderGrid({ selectionMode: 'multiple' });
    const cell = rowOfItem(2).querySelectorAll('td')[0] as HTMLElement;
    cell.focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(rowCheckbox(2));
    expect(cell.querySelector('input')).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(cell);
  });

  it('the footer counts the selection', async () => {
    const user = userEvent.setup();
    renderGrid({ selectionMode: 'multiple' });
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
    for (const itemNumber of [1, 2, 3]) await user.click(rowCheckbox(itemNumber));
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByText('10 rows')).toBeInTheDocument();
  });

  it('a sort clears the selection', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({ selectionMode: 'multiple', onSelectedRowIdsChange });
    await user.click(rowCheckbox(1));
    await user.click(rowCheckbox(2));
    onSelectedRowIdsChange.mockClear();
    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(onSelectedRowIdsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith([]);
    expect(rowCheckbox(1)).toHaveAttribute('aria-checked', 'false');

    // Nothing selected, nothing to report.
    onSelectedRowIdsChange.mockClear();
    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
  });

  it('controlled selection follows the prop', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    const props = {
      gridId: 'selection-grid',
      heading: 'Inventory',
      rows: makeInventoryRows(10),
      columns: inventoryColumns,
      getRowId: (row: InventoryRow) => row.id,
      selectionMode: 'multiple' as const,
      onSelectedRowIdsChange,
    };
    const { rerender } = render(<DataGrid<InventoryRow> {...props} selectedRowIds={itemIds(2)} />);
    expect(rowCheckbox(2)).toHaveAttribute('aria-checked', 'true');

    await user.click(rowCheckbox(3));
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith(itemIds(2, 3));
    // The prop has not changed, so neither has the grid.
    expect(rowCheckbox(3)).toHaveAttribute('aria-checked', 'false');

    rerender(<DataGrid<InventoryRow> {...props} selectedRowIds={itemIds(5, 6)} />);
    expect(rowCheckbox(2)).toHaveAttribute('aria-checked', 'false');
    expect(rowCheckbox(5)).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('starts from defaultSelectedRowIds', () => {
    renderGrid({ selectionMode: 'multiple', defaultSelectedRowIds: itemIds(1, 4) });
    expect(rowCheckbox(1)).toHaveAttribute('aria-checked', 'true');
    expect(rowCheckbox(4)).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('rows replaced under the user keep focus in place and drop what went away', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    const onHighlightChange = vi.fn();
    const props = {
      gridId: 'selection-grid',
      heading: 'Inventory',
      columns: inventoryColumns,
      getRowId: (row: InventoryRow) => row.id,
      selectionMode: 'multiple' as const,
      highlightOnClick: true,
      onSelectedRowIdsChange,
      onHighlightChange,
    };
    const rows = makeInventoryRows(10);
    const { rerender } = render(<DataGrid<InventoryRow> {...props} rows={rows} />);
    await user.click(rowCheckbox(4));
    await user.click(rowCheckbox(6));
    cellOfItem(4, 'SKU').focus();
    await user.keyboard('{Enter}');
    expect(rowOfItem(4)).toHaveAttribute('data-highlighted');
    onSelectedRowIdsChange.mockClear();
    onHighlightChange.mockClear();

    rerender(
      <DataGrid<InventoryRow> {...props} rows={rows.filter((row) => row.id !== 'item-4')} />,
    );
    expect(document.activeElement).toBe(cellOfItem(5, 'SKU'));
    expect(onHighlightChange).toHaveBeenCalledTimes(1);
    expect(onHighlightChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('grid').querySelector('[data-highlighted]')).toBeNull();
    expect(onSelectedRowIdsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(['item-6']);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('does not drop the selection while rows are loading', () => {
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({
      selectionMode: 'multiple',
      rows: [],
      loading: true,
      defaultSelectedRowIds: itemIds(2),
      onSelectedRowIdsChange,
    });
    expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
  });

  it('a grid with selected rows has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid({
      selectionMode: 'multiple',
      isRowSelectable: (row) => row.status !== 'out',
    });
    await user.click(rowCheckbox(2));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('highlight with selection', () => {
  it('moves to aria-current when rows are selected by checkbox', async () => {
    const user = userEvent.setup();
    renderGrid({ selectionMode: 'multiple', highlightOnClick: true });
    await user.click(rowCheckbox(3));
    await user.click(cellOfItem(2, 'SKU'));

    expect(rowOfItem(2)).toHaveAttribute('data-highlighted');
    expect(rowOfItem(2)).toHaveAttribute('aria-current', 'true');
    // The selection, not the highlight, speaks through aria-selected.
    expect(rowOfItem(2)).toHaveAttribute('aria-selected', 'false');
    expect(rowOfItem(3)).toHaveAttribute('aria-selected', 'true');
    expect(rowOfItem(3)).not.toHaveAttribute('aria-current');
  });

  it('keeps aria-selected on the highlight without selection', async () => {
    const user = userEvent.setup();
    renderGrid({ highlightOnClick: true });
    await user.click(cellOfItem(2, 'SKU'));
    expect(rowOfItem(2)).toHaveAttribute('aria-selected', 'true');
    expect(rowOfItem(2)).not.toHaveAttribute('aria-current');
  });

  it('a highlighted row beside selected rows has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid({ selectionMode: 'multiple', highlightOnClick: true });
    await user.click(rowCheckbox(3));
    await user.click(cellOfItem(2, 'SKU'));
    expect(await axe(container)).toHaveNoViolations();
  });
});
