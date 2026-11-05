import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installElementSize } from '../../../test/elementSize';
import { createDataGridColumnHelper } from './columns';
import { DataGrid } from './DataGrid';
import * as stories from './DataGrid.stories';
import { inventoryColumns, makeInventoryRows, type InventoryRow } from './fixtures';

const { Large } = composeStories(stories);

const columnHelper = createDataGridColumnHelper<InventoryRow>();

/** SKU and Name, then a cell holding a link and a button. */
const columnsWithControls = columnHelper.columns([
  columnHelper.accessor('sku', { header: 'SKU' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.display({
    id: 'controls',
    header: 'Links',
    cell: (context) => (
      <>
        <a href={`#${context.row.original.id}`}>Open {context.row.original.name}</a>
        <button type="button">Edit {context.row.original.name}</button>
      </>
    ),
  }),
]);

function renderGrid(overrides: Partial<React.ComponentProps<typeof DataGrid<InventoryRow>>> = {}) {
  return render(
    <>
      <button type="button">Before</button>
      <DataGrid<InventoryRow>
        gridId="keyboard-grid"
        heading="Inventory"
        rows={makeInventoryRows(10)}
        columns={inventoryColumns}
        getRowId={(row) => row.id}
        {...overrides}
      />
      <button type="button">After</button>
    </>,
  );
}

function rowWithIndex(ariaRowIndex: number): HTMLElement | undefined {
  return screen
    .getAllByRole('row')
    .find((row) => row.getAttribute('aria-rowindex') === String(ariaRowIndex));
}

/** The cell at an `aria-rowindex` and `aria-colindex`, both counted from 1. */
function cellAt(ariaRowIndex: number, ariaColIndex: number): HTMLElement {
  const row = rowWithIndex(ariaRowIndex);
  if (!row) throw new Error(`row ${ariaRowIndex} is not rendered`);
  const cell = row.querySelector<HTMLElement>(`[aria-colindex="${ariaColIndex}"]`);
  if (!cell) throw new Error(`row ${ariaRowIndex} has no column ${ariaColIndex}`);
  return cell;
}

function expectFocusAt(ariaRowIndex: number, ariaColIndex: number) {
  expect(document.activeElement).toBe(cellAt(ariaRowIndex, ariaColIndex));
}

function scrollGridTo(scrollTop: number) {
  const scrollElement = document.querySelector('[data-grid-scroll]') as HTMLElement;
  act(() => {
    scrollElement.scrollTop = scrollTop;
    scrollElement.dispatchEvent(new Event('scroll'));
  });
}

/** Tabs from the button before the grid onto its one tab stop. */
async function tabIntoGrid(user: ReturnType<typeof userEvent.setup>) {
  screen.getByRole('button', { name: 'Before' }).focus();
  await user.tab();
}

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
});

afterEach(() => {
  restoreElementSize();
});

