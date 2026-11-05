import { flexRender, type Row as TableRow, type RowData } from '@tanstack/react-table';
import type { MouseEvent, ReactNode } from 'react';
import { ChevronRightIcon } from '../../icons/ChevronRightIcon';
import { textValueOf, type DataGridColumnDef, type DataGridFeatures } from './columns';
import styles from './DataGrid.module.css';
import { GridCheckbox } from './GridCheckbox';
import type { DataGridDensity } from './types';
import { cellControlSelector, type GridCellProps } from './useGridKeyboard';

/**
 * The row's own cell an event happened in, or null when it came from elsewhere: from a popup a
 * control portalled out of the row, or from a cell of a table nested inside one of the row's cells.
 */
function rowCellOf(event: MouseEvent<HTMLElement>): HTMLElement | null {
  let element = event.target instanceof Element ? event.target : null;
  while (element !== null && element.parentElement !== event.currentTarget) {
    element = element.parentElement;
  }
  return element instanceof HTMLTableCellElement ? element : null;
}

/**
 * Whether a mouse event on a row is a click on the row: it came from one of the row's cells, and not
 * from a control inside the cell, which has its own handler.
 */
function isRowEvent(event: MouseEvent<HTMLElement>): boolean {
  const cell = rowCellOf(event);
  if (cell === null) return false;
  const control = (event.target as Element).closest(cellControlSelector);
  return control === null || control === cell || !cell.contains(control);
}

/** The checkbox and expand cells take every click in them as a toggle, not as a row click. */
function isRowClick(event: MouseEvent<HTMLElement>): boolean {
  return isRowEvent(event) && !rowCellOf(event)?.hasAttribute('data-toggle-cell');
}

/** A compact cell is one line with an ellipsis, so its full text is the title. */
function compactTitle<Row extends RowData>(
  column: DataGridColumnDef<Row>,
  row: Row,
): string | undefined {
  const text = textValueOf(column, row);
  return text === undefined || text.trim() === '' ? undefined : text;
}

export interface GridRowCheckbox {
  label: string;
  selected: boolean;
  selectable: boolean;
  onCheckedChange: () => void;
  /** Capture-phase click handler for the checkbox cell. */
  onClickCapture: (event: MouseEvent<HTMLElement>) => void;
  /** A click on the cell around the checkbox, which toggles the row as the checkbox would. */
  onCellClick: (event: MouseEvent<HTMLElement>) => void;
}

export interface GridRowExpander {
  /** Whether this row has a detail panel; a row without one keeps an empty expand cell. */
  expandable: boolean;
  expanded: boolean;
  label: string;
  /** The id of the row's detail panel, which the expand button controls. */
  panelId: string;
  onToggle: () => void;
}

