import { flexRender, useTable, type RowData, type SortingState } from '@tanstack/react-table';
import { useVirtualizer, type Range } from '@tanstack/react-virtual';
import { useId, useRef, useState, type CSSProperties, type ElementType } from 'react';
import { RefreshIcon } from '../../icons/RefreshIcon';
import { IconButton } from '../IconButton/IconButton';
import { LiveRegion } from '../LiveRegion/LiveRegion';
import { Spinner } from '../Spinner/Spinner';
import { Toolbar, ToolbarButton } from '../Toolbar/Toolbar';
import { dataGridFeatures, textValueOf, type DataGridColumnDef } from './columns';
import styles from './DataGrid.module.css';
import { defaultDataGridLabels } from './labels';
import type { DataGridProps } from './types';
import { useGridEntries } from './useGridEntries';

const ariaSortByDirection = { asc: 'ascending', desc: 'descending' } as const;

const emptyCellText = '—';

const estimatedRowHeight = { comfortable: 40, compact: 34 } as const;
const overscanRows = 8;
const noExpandedIds: ReadonlySet<string> = new Set();
const noPinnedIndexes: ReadonlySet<number> = new Set();

/** The rows in view plus the overscan, plus any pinned entries (the focused one stays mounted). */
function extractRange(range: Range, pinnedIndexes: ReadonlySet<number>): number[] {
  const start = Math.max(range.startIndex - range.overscan, 0);
  const end = Math.min(range.endIndex + range.overscan, range.count - 1);
  const indexes = new Set<number>();
  for (let index = start; index <= end; index += 1) indexes.add(index);
  for (const pinnedIndex of pinnedIndexes) {
    if (pinnedIndex >= 0 && pinnedIndex < range.count) indexes.add(pinnedIndex);
  }
  return [...indexes].sort((first, second) => first - second);
}

function formatCellValue(value: unknown): string | null {
  if (value === null || value === undefined) return emptyCellText;
  const text = typeof value === 'string' ? value : String(value);
  return text.trim() === '' ? emptyCellText : text;
}

/** A compact cell is one line with an ellipsis, so its full text is the title. */
function compactTitle<Row extends RowData>(
  column: DataGridColumnDef<Row>,
  row: Row,
): string | undefined {
  const text = textValueOf(column, row);
  return text === undefined || text.trim() === '' ? undefined : text;
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
  density = 'comfortable',
  maxHeight,
  fill = false,
  hideFooter = false,
  loading = false,
  emptyState,
  onRefresh,
  refreshing = false,
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRows = table.getRowModel().rows;
  const entries = useGridEntries(tableRows, noExpandedIds);
  // The virtualiser is read only in this render and never handed to a memoised child.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight[density],
    overscan: overscanRows,
    initialRect: {
      width: scrollRef.current?.clientWidth ?? 0,
      height: scrollRef.current?.clientHeight ?? 0,
    },
    // Task 4 passes the focused entry here so it stays mounted while scrolled out of view.
    rangeExtractor: (range) => extractRange(range, noPinnedIndexes),
  });
  const virtualItems = virtualizer.getVirtualItems();
  const firstItem = virtualItems[0];
  const lastItem = virtualItems[virtualItems.length - 1];
  const topSpacerHeight = firstItem ? firstItem.start : 0;
  const bottomSpacerHeight = lastItem ? virtualizer.getTotalSize() - lastItem.end : 0;
  const columnCount = table.getAllLeafColumns().length;
  // A card that fills its parent is sized by it, so a maximum height has no place there.
  const scrollStyle: CSSProperties | undefined = maxHeight && !fill ? { maxHeight } : undefined;
  const stateKind = loading ? 'loading' : entries.length === 0 ? 'empty' : null;
  // One region that is always mounted: a live region announces reliably only when its text
  // changes, not when it appears with its text.
  const stateAnnouncement =
    stateKind === 'loading'
      ? resolvedLabels.loading
      : stateKind === 'empty'
        ? resolvedLabels.empty
        : '';

  return (
    <section
      className={fill ? `${styles.card} ${styles.fill}` : styles.card}
      aria-labelledby={headingId}
    >
      <header className={styles.header}>
        <HeadingTag id={headingId} className={styles.heading}>
          {heading}
        </HeadingTag>
        {onRefresh || actions ? (
          <div className={styles.cluster}>
            {onRefresh ? (
              <Toolbar aria-label={resolvedLabels.toolbar}>
                <ToolbarButton
                  loading={refreshing}
                  onClick={onRefresh}
                  render={
                    <IconButton label={resolvedLabels.refresh} size="sm">
                      <RefreshIcon />
                    </IconButton>
                  }
                />
              </Toolbar>
            ) : null}
            {actions ? <div className={styles.actions}>{actions}</div> : null}
          </div>
        ) : null}
      </header>
      <LiveRegion message={stateAnnouncement} politeness="polite" />
      <div
        ref={scrollRef}
        className={fill ? `${styles.scroll} ${styles.scrollFill}` : styles.scroll}
        style={scrollStyle}
        data-grid-scroll=""
      >
        <table
          className={styles.table}
          role="grid"
          aria-labelledby={headingId}
          aria-rowcount={stateKind ? 2 : entries.length + 1}
          aria-busy={loading || undefined}
          data-density={density}
        >
          <thead className={styles.head}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} aria-rowindex={1}>
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
            {stateKind ? (
              <tr aria-rowindex={2}>
                <td
                  role="gridcell"
                  className={styles.stateCell}
                  colSpan={columnCount}
                  aria-colindex={1}
                >
                  {stateKind === 'loading' ? (
                    <div className={styles.state} aria-hidden="true">
                      <Spinner size="md" />
                      {resolvedLabels.loading}
                    </div>
                  ) : (
                    (emptyState ?? (
                      <div className={styles.state} aria-hidden="true">
                        {resolvedLabels.empty}
                      </div>
                    ))
                  )}
                </td>
              </tr>
            ) : null}
            {!stateKind && topSpacerHeight > 0 ? (
              <tr aria-hidden="true">
                <td
                  className={styles.spacerCell}
                  colSpan={columnCount}
                  style={{ height: topSpacerHeight }}
                />
              </tr>
            ) : null}
            {(stateKind ? [] : virtualItems).map((virtualItem) => {
              const entry = entries[virtualItem.index];
              if (!entry || entry.kind !== 'row') return null;
              const { row } = entry;
              return (
                <tr
                  key={row.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  className={styles.row}
                  aria-rowindex={virtualItem.index + 2}
                >
                  {row.getAllCells().map((cell, columnIndex) => (
                    <td
                      key={cell.id}
                      role="gridcell"
                      className={styles.cell}
                      aria-colindex={columnIndex + 1}
                      title={
                        density === 'compact'
                          ? compactTitle(
                              cell.column.columnDef as DataGridColumnDef<Row>,
                              row.original,
                            )
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {!stateKind && bottomSpacerHeight > 0 ? (
              <tr aria-hidden="true">
                <td
                  className={styles.spacerCell}
                  colSpan={columnCount}
                  style={{ height: bottomSpacerHeight }}
                />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {hideFooter ? null : (
        <footer className={styles.footer}>{resolvedLabels.rowCount(rows.length)}</footer>
      )}
    </section>
  );
}