describe('keyboard navigation', () => {
  it('has one tab stop', async () => {
    const user = userEvent.setup();
    renderGrid({ columns: columnsWithControls });
    await tabIntoGrid(user);
    expect(document.activeElement).toBe(screen.getByRole('columnheader', { name: 'SKU' }));
    expect(screen.getByRole('columnheader', { name: 'SKU' })).toHaveAttribute('tabindex', '0');
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    const grid = screen.getByRole('grid');
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    for (const link of within(grid).getAllByRole('link')) {
      expect(link).toHaveAttribute('tabindex', '-1');
    }
  });

  it('arrow keys move between cells', async () => {
    const user = userEvent.setup();
    renderGrid({ rows: makeInventoryRows(3) });
    await tabIntoGrid(user);

    await user.keyboard('{ArrowUp}');
    expectFocusAt(1, 1);
    await user.keyboard('{ArrowLeft}');
    expectFocusAt(1, 1);

    await user.keyboard('{ArrowDown}');
    expectFocusAt(2, 1);
    expect(document.activeElement).toHaveTextContent('SKU-1000');
    expect(document.activeElement).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('columnheader', { name: 'SKU' })).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowRight}');
    expectFocusAt(2, 2);
    await user.keyboard('{ArrowLeft}');
    expectFocusAt(2, 1);
    await user.keyboard('{ArrowUp}');
    expectFocusAt(1, 1);

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expectFocusAt(4, 1);
    await user.keyboard('{End}{ArrowRight}');
    expectFocusAt(4, inventoryColumns.length);
  });

  it('Home, End, Ctrl+Home and Ctrl+End', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Large />
      </>,
    );
    await tabIntoGrid(user);
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
    expectFocusAt(2, 3);

    await user.keyboard('{Home}');
    expectFocusAt(2, 1);
    await user.keyboard('{End}');
    expectFocusAt(2, inventoryColumns.length);

    await user.keyboard('{Control>}{End}{/Control}');
    expect(rowWithIndex(5001)).toBeDefined();
    expectFocusAt(5001, inventoryColumns.length);
    expect(document.activeElement).toHaveTextContent(makeInventoryRows(5000)[4999]?.updated ?? '');

    await user.keyboard('{Control>}{Home}{/Control}');
    expect(document.activeElement).toBe(screen.getByRole('columnheader', { name: 'SKU' }));
  });

  it('Page Down and Page Up move by a screen', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Large />
      </>,
    );
    await tabIntoGrid(user);
    await user.keyboard('{ArrowDown}');
    expectFocusAt(2, 1);

    await user.keyboard('{PageDown}');
    expectFocusAt(12, 1);
    await user.keyboard('{PageDown}');
    expectFocusAt(22, 1);
    await user.keyboard('{PageUp}');
    expectFocusAt(12, 1);
  });

  it('keeps the focused row rendered after scrolling it away', async () => {
    const user = userEvent.setup();
    render(<Large />);
    // The third data row; its `aria-rowindex` is 4 because the header row is 1.
    await user.click(cellAt(4, 2));
    expectFocusAt(4, 2);

    scrollGridTo(40 * 3000);
    expect(rowWithIndex(3002)).toBeDefined();
    const focusedCell = cellAt(4, 2);
    expect(focusedCell).toBe(document.activeElement);
    expect(focusedCell).toHaveAttribute('tabindex', '0');

    // Moving on from it brings its neighbour back into view.
    await user.keyboard('{ArrowDown}');
    expectFocusAt(5, 2);
  });

  it('Enter on a sortable header sorts; Shift+Enter adds a secondary sort', async () => {
    const user = userEvent.setup();
    renderGrid({ multiSort: true });
    await tabIntoGrid(user);
    const categoryHeader = screen.getByRole('columnheader', { name: 'Category' });
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(categoryHeader).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(categoryHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.keyboard('{ArrowLeft}');
    expect(nameHeader).toHaveFocus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(categoryHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    const firstRow = rowWithIndex(2) as HTMLElement;
    // Fasteners first, and among them the names in order.
    expect(within(firstRow).getAllByRole('gridcell')[1]).toHaveTextContent('Cardboard box S');

    await user.keyboard('{Enter}');
    expect(categoryHeader).not.toHaveAttribute('aria-sort');
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it("Enter or F2 moves into a cell's controls and Escape returns", async () => {
    const user = userEvent.setup();
    renderGrid({ columns: columnsWithControls });
    await tabIntoGrid(user);
    await user.keyboard('{ArrowDown}{End}');
    const controlsCell = cellAt(2, 3);
    expect(controlsCell).toHaveFocus();
    const link = within(controlsCell).getByRole('link');
    const button = within(controlsCell).getByRole('button');

    await user.keyboard('{Enter}');
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('tabindex', '0');
    expect(controlsCell).toHaveAttribute('tabindex', '-1');

    await user.tab();
    expect(button).toHaveFocus();
    // Inside the cell, the arrows belong to the controls.
    await user.keyboard('{ArrowDown}{ArrowLeft}');
    expect(button).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(controlsCell).toHaveFocus();
    expect(controlsCell).toHaveAttribute('tabindex', '0');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(button).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{F2}');
    expect(link).toHaveFocus();
    await user.keyboard('{Escape}{ArrowDown}');
    expectFocusAt(3, 3);
  });

  it('leaves the controls tabbable no longer once focus leaves the cell', async () => {
    const user = userEvent.setup();
    renderGrid({ columns: columnsWithControls });
    await tabIntoGrid(user);
    await user.keyboard('{ArrowDown}{End}{Enter}');
    const controlsCell = cellAt(2, 3);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(controlsCell).toHaveAttribute('tabindex', '0');
    expect(within(controlsCell).getByRole('link')).toHaveAttribute('tabindex', '-1');
  });

  it('Enter on a plain body cell counts as a row click', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const rows = makeInventoryRows(3);
    renderGrid({ rows, onRowClick });
    await tabIntoGrid(user);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}{Enter}');
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(
      rows[1],
      expect.objectContaining({ type: 'keydown', key: 'Enter' }),
    );
  });

  it('reads the page direction for left and right', async () => {
    document.documentElement.style.direction = 'rtl';
    try {
      const user = userEvent.setup();
      renderGrid();
      await tabIntoGrid(user);
      await user.keyboard('{ArrowLeft}');
      expectFocusAt(1, 2);
      await user.keyboard('{ArrowRight}');
      expectFocusAt(1, 1);
    } finally {
      document.documentElement.style.removeProperty('direction');
    }
  });

  it('keeps focus at the same position when the rows are reordered', async () => {
    const user = userEvent.setup();
    const rows = makeInventoryRows(5);
    const { rerender } = renderGrid({ rows });
    await tabIntoGrid(user);
    await user.keyboard('{ArrowDown}');
    expectFocusAt(2, 1);

    rerender(
      <>
        <button type="button">Before</button>
        <DataGrid<InventoryRow>
          gridId="keyboard-grid"
          heading="Inventory"
          rows={[...rows].reverse()}
          columns={inventoryColumns}
          getRowId={(row) => row.id}
        />
        <button type="button">After</button>
      </>,
    );
    expectFocusAt(2, 1);
    expect(document.activeElement).toHaveTextContent('SKU-1004');
    expect(screen.getByRole('grid').querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it("the context menu key and Shift+F10 report the row's context menu", async () => {
    const user = userEvent.setup();
    const onRowContextMenu = vi.fn();
    const rows = makeInventoryRows(3);
    renderGrid({ rows, onRowContextMenu });
    await tabIntoGrid(user);
    await user.keyboard('{ContextMenu}');
    expect(onRowContextMenu).not.toHaveBeenCalled();

    await user.keyboard('{ArrowDown}{ContextMenu}');
    expect(onRowContextMenu).toHaveBeenLastCalledWith(
      rows[0],
      expect.objectContaining({ type: 'keydown', key: 'ContextMenu' }),
    );
    await user.keyboard('{ArrowDown}{Shift>}{F10}{/Shift}');
    expect(onRowContextMenu).toHaveBeenLastCalledWith(
      rows[1],
      expect.objectContaining({ type: 'keydown', key: 'F10' }),
    );
    expect(onRowContextMenu).toHaveBeenCalledTimes(2);
  });

  it('keeps focus at the same position when the focused row is removed', async () => {
    const user = userEvent.setup();
    const rows = makeInventoryRows(10);
    const { rerender } = renderGrid({ rows });
    await tabIntoGrid(user);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');
    expectFocusAt(5, 2);

    const withoutFourth = rows.filter((row) => row.id !== 'item-4');
    rerender(
      <>
        <button type="button">Before</button>
        <DataGrid<InventoryRow>
          gridId="keyboard-grid"
          heading="Inventory"
          rows={withoutFourth}
          columns={inventoryColumns}
          getRowId={(row) => row.id}
        />
        <button type="button">After</button>
      </>,
    );
    expectFocusAt(5, 2);
    expect(document.activeElement).toHaveTextContent(withoutFourth[3]?.name ?? '');

    rerender(
      <>
        <button type="button">Before</button>
        <DataGrid<InventoryRow>
          gridId="keyboard-grid"
          heading="Inventory"
          rows={withoutFourth.slice(0, 2)}
          columns={inventoryColumns}
          getRowId={(row) => row.id}
        />
        <button type="button">After</button>
      </>,
    );
    expectFocusAt(3, 2);
  });
});
