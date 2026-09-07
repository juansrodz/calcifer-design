import {
  createColumnHelper as createTanStackColumnHelper,
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef as TanStackColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import { useId, useState } from 'react';
import type { BreakpointName } from '@calcifer/tokens';
import { minWidth, useMediaQuery } from '../../hooks/useMediaQuery';
import styles from './DataTable.module.css';

// v9 registers row models and sorting behind an explicit feature set rather
// than bundling everything by default (see the package's own
// skills/migrate-v8-to-v9/SKILL.md). This table only ever needs sorting, so
// that is the only feature registered. Kept module-level and un-exported:
// consumers see only the `createColumnHelper`/`ColumnDef`/`SortingState`
// surface the brief specifies, never the `features` object itself.
//
// The default per-column `sortFn: 'auto'` resolves to `alphanumeric`, `text`, or
// `datetime` by inspecting the column's values, but only if those functions are
// registered here; otherwise it logs a dev warning and falls back to a raw `<`/`>`
// compare, which sorts multi-digit version strings and mixed-case names wrong.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime },
});

export type ColumnDef<Row extends RowData, Value = unknown> = TanStackColumnDef<
  typeof features,
  Row,
  Value
>;
export type { SortingState };

/**
 * Thin wrapper so consumers call `createColumnHelper<Row>()` exactly as they would
 * against the v8 API.
 *
 * Build the resulting column array with `columnHelper.columns([...])`, not a plain
 * array literal: under v9's feature-based typing, wrapping the array through the
 * helper is what preserves each individual column's `TValue`, rather than widening
 * every column to the union of all of them.
 */
export function createColumnHelper<Row extends RowData>() {
  return createTanStackColumnHelper<typeof features, Row>();
}

export interface DataTableProps<Row extends RowData> {
  caption: string;
  /** Build with `columnHelper.columns([...])` (see `createColumnHelper` above), not a plain array literal. */
  columns: ColumnDef<Row, unknown>[];
  data: Row[];
  getRowId?: (row: Row) => string;
  initialSort?: SortingState;
  /** Below this breakpoint, rows render stacked with header labels. */
  stackBelow?: BreakpointName;
  /** Drop the wrapper's own border, radius and surface when a panel already frames it. */
  bare?: boolean;
  /** Keep the caption for assistive tech but hide it visually (the panel shows the title). */
  hideCaption?: boolean;
}

const ariaSortByDirection = { asc: 'ascending', desc: 'descending' } as const;

export function DataTable<Row extends RowData>({
  caption,
  columns,
  data,
  getRowId,
  initialSort = [],
  stackBelow,
  bare = false,
  hideCaption = false,
}: DataTableProps<Row>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  const captionId = useId();
  // `useMediaQuery` must run unconditionally on every render (rules of hooks), so when
  // `stackBelow` is undefined it still needs a query to evaluate. `(min-width: 0px)` is
  // an always-true sentinel deliberately outside `@calcifer/tokens`' breakpoint scale:
  // it never matches a real breakpoint and is never emitted into any CSS.
  const isWide = useMediaQuery(stackBelow ? minWidth(stackBelow) : '(min-width: 0px)');
  const stacked = Boolean(stackBelow) && !isWide;

  const table = useTable({
    features,
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId,
  });

  return (
    <div
      className={styles.scroll}
      data-bare={bare ? '' : undefined}
      role="region"
      aria-labelledby={captionId}
      // A scrollable region must be a keyboard stop (WCAG 2.1.1); "region" is not in this
      // lint rule's interactive-role list even though the scroll affordance is interactive.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      <table className={styles.table} data-stacked={stacked ? '' : undefined}>
        <caption
          id={captionId}
          className={styles.caption}
          data-hidden={hideCaption ? '' : undefined}
        >
          {caption}
        </caption>
        <thead className={styles.head}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted();
                const canSort = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={styles.headerCell}
                    aria-sort={sortDirection ? ariaSortByDirection[sortDirection] : undefined}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span
                          aria-hidden="true"
                          className={styles.sortIcon}
                          data-direction={sortDirection || 'none'}
                        />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={styles.row}>
              {row.getAllCells().map((cell) => {
                const header = cell.column.columnDef.header;
                const headerLabel = typeof header === 'string' ? header : cell.column.id;
                return (
                  <td key={cell.id} className={styles.cell} data-label={headerLabel}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
