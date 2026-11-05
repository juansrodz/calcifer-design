import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import { createDataGridColumnHelper } from './columns';
import { DataGrid } from './DataGrid';
import * as stories from './DataGrid.stories';

const { RowActions, Expandable } = composeStories(stories);

interface ItemRow {
  id: string;
  name: string;
  quantity: number;
  category: string;
}

function makeItems(count: number): ItemRow[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `item-${index + 1}`,
    name: `Item ${index + 1}`,
    quantity: (index + 1) * 10,
    category: index % 2 === 0 ? 'Tools' : 'Parts',
  }));
}

const columnHelper = createDataGridColumnHelper<ItemRow>();

const itemColumns = columnHelper.columns([
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('quantity', { header: 'Quantity' }),
  columnHelper.accessor('category', { header: 'Category' }),
]);

type GridProps = React.ComponentProps<typeof DataGrid<ItemRow>>;

function gridElement(overrides: Partial<GridProps> = {}) {
  return (
    <DataGrid<ItemRow>
      gridId="expand-grid"
      heading="Items"
      rows={makeItems(10)}
      columns={itemColumns}
      getRowId={(row) => row.id}
      {...overrides}
    />
  );
}

function renderGrid(overrides: Partial<GridProps> = {}) {
  return render(gridElement(overrides));
}

const showDetails = (row: ItemRow) => <p>Details of {row.name}</p>;

function rowWithIndex(ariaRowIndex: number): HTMLElement {
  const row = screen
    .getAllByRole('row')
    .find((candidate) => candidate.getAttribute('aria-rowindex') === String(ariaRowIndex));
  if (!row) throw new Error(`row ${ariaRowIndex} is not rendered`);
  return row;
}

/** The body row whose name cell reads `name`. */
function rowNamed(name: string): HTMLElement {
  const row = screen.getByRole('gridcell', { name }).closest('tr');
  if (!row) throw new Error(`${name} is not rendered`);
  return row;
}

function ariaRowIndexOf(row: HTMLElement): number {
  return Number(row.getAttribute('aria-rowindex'));
}

/** The row right after `row` by `aria-rowindex`. */
function rowAfter(row: HTMLElement): HTMLElement {
  return rowWithIndex(ariaRowIndexOf(row) + 1);
}

function expandButton(name: string): HTMLElement {
  return screen.getByRole('button', { name: `Show details for ${name}` });
}

function cellIn(row: HTMLElement, ariaColIndex: number): HTMLElement {
  const cell = row.querySelector<HTMLElement>(`:scope > [aria-colindex="${ariaColIndex}"]`);
  if (!cell) throw new Error(`no cell at column ${ariaColIndex}`);
  return cell;
}

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 600, rowHeight: 40 });
});

afterEach(() => {
  restoreElementSize();
});

