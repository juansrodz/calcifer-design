import { useTable, type RowData, type SortingState } from '@tanstack/react-table';
import { useVirtualizer, type Range } from '@tanstack/react-virtual';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { RefreshIcon } from '../../icons/RefreshIcon';
import { IconButton } from '../IconButton/IconButton';
import { LiveRegion } from '../LiveRegion/LiveRegion';
import { Spinner } from '../Spinner/Spinner';
import { Toolbar, ToolbarButton } from '../Toolbar/Toolbar';
import { dataGridFeatures, textValueOf, type DataGridColumnDef } from './columns';
import styles from './DataGrid.module.css';
import { GridCheckbox } from './GridCheckbox';
import { GridHeaderCell } from './GridHeaderCell';
import { GridRow } from './GridRow';
import { defaultDataGridLabels } from './labels';
import type { DataGridProps, DataGridRowEvent } from './types';
import { useGridEntries } from './useGridEntries';
import { useGridHighlight } from './useGridHighlight';
import { useGridMetrics } from './useGridMetrics';
import { cellControlSelector, useGridKeyboard } from './useGridKeyboard';
import { useRowSelection, type RowSelection } from './useRowSelection';

const emptyCellText = '—';

const estimatedRowHeight = { comfortable: 40, compact: 34 } as const;
const overscanRows = 8;
const noExpandedIds: ReadonlySet<string> = new Set();

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

