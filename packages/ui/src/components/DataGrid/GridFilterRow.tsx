import type { Header, RowData } from '@tanstack/react-table';
import type { DataGridColumnDef, DataGridColumnFilter, DataGridFeatures } from './columns';
import styles from './DataGrid.module.css';
import { GridChoiceFilter } from './GridChoiceFilter';
import { GridTextFilter } from './GridTextFilter';
import type { DataGridLabels } from './labels';
import { columnIdOf, columnNameOf } from './query';
import type { DataGridFilterValue } from './types';
import type { GetCellProps } from './useGridKeyboard';
import type { GridQuery } from './useGridQuery';

/** The strip's keyboard row: the one after the header. */
const stripRow = 1;

/** A text filter's value in the query, which normalising leaves a string for a text filter. */
function textFilterValueOf(value: DataGridFilterValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

interface ColumnFilterProps {
  filter: DataGridColumnFilter;
  /** "Filter by <column>". */
  label: string;
  value: DataGridFilterValue | undefined;
  onValueChange: (value: DataGridFilterValue | undefined) => void;
  labels: DataGridLabels;
}

/** The control for the filter a column declares: a text field, or a select or multi-select. */
function ColumnFilter({ filter, label, value, onValueChange, labels }: ColumnFilterProps) {
  if (filter.type === 'text') {
    return (
      <GridTextFilter
        label={label}
        value={textFilterValueOf(value)}
        onValueChange={onValueChange}
      />
    );
  }
  return (
    <GridChoiceFilter
      label={label}
      options={filter.options}
      multiple={filter.type === 'multiSelect'}
      value={value}
      onValueChange={onValueChange}
      allLabel={labels.filterAll}
      selectedCountLabel={labels.filterSelectedCount}
      noOptionsLabel={labels.filterNoOptions}
    />
  );
}

export interface GridFilterRowProps<Row extends RowData> {
  headers: Header<DataGridFeatures, Row, unknown>[];
  columnCount: number;
  /** The columns the grid renders before the columns' own cells. */
  columnOffset: number;
  /** Whether the row actions column follows the columns' own cells. */
  hasRowActions: boolean;
  query: GridQuery;
  labels: DataGridLabels;
  getCellProps: GetCellProps;
}

/**
 * The filter strip, the second row of the header band and keyboard row 1: a cell for every column,
 * holding the column's text or choice filter, or nothing for the checkbox, expand and row actions
 * columns and for columns without a filter.
 */
export function GridFilterRow<Row extends RowData>({
  headers,
  columnCount,
  columnOffset,
  hasRowActions,
  query,
  labels,
  getCellProps,
}: GridFilterRowProps<Row>) {
  return (
    <tr aria-rowindex={stripRow + 1}>
      {Array.from({ length: columnOffset }, (_unused, columnIndex) => (
        <td
          key={`leading-${columnIndex}`}
          role="gridcell"
          className={`${styles.filterCell} ${styles.pinnedFilter} ${styles.leadingFilter}`}
          aria-colindex={columnIndex + 1}
          {...getCellProps(stripRow, columnIndex)}
        />
      ))}
      {headers.map((header, index) => {
        const columnIndex = index + columnOffset;
        const column = header.column.columnDef as DataGridColumnDef<Row>;
        const columnId = columnIdOf(column);
        return (
          <td
            key={header.id}
            role="gridcell"
            className={styles.filterCell}
            aria-colindex={columnIndex + 1}
            {...getCellProps(stripRow, columnIndex)}
          >
            {column.filter !== undefined && columnId !== undefined ? (
              <ColumnFilter
                filter={column.filter}
                label={labels.filterBy(columnNameOf(column))}
                value={query.query.filters[columnId]}
                onValueChange={(value) => query.setFilter(columnId, value)}
                labels={labels}
              />
            ) : null}
          </td>
        );
      })}
      {hasRowActions ? (
        <td
          role="gridcell"
          className={`${styles.filterCell} ${styles.pinnedFilter} ${styles.actionsFilter}`}
          aria-colindex={columnCount}
          {...getCellProps(stripRow, columnCount - 1)}
        />
      ) : null}
    </tr>
  );
}