describe('row actions', () => {
  it('renders a row actions column pinned to the end', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const { container } = renderGrid({
      renderRowActions: (row) => <button type="button">Edit {row.name}</button>,
      onRowClick,
    });
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-colcount', '4');
    const headers = screen.getAllByRole('columnheader');
    const actionsHeader = headers[headers.length - 1];
    expect(actionsHeader).toBe(screen.getByRole('columnheader', { name: 'Actions' }));
    expect(actionsHeader).toHaveAttribute('aria-colindex', '4');

    for (const name of ['Item 1', 'Item 2', 'Item 10']) {
      const cells = within(rowNamed(name)).getAllByRole('gridcell');
      const lastCell = cells[cells.length - 1] as HTMLElement;
      expect(lastCell).toHaveAttribute('aria-colindex', '4');
      expect(within(lastCell).getByRole('button')).toHaveAccessibleName(`Edit ${name}`);
    }

    // The column's controls are the row's own, not clicks on the row.
    await user.click(screen.getByRole('button', { name: 'Edit Item 2' }));
    expect(onRowClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('fills the actions header from rowActionsHeader', () => {
    renderGrid({
      renderRowActions: (row) => <button type="button">Edit {row.name}</button>,
      rowActionsHeader: 'Manage',
    });
    expect(screen.getByRole('columnheader', { name: 'Manage' })).toHaveAttribute(
      'aria-colindex',
      '4',
    );
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('falls back to the actions label when rowActionsHeader is empty', () => {
    renderGrid({
      renderRowActions: (row) => <button type="button">Edit {row.name}</button>,
      rowActionsHeader: '',
    });
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toHaveAttribute(
      'aria-colindex',
      '4',
    );
  });

  it('names the actions header from labels', () => {
    renderGrid({
      renderRowActions: (row) => <button type="button">Edit {row.name}</button>,
      labels: { rowActions: 'Row tools' },
    });
    expect(screen.getByRole('columnheader', { name: 'Row tools' })).toBeInTheDocument();
  });

  it('has no actions column without renderRowActions', () => {
    renderGrid();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '3');
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
  });
});

describe('expandable rows', () => {
  it('expands a row into a detail panel', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const { container } = renderGrid({ renderExpandedRow: showDetails, onRowClick });
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-colcount', '4');
    expect(grid).toHaveAttribute('aria-rowcount', '11');
    expect(screen.getByRole('columnheader', { name: 'Details' })).toHaveAttribute(
      'aria-colindex',
      '1',
    );

    const button = expandButton('Item 2');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(cellIn(rowNamed('Item 2'), 1)).toContainElement(button);
    expect(screen.getAllByRole('button', { name: /^Show details for / })).toHaveLength(10);

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(onRowClick).not.toHaveBeenCalled();
    expect(grid).toHaveAttribute('aria-rowcount', '12');

    const row = rowNamed('Item 2');
    const panelRow = rowAfter(row);
    const panelCells = within(panelRow).getAllByRole('gridcell');
    expect(panelCells).toHaveLength(1);
    const panelCell = panelCells[0] as HTMLElement;
    expect(panelCell).toHaveAttribute('colspan', '4');
    expect(panelCell).toHaveAttribute('aria-colindex', '1');
    expect(panelCell).toHaveTextContent('Details of Item 2');
    const controlsId = button.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    expect(panelRow).toContainElement(document.getElementById(controlsId ?? ''));
    // The row after the panel keeps counting on from it.
    expect(ariaRowIndexOf(rowNamed('Item 3'))).toBe(ariaRowIndexOf(row) + 2);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Details of Item 2')).not.toBeInTheDocument();
    expect(grid).toHaveAttribute('aria-rowcount', '11');
  });

  it('puts the expand column after the checkbox column', () => {
    renderGrid({ renderExpandedRow: showDetails, selectionMode: 'multiple' });
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '5');
    const row = rowNamed('Item 1');
    expect(cellIn(row, 1)).toContainElement(
      screen.getByRole('checkbox', { name: 'Select Item 1' }),
    );
    expect(cellIn(row, 2)).toContainElement(expandButton('Item 1'));
    expect(cellIn(row, 3)).toHaveTextContent('Item 1');
  });

  it('isRowExpandable hides the button for some rows', async () => {
    const user = userEvent.setup();
    renderGrid({
      renderExpandedRow: showDetails,
      isRowExpandable: (row) => row.category === 'Tools',
    });
    expect(expandButton('Item 1')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show details for Item 2' }),
    ).not.toBeInTheDocument();
    // The column is still there, so the row's cells line up with the others.
    expect(cellIn(rowNamed('Item 2'), 2)).toHaveTextContent('Item 2');

    // Enter on an empty expand cell opens nothing.
    cellIn(rowNamed('Item 2'), 1).focus();
    await user.keyboard('{Enter}[Space]');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '11');
  });

  it('ignores expanded ids of rows that cannot expand', () => {
    renderGrid({
      renderExpandedRow: showDetails,
      isRowExpandable: (row) => row.category === 'Tools',
      defaultExpandedRowIds: ['item-1', 'item-2'],
    });
    expect(screen.getByText('Details of Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Details of Item 2')).not.toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '12');
  });

  it('Enter or Space on the expand cell toggles the row', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderGrid({
      renderExpandedRow: (row) => <button type="button">Reorder {row.name}</button>,
      onRowClick,
    });
    const expandCell = cellIn(rowNamed('Item 2'), 1);
    expandCell.focus();
    await user.keyboard('{Enter}');
    expect(expandButton('Item 2')).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(expandCell);
    await user.keyboard('[Space]');
    expect(expandButton('Item 2')).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('[Space]');
    expect(expandButton('Item 2')).toHaveAttribute('aria-expanded', 'true');
    expect(onRowClick).not.toHaveBeenCalled();

    // The panel's row is reachable with ArrowDown, and its contents with Enter.
    await user.keyboard('{ArrowDown}');
    const panelRow = rowAfter(rowNamed('Item 2'));
    const panelCell = within(panelRow).getByRole('gridcell');
    expect(document.activeElement).toBe(panelCell);
    expect(panelCell).toHaveAttribute('tabindex', '0');
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reorder Item 2' }));
    expect(onRowClick).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(panelCell);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(cellIn(rowNamed('Item 3'), 1));
  });

  it('Space in the expand column toggles the row, not its selection', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({
      renderExpandedRow: showDetails,
      selectionMode: 'multiple',
      onSelectedRowIdsChange,
    });
    cellIn(rowNamed('Item 4'), 2).focus();
    await user.keyboard('[Space]');
    expect(expandButton('Item 4')).toHaveAttribute('aria-expanded', 'true');
    expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
  });

  it('Up and Down pass through a panel and keep the column', async () => {
    const user = userEvent.setup();
    renderGrid({ renderExpandedRow: showDetails, defaultExpandedRowIds: ['item-2'] });
    cellIn(rowNamed('Item 2'), 3).focus();
    await user.keyboard('{ArrowDown}');
    const panelCell = within(rowAfter(rowNamed('Item 2'))).getByRole('gridcell');
    expect(document.activeElement).toBe(panelCell);
    // The panel is one cell: sideways there is nowhere to go.
    await user.keyboard('{ArrowRight}{ArrowLeft}{ArrowLeft}');
    expect(document.activeElement).toBe(panelCell);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(cellIn(rowNamed('Item 3'), 3));
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(document.activeElement).toBe(cellIn(rowNamed('Item 2'), 3));
  });

  it('expansion can be controlled', async () => {
    const user = userEvent.setup();
    const onExpandedRowIdsChange = vi.fn();
    const { rerender } = renderGrid({
      renderExpandedRow: showDetails,
      expandedRowIds: ['item-2'],
      onExpandedRowIdsChange,
    });
    expect(screen.getByText('Details of Item 2')).toBeInTheDocument();

    await user.click(expandButton('Item 2'));
    expect(onExpandedRowIdsChange).toHaveBeenLastCalledWith([]);
    // Controlled: the panel stays until the prop changes.
    expect(screen.getByText('Details of Item 2')).toBeInTheDocument();

    await user.click(expandButton('Item 5'));
    expect(onExpandedRowIdsChange).toHaveBeenLastCalledWith(['item-2', 'item-5']);

    rerender(
      gridElement({
        renderExpandedRow: showDetails,
        expandedRowIds: ['item-5'],
        onExpandedRowIdsChange,
      }),
    );
    expect(screen.queryByText('Details of Item 2')).not.toBeInTheDocument();
    expect(screen.getByText('Details of Item 5')).toBeInTheDocument();
    expect(expandButton('Item 5')).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts from defaultExpandedRowIds and reports changes', async () => {
    const user = userEvent.setup();
    const onExpandedRowIdsChange = vi.fn();
    renderGrid({
      renderExpandedRow: showDetails,
      defaultExpandedRowIds: ['item-3'],
      onExpandedRowIdsChange,
    });
    expect(screen.getByText('Details of Item 3')).toBeInTheDocument();
    await user.click(expandButton('Item 1'));
    expect(onExpandedRowIdsChange).toHaveBeenLastCalledWith(['item-3', 'item-1']);
    expect(screen.getByText('Details of Item 1')).toBeInTheDocument();
  });

  it('keeps the panel of an open row rendered while its row is, even scrolled away', async () => {
    const user = userEvent.setup();
    renderGrid({
      rows: makeItems(100),
      renderExpandedRow: showDetails,
      defaultExpandedRowIds: ['item-1'],
    });
    // The focused row stays mounted when the user scrolls away from it.
    await user.click(cellIn(rowNamed('Item 1'), 2));
    const scrollElement = document.querySelector('[data-grid-scroll]') as HTMLElement;
    act(() => {
      scrollElement.scrollTop = 40 * 70;
      scrollElement.dispatchEvent(new Event('scroll'));
    });
    expect(screen.queryByText('Item 20')).not.toBeInTheDocument();

    const button = expandButton('Item 1');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const controlsId = button.getAttribute('aria-controls');
    expect(document.getElementById(controlsId ?? '')).toHaveTextContent('Details of Item 1');
  });

  it('a sort keeps expanded rows open and moves their panels', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    renderGrid({
      renderExpandedRow: showDetails,
      selectionMode: 'multiple',
      onSelectedRowIdsChange,
    });
    await user.click(screen.getByRole('checkbox', { name: 'Select Item 5' }));
    await user.click(expandButton('Item 3'));
    const before = ariaRowIndexOf(rowNamed('Item 3'));

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    await user.click(nameHeader);
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    const row = rowNamed('Item 3');
    expect(ariaRowIndexOf(row)).not.toBe(before);
    expect(rowAfter(row)).toHaveTextContent('Details of Item 3');
    expect(expandButton('Item 3')).toHaveAttribute('aria-expanded', 'true');
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole('checkbox', { name: 'Select Item 5' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('flips the chevron for a right-to-left direction set by a stylesheet, not a dir attribute', () => {
    const stylesheet = document.createElement('style');
    stylesheet.textContent = 'html { direction: rtl; }';
    document.head.append(stylesheet);
    try {
      renderGrid({ renderExpandedRow: showDetails });
      // The stylesheet turns the chevron of a grid marked right to left.
      expect(screen.getByRole('grid')).toHaveAttribute('data-rtl');
      expect(expandButton('Item 1').closest('[data-rtl]')).toBe(screen.getByRole('grid'));
    } finally {
      stylesheet.remove();
    }
  });

  it('leaves the chevron alone left to right', () => {
    renderGrid({ renderExpandedRow: showDetails });
    expect(screen.getByRole('grid')).not.toHaveAttribute('data-rtl');
  });
});

describe('a table inside a detail panel', () => {
  const nestedTable = (row: ItemRow) => (
    <table>
      <thead>
        <tr>
          <th tabIndex={0}>Batch</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <button type="button">Recall {row.name}</button>
          </td>
        </tr>
      </tbody>
    </table>
  );

  it("keeps the grid's one tab stop and lets focus rest inside it", async () => {
    const user = userEvent.setup();
    renderGrid({ renderExpandedRow: nestedTable, defaultExpandedRowIds: ['item-1'] });
    const grid = screen.getByRole('grid');
    const nestedHeader = screen.getByRole('columnheader', { name: 'Batch' });
    const recall = screen.getByRole('button', { name: 'Recall Item 1' });
    // The panel renders once the virtualiser has measured; its controls follow it out of the tab
    // order a microtask later.
    await waitFor(() => expect(recall).toHaveAttribute('tabindex', '-1'));
    expect(nestedHeader).toHaveAttribute('tabindex', '-1');
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);

    const panelCell = within(rowAfter(rowNamed('Item 1'))).getAllByRole('gridcell')[0];
    panelCell?.focus();
    await user.keyboard('{Enter}');
    // The nested header is the panel's first control, not one of the grid's own cells.
    expect(document.activeElement).toBe(nestedHeader);
    await user.tab();
    expect(document.activeElement).toBe(recall);
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(panelCell);
    expect(recall).toHaveAttribute('tabindex', '-1');
  });

  it('moves past a grid nested in a panel to the next row', async () => {
    const user = userEvent.setup();
    renderGrid({
      renderExpandedRow: () => (
        <DataGrid<ItemRow>
          gridId="nested-grid"
          heading="Batches"
          headingLevel={3}
          rows={makeItems(6)}
          columns={itemColumns}
          getRowId={(row) => row.id}
          hideFooter
        />
      ),
      defaultExpandedRowIds: ['item-1'],
    });
    const outerGrid = screen.getAllByRole('grid')[0] as HTMLElement;
    const outerRow = (name: string) => {
      const row = within(outerGrid)
        .getAllByRole('gridcell', { name })
        .map((cell) => cell.closest('tr') as HTMLElement)
        .find((candidate) => candidate.closest('table') === outerGrid);
      if (!row) throw new Error(`${name} is not in the outer grid`);
      return row;
    };
    cellIn(outerRow('Item 1'), 2).focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toBe(cellIn(outerRow('Item 2'), 2));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(cellIn(outerRow('Item 3'), 2));
  });
});

describe('stories', () => {
  it('the row actions story has no axe violations', async () => {
    const { container } = render(<RowActions />);
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the expandable rows story has no axe violations', async () => {
    const { container } = render(<Expandable />);
    expect(screen.getByText('Last updated')).toBeInTheDocument();
    // Items 4 and 8 are out of stock, so they have no details to show.
    expect(screen.getAllByRole('button', { name: /^Show details for / })).toHaveLength(8);
    expect(await axe(container)).toHaveNoViolations();
  });
});