function spacerRow(key: string, height: number, columnCount: number): ReactNode {
  return (
    <tr key={key} aria-hidden="true">
      <td className={styles.spacerCell} colSpan={columnCount} style={{ height }} />
    </tr>
  );
}

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
  getRowLabel,
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
  highlightOnClick = false,
  highlightedRowId,
  onHighlightChange,
  selectionMode = 'none',
  selectedRowIds,
  defaultSelectedRowIds,
  onSelectedRowIdsChange,
  isRowSelectable,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  labels,
}: DataGridProps<Row>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const { highlightedId, setHighlightedId } = useGridHighlight({
    rows,
    getRowId,
    loading,
    highlightedRowId,
    onHighlightChange,
  });
  const selecting = selectionMode === 'multiple';
  // The checkbox column is not a TanStack column; it shifts every cell's column position by one.
  const columnOffset = selecting ? 1 : 0;
  // Annotated: the table needs the selection, and the callback below needs the table's entries.
  const selection: RowSelection = useRowSelection({
    enabled: selecting,
    rows,
    getRowId,
    isRowSelectable,
    loading,
    selectedRowIds,
    defaultSelectedRowIds,
    onSelectedRowIdsChange,
    // Called from event handlers only, after the entries below exist.
    getDisplayedRowIds: () =>
      entries.flatMap((entry) => (entry.kind === 'row' ? [entry.row.id] : [])),
  });
  const headingId = useId();
  const resolvedLabels = { ...defaultDataGridLabels, ...labels };
  const HeadingTag: ElementType = `h${headingLevel}`;

  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId,
    state: { sorting, rowSelection: selection.rowSelection },
    onSortingChange: (updater) => {
      setSorting(updater);
      // Rows that move under the selection would make it hard to see what it covers.
      selection.clear();
    },
    enableRowSelection: (row) => isRowSelectable?.(row.original) ?? true,
    enableSorting,
    enableMultiSort: multiSort,
    defaultColumn: {
      // Cycle ascending, descending, off for every type; TanStack would start numbers descending.
      sortDescFirst: false,
      cell: (context) => (context.column.accessorFn ? formatCellValue(context.getValue()) : null),
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableSectionElement>(null);
  const { viewportHeight, headerHeight } = useGridMetrics(scrollRef, headRef);
  const tableRows = table.getRowModel().rows;
  const entries = useGridEntries(tableRows, noExpandedIds);
  const leafHeaders = table.getHeaderGroups()[0]?.headers ?? [];
  const leafColumns = table.getAllLeafColumns();
  const columnCount = leafColumns.length + columnOffset;
  const stateKind = loading ? 'loading' : entries.length === 0 ? 'empty' : null;
  const rowHeight = estimatedRowHeight[density];

  /** A click, or Enter on a cell: the consumer hears of it, and the highlight toggles. */
  const clickRow = (row: { id: string; original: Row }, event: DataGridRowEvent) => {
    onRowClick?.(row.original, event);
    if (!highlightOnClick) return;
    setHighlightedId(highlightedId === row.id ? null : row.id);
  };

  /** Shift, Ctrl or Cmd with a click selects; a plain click is the row's own. */
  const handleRowClick = (row: { id: string; original: Row }, event: MouseEvent<HTMLElement>) => {
    const selectsRow = event.shiftKey || event.ctrlKey || event.metaKey;
    if (selecting && selectsRow && selection.isSelectable(row.id)) {
      selection.toggleRow(row.id, { range: event.shiftKey });
      return;
    }
    clickRow(row, event);
  };

  const rowLabelOf = (row: { id: string; original: Row }): string => {
    if (getRowLabel) return getRowLabel(row.original);
    const firstColumn = leafColumns[0];
    const text = firstColumn
      ? textValueOf(firstColumn.columnDef as DataGridColumnDef<Row>, row.original)
      : undefined;
    return text ?? row.id;
  };

  const handleActivate = (
    rowIndex: number,
    columnIndex: number,
    event: KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key === ' ') {
      // In the checkbox column Space toggles the row, and on its header select-all.
      if (!selecting) return;
      if (rowIndex === 0) {
        if (columnIndex !== 0) return;
        event.preventDefault();
        selection.toggleAll();
        return;
      }
      const entry = entries[rowIndex - 1];
      if (entry?.kind !== 'row' || !selection.isSelectable(entry.row.id)) return;
      event.preventDefault();
      selection.toggleRow(entry.row.id, { range: event.shiftKey });
      return;
    }
    if (event.key !== 'Enter') return;
    if (rowIndex === 0) {
      const column = leafHeaders[columnIndex - columnOffset]?.column;
      if (column?.getCanSort()) {
        event.preventDefault();
        column.getToggleSortingHandler()?.(event);
      }
      return;
    }
    const entry = entries[rowIndex - 1];
    // A cell with controls is entered instead; that is the hook's part.
    if (entry?.kind !== 'row' || event.currentTarget.querySelector(cellControlSelector)) return;
    if (onRowClick || highlightOnClick) {
      event.preventDefault();
      clickRow(entry.row, event);
    }
  };

  // The cell a key press opened the context menu on, until its echo arrives or a pointer presses.
  const keyboardContextMenuCellRef = useRef<HTMLElement | null>(null);

  const handleContextMenu = (
    rowIndex: number,
    _columnIndex: number,
    event: KeyboardEvent<HTMLElement>,
  ) => {
    const entry = entries[rowIndex - 1];
    if (entry?.kind !== 'row' || !onRowContextMenu) return;
    event.preventDefault();
    // Some browsers follow this key with a contextmenu event of their own on the same cell.
    keyboardContextMenuCellRef.current = event.currentTarget;
    onRowContextMenu(entry.row.original, event);
  };

  const keyboard = useGridKeyboard({
    rowCount: stateKind ? 1 : entries.length + 1,
    columnCount,
    pageSize: Math.max(1, Math.floor((viewportHeight - headerHeight) / rowHeight)),
    onActivate: handleActivate,
    onContextMenu: handleContextMenu,
    // Called from key handlers only, after the virtualiser below exists.
    scrollToEntry: (entryIndex) => virtualizer.scrollToIndex(entryIndex),
  });
  const focusedEntryIndex = keyboard.focusedCell.rowIndex - 1;
  const pinnedIndexes = useMemo(
    () => new Set(focusedEntryIndex >= 0 ? [focusedEntryIndex] : []),
    [focusedEntryIndex],
  );

  // Measured heights follow their row when a sort moves it. A new function would make the
  // virtualiser rebuild its measurements, so this changes only when the entries do.
  const getItemKey = useCallback(
    (index: number) => {
      const entry = entries[index];
      return entry ? `${entry.kind}:${entry.row.id}` : index;
    },
    [entries],
  );

  // The virtualiser is read only in this render and never handed to a memoised child.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    getItemKey,
    overscan: overscanRows,
    initialRect: {
      width: scrollRef.current?.clientWidth ?? 0,
      height: scrollRef.current?.clientHeight ?? 0,
    },
    // The body starts below the sticky header band, which also covers the top of the view: the
    // range starts where the body does, and a row scrolled into view lands below the band.
    scrollMargin: headerHeight,
    scrollPaddingStart: headerHeight,
    // The focused entry stays mounted while it is scrolled out of view.
    rangeExtractor: (range) => extractRange(range, pinnedIndexes),
  });
  const virtualItems = stateKind ? [] : virtualizer.getVirtualItems();
  // Rows render in order with a spacer wherever the rendered entries leave a gap: above the
  // window, below it, and between it and a focused entry scrolled far away.
  const bodyRows: ReactNode[] = [];
  let renderedEnd = headerHeight;
  for (const virtualItem of virtualItems) {
    const entry = entries[virtualItem.index];
    if (!entry || entry.kind !== 'row') continue;
    if (virtualItem.start > renderedEnd) {
      bodyRows.push(
        spacerRow(`gap-${virtualItem.index}`, virtualItem.start - renderedEnd, columnCount),
      );
    }
    renderedEnd = virtualItem.end;
    const { row } = entry;
    bodyRows.push(
      <GridRow
        key={row.id}
        row={row}
        entryIndex={virtualItem.index}
        measureRef={virtualizer.measureElement}
        density={density}
        columnOffset={columnOffset}
        highlighted={highlightedId === row.id}
        clickable={Boolean(onRowClick || highlightOnClick)}
        checkbox={
          selecting
            ? {
                label: resolvedLabels.selectRow(rowLabelOf(row)),
                selected: row.getIsSelected(),
                selectable: row.getCanSelect(),
                onCheckedChange: () => selection.toggleRowFromCheckbox(row.id),
                onClickCapture: selection.noteCheckboxClick,
              }
            : undefined
        }
        getCellProps={keyboard.getCellProps}
        onClick={(event) => handleRowClick(row, event)}
        onDoubleClick={
          onRowDoubleClick ? (event) => onRowDoubleClick(row.original, event) : undefined
        }
        onContextMenu={
          onRowContextMenu
            ? (event) => {
                event.preventDefault();
                const pressedCell = keyboardContextMenuCellRef.current;
                keyboardContextMenuCellRef.current = null;
                // The echo of a key press that already called the handler.
                if (
                  pressedCell !== null &&
                  pressedCell === (event.target as Element).closest('td')
                ) {
                  return;
                }
                onRowContextMenu(row.original, event);
              }
            : undefined
        }
      />,
    );
  }
  const bottomSpacerHeight = virtualItems.length
    ? virtualizer.getTotalSize() + headerHeight - renderedEnd
    : 0;
  const scrollStyle: CSSProperties = {
    // A card that fills its parent is sized by it, so a maximum height has no place there.
    maxHeight: maxHeight && !fill ? maxHeight : undefined,
    // A cell the browser scrolls to on focus lands below the sticky header band too.
    scrollPaddingBlockStart: headerHeight || undefined,
  };
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
                  onClick={() => onRefresh()}
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
          ref={keyboard.gridRef}
          className={styles.table}
          role="grid"
          aria-labelledby={headingId}
          aria-rowcount={stateKind ? 2 : entries.length + 1}
          aria-colcount={columnCount}
          aria-multiselectable={selecting || undefined}
          aria-busy={loading || undefined}
          data-density={density}
          onPointerDownCapture={() => {
            keyboardContextMenuCellRef.current = null;
          }}
        >
          <thead ref={headRef} className={styles.head}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} aria-rowindex={1}>
                {selecting ? (
                  <th
                    scope="col"
                    className={`${styles.headerCell} ${styles.selectHeader}`}
                    aria-colindex={1}
                    {...keyboard.getCellProps(0, 0)}
                  >
                    <GridCheckbox
                      label={resolvedLabels.selectAll}
                      checked={selection.allSelected}
                      indeterminate={selection.someSelected}
                      disabled={!selection.canSelectAny}
                      onCheckedChange={selection.toggleAll}
                      tabIndex={-1}
                    />
                  </th>
                ) : null}
                {headerGroup.headers.map((header, columnIndex) => (
                  <GridHeaderCell
                    key={header.id}
                    header={header}
                    ariaColIndex={columnIndex + 1 + columnOffset}
                    cellProps={keyboard.getCellProps(0, columnIndex + columnOffset)}
                  />
                ))}
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
            {bodyRows}
            {bottomSpacerHeight > 0 ? spacerRow('after', bottomSpacerHeight, columnCount) : null}
          </tbody>
        </table>
      </div>
      {hideFooter ? null : (
        <footer className={styles.footer}>
          {selection.selectedIds.size > 0 ? (
            <span>{resolvedLabels.selectedCount(selection.selectedIds.size)}</span>
          ) : null}
          <span className={styles.rowCount}>{resolvedLabels.rowCount(rows.length)}</span>
        </footer>
      )}
    </section>
  );
}
