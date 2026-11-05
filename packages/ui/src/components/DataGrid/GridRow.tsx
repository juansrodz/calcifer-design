import { flexRender, type Row as TableRow, type RowData } from '@tanstack/react-table';
import type { MouseEvent } from 'react';
import { textValueOf, type DataGridColumnDef, type DataGridFeatures } from './columns';
import styles from './DataGrid.module.css';
import { GridCheckbox } from './GridCheckbox';
import type { DataGridDensity } from './types';
import { cellControlSelector, type GridCellProps } from './useGridKeyboard';

/**
 * Whether a mouse event on a row is a click on the row: it came from the row's own DOM (not a popup
 * a control portalled elsewhere), and not from a control inside a cell, which has its own handler.
 */
function isRowEvent(event: MouseEvent<HTMLElement>): boolean {
  const { target, currentTarget } = event;
  if (!(target instanceof Element) || !currentTarget.contains(target)) return false;
  const cell = target.closest('td');
  if (cell === null) return false;
  const control = target.closest(cellControlSelector);
  return control === null || control === cell || !cell.contains(control);
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
  getCellProps: (rowIndex: number, columnIndex: number) => GridCellProps;
  /** The handlers hear only clicks on the row itself, not on its cells' controls. */
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onDoubleClick?: (event: MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
}

/** One body row: the checkbox cell when rows are selectable, then the row's own cells. */
export function GridRow<Row extends RowData>({
  row,
  entryIndex,
  measureRef,
  density,
  columnOffset,
  highlighted,
  clickable,
  checkbox,
  getCellProps,
  onClick,
  onDoubleClick,
  onContextMenu,
}: GridRowProps<Row>) {
  const rowIndex = entryIndex + 1;
  const selecting = checkbox !== undefined;
  const onlyRowEvents =
    (handler: (event: MouseEvent<HTMLElement>) => void) => (event: MouseEvent<HTMLElement>) => {
      if (isRowEvent(event)) handler(event);
    };
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
      onClick={onlyRowEvents(onClick)}
      onDoubleClick={onDoubleClick ? onlyRowEvents(onDoubleClick) : undefined}
      onContextMenu={onContextMenu ? onlyRowEvents(onContextMenu) : undefined}
    >
      {checkbox ? (
        <td
          role="gridcell"
          className={`${styles.cell} ${styles.selectCell}`}
          aria-colindex={1}
          onClickCapture={checkbox.onClickCapture}
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
      {row.getAllCells().map((cell, columnIndex) => (
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
    </tr>
  );
}
