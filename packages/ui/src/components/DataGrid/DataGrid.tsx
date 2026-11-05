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
import a11yStyles from '../../styles/a11y.module.css';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { LiveRegion } from '../LiveRegion/LiveRegion';
import { Spinner } from '../Spinner/Spinner';
import { Toolbar, ToolbarButton } from '../Toolbar/Toolbar';
import { dataGridFeatures, textValueOf, type DataGridColumnDef } from './columns';
import styles from './DataGrid.module.css';
import { GridCheckbox } from './GridCheckbox';
import { GridHeaderCell } from './GridHeaderCell';
import { GridDetailRow, GridRow } from './GridRow';
import { defaultDataGridLabels } from './labels';
import type { DataGridProps, DataGridQuery, DataGridRowEvent } from './types';
import { useGridEntries, type GridEntry } from './useGridEntries';
import { useGridHighlight } from './useGridHighlight';
import { useGridMetrics } from './useGridMetrics';
import { cellControlSelector, useGridKeyboard } from './useGridKeyboard';
import { useLoadMore } from './useLoadMore';
import { useRowExpansion } from './useRowExpansion';
import { useRowSelection, type RowSelection } from './useRowSelection';

const emptyCellText = '—';

const estimatedRowHeight = { comfortable: 40, compact: 34 } as const;
const overscanRows = 8;

/**
 * The rows in view plus the overscan, plus any pinned entries (the focused one stays mounted). An
 * open row's detail panel always comes with its row, since the row's button points at it.
 */
function extractRange(
  range: Range,
  pinnedIndexes: ReadonlySet<number>,
  entries: readonly GridEntry<unknown>[],
): number[] {
  const start = Math.max(range.startIndex - range.overscan, 0);
  const end = Math.min(range.endIndex + range.overscan, range.count - 1);
  const indexes = new Set<number>();
  for (let index = start; index <= end; index += 1) indexes.add(index);
  for (const pinnedIndex of pinnedIndexes) {
    if (pinnedIndex >= 0 && pinnedIndex < range.count) indexes.add(pinnedIndex);
  }
  for (const index of [...indexes]) {
    if (entries[index]?.kind === 'row' && entries[index + 1]?.kind === 'detail') {
      indexes.add(index + 1);
    }
  }
  return [...indexes].sort((first, second) => first - second);
}

/** Two viewports' worth of rows from the end of the loaded rows is near enough to ask for more. */
const loadAheadViewports = 2;

