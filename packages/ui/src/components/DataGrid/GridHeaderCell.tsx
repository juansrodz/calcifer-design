import { flexRender, type Header, type RowData } from '@tanstack/react-table';
import type { DataGridFeatures } from './columns';
import styles from './DataGrid.module.css';
import type { GridCellProps } from './useGridKeyboard';

const ariaSortByDirection = { asc: 'ascending', desc: 'descending' } as const;

export interface GridHeaderCellProps<Row extends RowData> {
  header: Header<DataGridFeatures, Row, unknown>;
  /** Whether a press sorts; without it the cell still reports the column's sort. */
  sortable: boolean;
  /** Counted from 1 across every rendered column. */
  ariaColIndex: number;
  cellProps: GridCellProps;
}

/**
 * A column's header cell. The cell is the sort control: a click sorts, and so does Enter. A column
 * that cannot sort claims no sort order, whatever the sorting state says. A column the query sorts
 * but the user may not (a read-only query) reports its order and offers no control.
 */
export function GridHeaderCell<Row extends RowData>({
  header,
  sortable,
  ariaColIndex,
  cellProps,
}: GridHeaderCellProps<Row>) {
  const sortApplies = header.column.getCanSort();
  const sortDirection = sortApplies && header.column.getIsSorted();
  const canSort = sortable && sortApplies;
  return (
    <th
      scope="col"
      className={styles.headerCell}
      aria-colindex={ariaColIndex}
      aria-sort={sortDirection ? ariaSortByDirection[sortDirection] : undefined}
      data-sortable={canSort ? '' : undefined}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
      {...cellProps}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {canSort ? (
        <span
          aria-hidden="true"
          className={styles.sortIcon}
          data-direction={sortDirection || 'none'}
        />
      ) : null}
    </th>
  );
}
