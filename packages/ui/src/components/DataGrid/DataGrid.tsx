import { flexRender, useTable, type RowData, type SortingState } from '@tanstack/react-table';
import { useId, useState, type ElementType } from 'react';
import { dataGridFeatures } from './columns';
import styles from './DataGrid.module.css';
import { defaultDataGridLabels } from './labels';
import type { DataGridProps } from './types';

const ariaSortByDirection = { asc: 'ascending', desc: 'descending' } as const;

const emptyCellText = '—';

function formatCellValue(value: unknown): string | null {
  if (value === null || value === undefined) return emptyCellText;
  const text = typeof value === 'string' ? value : String(value);
  return text.trim() === '' ? emptyCellText : text;
}

export function DataGrid<Row extends RowData>({
  heading,
  headingLevel = 2,
  rows,
  columns,
  getRowId,
  actions,
  initialSorting = [],
  enableSorting = true,
  multiSort = false,
  hideFooter = false,
  labels,
}: DataGridProps<Row>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const headingId = useId();
  const resolvedLabels = { ...defaultDataGridLabels, ...labels };
  const HeadingTag: ElementType = `h${headingLevel}`;

  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId,
    state: { sorting },
    onSortingChange: setSorting,
    enableSorting,
    enableMultiSort: multiSort,
    defaultColumn: {
      // Cycle ascending, descending, off for every type; TanStack would start numbers descending.
      sortDescFirst: false,
      cell: (context) => (context.column.accessorFn ? formatCellValue(context.getValue()) : null),
    },
  });

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <header className={styles.header}>
        <HeadingTag id={headingId} className={styles.heading}>
          {heading}
        </HeadingTag>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={styles.scroll} data-grid-scroll="">
        <table className={styles.table} role="grid" aria-labelledby={headingId}>
          <thead className={styles.head}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, columnIndex) => {
                  const sortDirection = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    // The header cell is the sort control; keyboard operation arrives with
                    // cell navigation, which makes headers focusable.
                    <th
                      key={header.id}
                      scope="col"
                      className={styles.headerCell}
                      aria-colindex={columnIndex + 1}
                      aria-sort={sortDirection ? ariaSortByDirection[sortDirection] : undefined}
                      data-sortable={canSort ? '' : undefined}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
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
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={styles.row}>
                {row.getAllCells().map((cell, columnIndex) => (
                  <td
                    key={cell.id}
                    role="gridcell"
                    className={styles.cell}
                    aria-colindex={columnIndex + 1}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hideFooter ? null : (
        <footer className={styles.footer}>{resolvedLabels.rowCount(rows.length)}</footer>
      )}
    </section>
  );
}