export interface GridRowProps<Row extends RowData> {
  row: TableRow<DataGridFeatures, Row>;
  /** The row's place among the grid's entries; its keyboard row is one more. */
  entryIndex: number;
  measureRef: (element: HTMLTableRowElement | null) => void;
  density: DataGridDensity;
  /** The columns the grid renders before the row's own cells. */
  columnOffset: number;
  highlighted: boolean;
  /** Clicks on the row do something, so it shows a pointer. */
  clickable: boolean;
  /** The checkbox column's cell; absent without checkbox selection. */
  checkbox?: GridRowCheckbox;
  /** The expand column's cell; absent without expandable rows. */
  expander?: GridRowExpander;
  /** Fills the row actions column at the end; absent without one. */
  renderRowActions?: (row: Row) => ReactNode;
  getCellProps: (rowIndex: number, columnIndex: number, columnSpan?: number) => GridCellProps;
  /** The handlers hear only clicks on the row itself, not on its cells' controls. */
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onDoubleClick?: (event: MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * One body row: the checkbox cell when rows are selectable, the expand cell when they expand, the
 * row's own cells, then the row actions cell.
 */
export function GridRow<Row extends RowData>({
  row,
  entryIndex,
  measureRef,
  density,
  columnOffset,
  highlighted,
  clickable,
  checkbox,
  expander,
  renderRowActions,
  getCellProps,
  onClick,
  onDoubleClick,
  onContextMenu,
}: GridRowProps<Row>) {
  const rowIndex = entryIndex + 1;
  const selecting = checkbox !== undefined;
  const expandColumn = selecting ? 1 : 0;
  const cells = row.getAllCells();
  const onlyWhen =
    (accepts: (event: MouseEvent<HTMLElement>) => boolean) =>
    (handler: (event: MouseEvent<HTMLElement>) => void) =>
    (event: MouseEvent<HTMLElement>) => {
      if (accepts(event)) handler(event);
    };
  const onlyRowClicks = onlyWhen(isRowClick);
  return (
    <tr
      ref={measureRef}
      data-index={entryIndex}
      className={styles.row}
      aria-rowindex={rowIndex + 1}
      // With checkboxes aria-selected is the selection and the highlight is the current row;
      // without them the highlight is the only selection there is.
      aria-selected={
        selecting ? (checkbox.selectable ? checkbox.selected : undefined) : highlighted || undefined
      }
      aria-current={selecting && highlighted ? 'true' : undefined}
      data-highlighted={highlighted ? '' : undefined}
      data-clickable={clickable ? '' : undefined}
      onClick={onlyRowClicks(onClick)}
      onDoubleClick={onDoubleClick ? onlyRowClicks(onDoubleClick) : undefined}
      onContextMenu={onContextMenu ? onlyWhen(isRowEvent)(onContextMenu) : undefined}
    >
      {checkbox ? (
        <td
          role="gridcell"
          className={`${styles.cell} ${styles.pinnedCell} ${styles.selectCell}`}
          aria-colindex={1}
          data-toggle-cell=""
          onClickCapture={checkbox.onClickCapture}
          onClick={(event) => {
            // The checkbox handles clicks on itself.
            if (event.target === event.currentTarget) checkbox.onCellClick(event);
          }}
          {...getCellProps(rowIndex, 0)}
        >
          <GridCheckbox
            label={checkbox.label}
            checked={checkbox.selected}
            disabled={!checkbox.selectable}
            onCheckedChange={checkbox.onCheckedChange}
            tabIndex={-1}
          />
        </td>
      ) : null}
      {expander ? (
        <td
          role="gridcell"
          className={`${styles.cell} ${styles.pinnedCell} ${styles.expandCell}`}
          aria-colindex={expandColumn + 1}
          data-toggle-cell={expander.expandable ? '' : undefined}
          // Clicks on the button land here too: one handler for the cell and its button.
          onClick={expander.expandable ? expander.onToggle : undefined}
          {...getCellProps(rowIndex, expandColumn)}
        >
          {expander.expandable ? (
            <button
              type="button"
              className={styles.expandButton}
              aria-label={expander.label}
              aria-expanded={expander.expanded}
              // Only an open panel exists to point at.
              aria-controls={expander.expanded ? expander.panelId : undefined}
              tabIndex={-1}
            >
              <ChevronRightIcon />
            </button>
          ) : null}
        </td>
      ) : null}
      {cells.map((cell, columnIndex) => (
        <td
          key={cell.id}
          role="gridcell"
          className={styles.cell}
          aria-colindex={columnIndex + 1 + columnOffset}
          title={
            density === 'compact'
              ? compactTitle(cell.column.columnDef as DataGridColumnDef<Row>, row.original)
              : undefined
          }
          {...getCellProps(rowIndex, columnIndex + columnOffset)}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
      {renderRowActions ? (
        <td
          role="gridcell"
          className={`${styles.cell} ${styles.pinnedCell} ${styles.actionsCell}`}
          aria-colindex={columnOffset + cells.length + 1}
          {...getCellProps(rowIndex, columnOffset + cells.length)}
        >
          {renderRowActions(row.original)}
        </td>
      ) : null}
    </tr>
  );
}

export interface GridDetailRowProps {
  /** The panel's place among the grid's entries; its keyboard row is one more. */
  entryIndex: number;
  measureRef: (element: HTMLTableRowElement | null) => void;
  columnCount: number;
  panelId: string;
  getCellProps: GridRowProps<RowData>['getCellProps'];
  children: ReactNode;
}

/** An expanded row's detail panel: one cell across every column, measured like any row. */
export function GridDetailRow({
  entryIndex,
  measureRef,
  columnCount,
  panelId,
  getCellProps,
  children,
}: GridDetailRowProps) {
  const rowIndex = entryIndex + 1;
  return (
    <tr
      ref={measureRef}
      data-index={entryIndex}
      className={styles.detailRow}
      aria-rowindex={rowIndex + 1}
    >
      <td
        id={panelId}
        role="gridcell"
        className={styles.detailCell}
        colSpan={columnCount}
        aria-colindex={1}
        {...getCellProps(rowIndex, 0, columnCount)}
      >
        {children}
      </td>
    </tr>
  );
}
