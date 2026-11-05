import type { Header, RowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import a11yStyles from '../../styles/a11y.module.css';
import type { DataGridFeatures } from './columns';
import styles from './DataGrid.module.css';
import { GridCheckbox } from './GridCheckbox';
import { GridHeaderCell } from './GridHeaderCell';
import type { GetCellProps } from './useGridKeyboard';

function isEmptyNode(node: ReactNode): boolean {
  return node === undefined || node === null || node === false || node === '';
}

export interface GridHeaderSelectAll {
  label: string;
  checked: boolean;
  /** Some rows are selected, but not all. */
  indeterminate: boolean;
  disabled: boolean;
  onCheckedChange: () => void;
}

export interface GridHeaderRowActions {
  /** The consumer's header for the column; when it is empty, `label` names the column unseen. */
  header: ReactNode;
  label: string;
}

export interface GridHeaderRowProps<Row extends RowData> {
  headers: Header<DataGridFeatures, Row, unknown>[];
  columnCount: number;
  /** The columns the grid renders before the row's own cells. */
  columnOffset: number;
  /** The checkbox column's select-all cell; absent without checkbox selection. */
  selectAll?: GridHeaderSelectAll;
  /** The expand column's unseen name; absent without expandable rows. */
  expandLabel?: string;
  /** The row actions column's header cell; absent without one. */
  rowActions?: GridHeaderRowActions;
  getCellProps: GetCellProps;
}

/**
 * The header row, keyboard row 0: the select-all cell when rows are selectable, the expand column's
 * header when they expand, the columns' own headers, then the row actions header.
 */
export function GridHeaderRow<Row extends RowData>({
  headers,
  columnCount,
  columnOffset,
  selectAll,
  expandLabel,
  rowActions,
  getCellProps,
}: GridHeaderRowProps<Row>) {
  const expandColumn = selectAll ? 1 : 0;
  return (
    <tr aria-rowindex={1}>
      {selectAll ? (
        <th
          scope="col"
          className={`${styles.headerCell} ${styles.pinnedHeader} ${styles.selectHeader}`}
          aria-colindex={1}
          {...getCellProps(0, 0)}
        >
          <GridCheckbox
            label={selectAll.label}
            checked={selectAll.checked}
            indeterminate={selectAll.indeterminate}
            disabled={selectAll.disabled}
            onCheckedChange={selectAll.onCheckedChange}
            tabIndex={-1}
          />
        </th>
      ) : null}
      {expandLabel !== undefined ? (
        <th
          scope="col"
          className={`${styles.headerCell} ${styles.pinnedHeader} ${styles.expandHeader}`}
          aria-colindex={expandColumn + 1}
          {...getCellProps(0, expandColumn)}
        >
          <span className={a11yStyles.visuallyHidden}>{expandLabel}</span>
        </th>
      ) : null}
      {headers.map((header, columnIndex) => (
        <GridHeaderCell
          key={header.id}
          header={header}
          ariaColIndex={columnIndex + 1 + columnOffset}
          cellProps={getCellProps(0, columnIndex + columnOffset)}
        />
      ))}
      {rowActions ? (
        <th
          scope="col"
          className={`${styles.headerCell} ${styles.pinnedHeader} ${styles.actionsHeader}`}
          aria-colindex={columnCount}
          {...getCellProps(0, columnCount - 1)}
        >
          {isEmptyNode(rowActions.header) ? (
            <span className={a11yStyles.visuallyHidden}>{rowActions.label}</span>
          ) : (
            rowActions.header
          )}
        </th>
      ) : null}
    </tr>
  );
}