function isEmptyNode(node: ReactNode): boolean {
  return node === undefined || node === null || node === false || node === '';
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
  mode = 'client',
  totalRowCount,
  hasMore = false,
  loadingMore = false,
  loadError,
  onLoadMore,
  onQueryChange,
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
  renderRowActions,
  rowActionsHeader,
  renderExpandedRow,
  isRowExpandable,
  expandedRowIds,
  defaultExpandedRowIds,
  onExpandedRowIdsChange,
  labels,
}: DataGridProps<Row>) {
  const serverMode = mode === 'server';
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  // The rows the grid held when the query last changed. Until the app replaces them the loaded
  // rows answer the old query, so nothing more is asked of them.
  const [rowsOfOldQuery, setRowsOfOldQuery] = useState<readonly Row[] | null>(null);
  const awaitingNewRows = rowsOfOldQuery === rows;
  const { highlightedId, setHighlightedId } = useGridHighlight({
    rows,
    getRowId,
    loading,
    highlightedRowId,
    onHighlightChange,
  });
  const selecting = selectionMode === 'multiple';
  const expanding = renderExpandedRow !== undefined;
  // The checkbox and expand columns are not TanStack columns; they come before every row's own
  // cells, the checkbox column first. The row actions column comes after them.
  const expandColumn = selecting ? 1 : 0;
  const columnOffset = expandColumn + (expanding ? 1 : 0);
  const expansion = useRowExpansion({
    expandedRowIds,
    defaultExpandedRowIds,
    onExpandedRowIdsChange,
  });
  const isExpandable = (row: Row) => expanding && (isRowExpandable?.(row) ?? true);
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
  const panelIdPrefix = useId();
  const resolvedLabels = { ...defaultDataGridLabels, ...labels };
  const HeadingTag: ElementType = `h${headingLevel}`;

  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId,
    state: { sorting, rowSelection: selection.rowSelection },
    manualSorting: serverMode,
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(nextSorting);
      // Rows that move under the selection would make it hard to see what it covers.
      selection.clear();
      if (serverMode) {
        // The app starts again from the first page; the view goes back to where that page lands.
        setRowsOfOldQuery(rows);
        loadMore.reset();
        virtualizer.scrollToOffset(0);
        onQueryChange?.({
          sorting: nextSorting,
          filters: {},
          matchMode: 'all',
          search: '',
        } satisfies DataGridQuery);
      }
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
  const entries = useGridEntries(tableRows, expansion.expandedIds, (row) =>
    isExpandable(row.original),
  );
  const leafHeaders = table.getHeaderGroups()[0]?.headers ?? [];
  const leafColumns = table.getAllLeafColumns();
  const columnCount = columnOffset + leafColumns.length + (renderRowActions ? 1 : 0);
  // Stable across sorts: TanStack's row index is the row's place in `rows`.
  const panelIdOf = (row: { index: number }) => `${panelIdPrefix}-detail-${row.index}`;
  const stateKind = loading ? 'loading' : entries.length === 0 ? 'empty' : null;
  const rowHeight = estimatedRowHeight[density];
  const rowsPerViewport = Math.max(1, Math.floor((viewportHeight - headerHeight) / rowHeight));

  /** A click, or Enter on a cell: the consumer hears of it, and the highlight toggles. */
  const clickRow = (row: { id: string; original: Row }, event: DataGridRowEvent) => {
    onRowClick?.(row.original, event);
    if (!highlightOnClick) return;
    setHighlightedId(highlightedId === row.id ? null : row.id);
  };

  /**
   * Shift, Ctrl or Cmd with a click selects, and on a row that cannot be selected does nothing; a
   * plain click is the row's own.
   */
  const handleRowClick = (row: { id: string; original: Row }, event: MouseEvent<HTMLElement>) => {
    const selectsRow = event.shiftKey || event.ctrlKey || event.metaKey;
    if (selecting && selectsRow) {
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
    // In the expand column Enter or Space opens or closes the row.
    if (rowIndex > 0 && expanding && columnIndex === expandColumn) {
      const entry = entries[rowIndex - 1];
      if (entry?.kind === 'row' && isExpandable(entry.row.original)) {
        event.preventDefault();
        expansion.toggleRow(entry.row.id);
        return;
      }
    }
    if (event.key === ' ') {
      // In the checkbox column Space toggles the row, and on its header select-all.
      if (!selecting) return;
      if (rowIndex === 0) {
        // Rows on their way in leave nothing to select, and a kept selection must survive them.
        if (columnIndex !== 0 || !selection.canSelectAny) return;
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

  // The cell a key press opened the context menu on, until its echo arrives, a pointer presses,
  // another key is pressed or focus leaves the cell.
  const keyboardContextMenuCellRef = useRef<HTMLElement | null>(null);

  const forgetKeyboardContextMenu = () => {
    keyboardContextMenuCellRef.current = null;
  };

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
    pageSize: rowsPerViewport,
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
    rangeExtractor: (range) => extractRange(range, pinnedIndexes, entries),
  });
  const virtualItems = stateKind ? [] : virtualizer.getVirtualItems();
  // Annotated for the sort handler above, which resets the guard before this line has run.
  const loadMore: ReturnType<typeof useLoadMore> = useLoadMore({
    enabled: serverMode && !loading && !awaitingNewRows,
    loadedCount: rows.length,
    lastRenderedIndex:
      (stateKind ? undefined : entries[virtualizer.range?.endIndex ?? -1]?.rowIndex) ?? -1,
    threshold: loadAheadViewports * rowsPerViewport,
    hasMore,
    loadingMore,
    loadError,
    onLoadMore,
  });
  // Rows render in order with a spacer wherever the rendered entries leave a gap: above the
  // window, below it, and between it and a focused entry scrolled far away.
  const bodyRows: ReactNode[] = [];
  let renderedEnd = headerHeight;
  for (const virtualItem of virtualItems) {
    const entry = entries[virtualItem.index];
    if (!entry) continue;
    if (virtualItem.start > renderedEnd) {
      bodyRows.push(
        spacerRow(`gap-${virtualItem.index}`, virtualItem.start - renderedEnd, columnCount),
      );
    }
    renderedEnd = virtualItem.end;
    const { row } = entry;
    if (entry.kind === 'detail') {
      bodyRows.push(
        <GridDetailRow
          key={`detail:${row.id}`}
          entryIndex={virtualItem.index}
          measureRef={virtualizer.measureElement}
          columnCount={columnCount}
          panelId={panelIdOf(row)}
          getCellProps={keyboard.getCellProps}
        >
          {renderExpandedRow?.(row.original)}
        </GridDetailRow>,
      );
      continue;
    }
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
                onCellClick: (event) => selection.toggleRow(row.id, { range: event.shiftKey }),
              }
            : undefined
        }
        expander={
          expanding
            ? {
                expandable: isExpandable(row.original),
                expanded: entries[virtualItem.index + 1]?.kind === 'detail',
                label: resolvedLabels.expandRow(rowLabelOf(row)),
                panelId: panelIdOf(row),
                onToggle: () => expansion.toggleRow(row.id),
              }
            : undefined
        }
        renderRowActions={renderRowActions}
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
  const showsLoadError = serverMode && loadError !== undefined;
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
  // The header, every row the app has (not only those loaded) and the open panels.
  const openPanelCount = entries.length - rows.length;
  const rowCountOfGrid =
    (serverMode && totalRowCount !== undefined
      ? Math.max(totalRowCount, rows.length)
      : rows.length) +
    openPanelCount +
    1;
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
          aria-rowcount={stateKind ? 2 : rowCountOfGrid}
          aria-colcount={columnCount}
          aria-multiselectable={selecting || undefined}
          aria-busy={loading || undefined}
          data-density={density}
          onPointerDownCapture={forgetKeyboardContextMenu}
          onKeyDownCapture={forgetKeyboardContextMenu}
          onBlur={forgetKeyboardContextMenu}
        >
          <thead ref={headRef} className={styles.head}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} aria-rowindex={1}>
                {selecting ? (
                  <th
                    scope="col"
                    className={`${styles.headerCell} ${styles.pinnedHeader} ${styles.selectHeader}`}
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
                {expanding ? (
                  <th
                    scope="col"
                    className={`${styles.headerCell} ${styles.pinnedHeader} ${styles.expandHeader}`}
                    aria-colindex={expandColumn + 1}
                    {...keyboard.getCellProps(0, expandColumn)}
                  >
                    <span className={a11yStyles.visuallyHidden}>{resolvedLabels.expandColumn}</span>
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
                {renderRowActions ? (
                  <th
                    scope="col"
                    className={`${styles.headerCell} ${styles.pinnedHeader} ${styles.actionsHeader}`}
                    aria-colindex={columnCount}
                    {...keyboard.getCellProps(0, columnCount - 1)}
                  >
                    {isEmptyNode(rowActionsHeader) ? (
                      <span className={a11yStyles.visuallyHidden}>{resolvedLabels.rowActions}</span>
                    ) : (
                      rowActionsHeader
                    )}
                  </th>
                ) : null}
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
            {showsLoadError ? (
              <tr aria-rowindex={(stateKind ? 1 : entries.length) + 2}>
                <td
                  role="gridcell"
                  className={styles.errorCell}
                  colSpan={columnCount}
                  aria-colindex={1}
                >
                  <div className={styles.errorContent}>
                    <span role="alert">{loadError}</span>
                    <Button variant="secondary" size="sm" onClick={loadMore.retry}>
                      {resolvedLabels.retry}
                    </Button>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {hideFooter ? null : (
        <footer className={styles.footer}>
          {selection.selectedIds.size > 0 ? (
            <span>{resolvedLabels.selectedCount(selection.selectedIds.size)}</span>
          ) : null}
          {serverMode && loadingMore ? <span>{resolvedLabels.loadingMore}</span> : null}
          <span className={styles.rowCount}>
            {serverMode && totalRowCount !== undefined
              ? resolvedLabels.loadedRowCount(rows.length, totalRowCount)
              : resolvedLabels.rowCount(rows.length)}
          </span>
        </footer>
      )}
    </section>
  );
}
