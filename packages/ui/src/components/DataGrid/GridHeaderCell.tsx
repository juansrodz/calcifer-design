import { flexRender, type Header, type RowData } from '@tanstack/react-table';
import type { DataGridFeatures } from './columns';
import styles from './DataGrid.module.css';
import type { GridCellProps } from './useGridKeyboard';

const ariaSortByDirection = { asc: 'ascending', desc: 'descending' } as const;

export interface GridHeaderCellProps<Row extends RowData> {
  header: Header<DataGridFeatures, Row, unknown>;
  /** Counted from 1 across every rendered column. */
  ariaColIndex: number;
  cellProps: GridCellProps;
}

/**
 * A column's header cell. The cell is the sort control: a click sorts, and so does Enter. A column
 * that cannot sort claims no sort order, whatever the sorting state says.
 */
export function GridHeaderCell<Row extends RowData>({
  header,
  ariaColIndex,
  cellProps,
}: GridHeaderCellProps<Row>) {
  const canSort = header.column.getCanSort();
  const sortDirection = canSort && header.column.getIsSorted();
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
