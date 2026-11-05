import { render, screen } from '@testing-library/react';
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
  const columnIndex = inventoryColumns.findIndex(
    (column) => 'header' in column && column.header === columnName,
  );
  const cell = row.querySelectorAll<HTMLElement>('td')[columnIndex];
  if (!cell) throw new Error(`no ${columnName} cell for item-${itemNumber}`);
  return cell;
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
    document.addEventListener('contextmenu', (event) => contextMenuEvents.push(event));
    await user.pointer({ keys: '[MouseRight]', target: cellOfItem(2, 'SKU') });
    expect(contextMenuEvents).toHaveLength(1);
    expect(contextMenuEvents[0]?.defaultPrevented).toBe(false);
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
