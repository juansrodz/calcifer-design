import { useTable, type RowData } from '@tanstack/react-table';
import { useVirtualizer, type Range } from '@tanstack/react-virtual';
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { LiveRegion } from '../LiveRegion/LiveRegion';
import { dataGridFeatures, textValueOf, type DataGridColumnDef } from './columns';
import styles from './DataGrid.module.css';
import { GridCardHeader } from './GridCardHeader';
import { GridFilterRow } from './GridFilterRow';
import { GridHeaderRow } from './GridHeaderRow';
import { GridDetailRow, GridRow, GridSpacerRow } from './GridRow';
import {
  GridErrorRow,
  GridStateRow,
  type GridStateKind,
  type GridStateRowProps,
} from './GridStateRows';
import { resolveDataGridLabels } from './labels';
import { createQueryMatcher } from './query';
import type { DataGridProps, DataGridRowEvent } from './types';
import { useGridEntries, type GridEntry } from './useGridEntries';
import { useGridHighlight } from './useGridHighlight';
import { useGridQuery } from './useGridQuery';
import { useGridMetrics } from './useGridMetrics';
import { cellControlSelector, useGridKeyboard } from './useGridKeyboard';
import { useLoadMore } from './useLoadMore';
import { useRowExpansion } from './useRowExpansion';
import { useRowSelection, type RowSelection } from './useRowSelection';

const emptyCellText = '—';

const estimatedRowHeight = { comfortable: 40, compact: 34 } as const;
const overscanRows = 8;
/** Two viewports' worth of rows from the end of the loaded rows is near enough to ask for more. */
const loadAheadViewports = 2;

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

function formatCellValue(value: unknown): string {
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
  initialQuery,
  query,
  initialSorting,
  enableSearch = false,
  enableSorting = true,
  multiSort = false,
  density = 'comfortable',
  maxHeight,
  fill = false,
  hideFooter = false,
  loading = false,
  emptyState,
  filteredEmptyState,
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
  // Whether the user can change the query. Without the query handler the app hears of no change:
  // in server mode only it can sort, filter and search, so the grid does none of them and starts
  // with no filters or search whatever `initialQuery` says; a controlled query it would never
  // replace. Only the grid's own query in client mode needs no handler.
  const queryEnabled = (!serverMode && query === undefined) || onQueryChange !== undefined;
  const sortingEnabled = enableSorting && queryEnabled;
  const filtering = queryEnabled && columns.some((column) => column.filter !== undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showsFilterStrip = filtering && filtersOpen;
  // The header, then the filter strip while it shows; body entry `n` is keyboard row
  // `n + headRowCount`. The header stays keyboard row 0.
  const headRowCount = showsFilterStrip ? 2 : 1;
  // The rows the grid held when the query last changed. Until the app replaces them the loaded
  // rows answer the old query, so nothing more is asked of them.
  const [rowsOfOldQuery, setRowsOfOldQuery] = useState<readonly Row[] | null>(null);
  const awaitingNewRows = rowsOfOldQuery === rows;
  const gridQuery = useGridQuery({
    columns,
    initialQuery: queryEnabled ? initialQuery : { ...initialQuery, filters: {}, search: '' },
    initialSorting,
    query,
    onQueryChange,
    // Called from event handlers and layout effects only, after everything below exists.
    onChange: () => {
      // Rows that move under the selection would make it hard to see what it covers.
      selection.clear();
      virtualizer.scrollToOffset(0);
      if (serverMode) {
        // The app starts again from the first page.
        setRowsOfOldQuery(committedRowsRef.current);
        loadMore.reset();
      }
    },
  });
  // Search, like the filters, only where the user can change the query.
  const searching = enableSearch && queryEnabled;
  // The field shows while the user has it open or a search is active, so an active search is never
  // hidden. An initial search opens it.
  const [searchOpen, setSearchOpen] = useState(gridQuery.query.search !== '');
  const showsSearch = searching && (searchOpen || gridQuery.query.search !== '');
  // The rows of the last commit. A query the app changes is acted on in a layout effect of the
  // render that brings it, and that render may bring the new query's first page as well: the old
  // query's rows are the ones before it. Declared after the query hook, so that its effect reads
  // them before this one moves on.
  const committedRowsRef = useRef(rows);
  useLayoutEffect(() => {
    committedRowsRef.current = rows;
  });
  // In server mode the app has already filtered and searched the rows.
  const shownRows = useMemo(() => {
    const matcher = serverMode ? null : createQueryMatcher(columns, gridQuery.query);
    return matcher ? rows.filter(matcher) : rows;
  }, [serverMode, rows, columns, gridQuery.query]);
  const { highlightedId, setHighlightedId } = useGridHighlight({
    rows: shownRows,
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
    rows: shownRows,
    getRowId,
    isRowSelectable,
    // A query the app changed clears the selection in a layout effect. Rows it hid must not be
    // dropped from the selection before then, or that report would land after the clear.
    loading: loading || gridQuery.pendingChange,
    selectedRowIds,
    defaultSelectedRowIds,
    onSelectedRowIdsChange,
    // Called from event handlers only, after the entries below exist.
    getDisplayedRowIds: () =>
      entries.flatMap((entry) => (entry.kind === 'row' ? [entry.row.id] : [])),
  });
  const headingId = useId();
  const panelIdPrefix = useId();
  const resolvedLabels = resolveDataGridLabels(labels);

  const table = useTable({
    features: dataGridFeatures,
    data: shownRows,
    columns,
    getRowId,
    state: { sorting: gridQuery.query.sorting, rowSelection: selection.rowSelection },
    manualSorting: serverMode,
    onSortingChange: (updater) =>
      gridQuery.setSorting(
        typeof updater === 'function' ? updater(gridQuery.query.sorting) : updater,
      ),
    enableRowSelection: (row) => isRowSelectable?.(row.original) ?? true,
    // In client mode a read-only query still sorts the rows; only its headers stop sorting them.
    enableSorting: serverMode ? sortingEnabled : enableSorting,
    enableMultiSort: multiSort,
    defaultColumn: {
      // Cycle ascending, descending, off for every type; TanStack would start numbers descending.
      sortDescFirst: false,
      cell: (context) => (context.column.accessorFn ? formatCellValue(context.getValue()) : null),
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableSectionElement>(null);
  const { viewportHeight, viewportWidth, headerHeight, rightToLeft } = useGridMetrics(
    scrollRef,
    headRef,
  );
  const tableRows = table.getRowModel().rows;
  const entries = useGridEntries(tableRows, expansion.expandedIds, (row) =>
    isExpandable(row.original),
  );
  // Counted, not worked out from the rows: the row model can hold fewer rows than `rows`.
  const openPanelCount = useMemo(
    () => entries.filter((entry) => entry.kind === 'detail').length,
    [entries],
  );
  const leafHeaders = table.getHeaderGroups()[0]?.headers ?? [];
  const leafColumns = table.getAllLeafColumns();
  const columnCount = columnOffset + leafColumns.length + (renderRowActions ? 1 : 0);
  // Stable across sorts: TanStack's row index is the row's place in the shown rows.
  const panelIdOf = (row: { index: number }) => `${panelIdPrefix}-detail-${row.index}`;
  // A failed first page is the error row alone, with no 'no rows' message beside it.
  const showsLoadError = serverMode && loadError !== undefined && !loading;
  let stateKind: GridStateKind | null = null;
  if (loading) stateKind = 'loading';
  else if (entries.length === 0 && !showsLoadError) {
    stateKind = gridQuery.activeCount > 0 ? 'filteredEmpty' : 'empty';
  }
  const rowHeight = estimatedRowHeight[density];
  const rowsPerViewport = Math.max(1, Math.floor((viewportHeight - headerHeight) / rowHeight));
  const rowsClickable = Boolean(onRowClick || highlightOnClick);

  /** A click, or Enter on a cell: the consumer hears of it, and the highlight toggles. */
  const clickRow = (row: { id: string; original: Row }, event: DataGridRowEvent) => {
    onRowClick?.(row.original, event);
    if (!highlightOnClick) return;
    // The second click of a double click leaves the highlight the first one set.
    if (highlightedId === row.id && 'detail' in event && event.detail > 1) return;
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
    if (rowIndex >= headRowCount && expanding && columnIndex === expandColumn) {
      const entry = entries[rowIndex - headRowCount];
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
      const entry = entries[rowIndex - headRowCount];
      if (entry?.kind !== 'row' || !selection.isSelectable(entry.row.id)) return;
      event.preventDefault();
      selection.toggleRow(entry.row.id, { range: event.shiftKey });
      return;
    }
    if (event.key !== 'Enter') return;
    if (rowIndex === 0) {
      const column = leafHeaders[columnIndex - columnOffset]?.column;
      if (sortingEnabled && column?.getCanSort()) {
        event.preventDefault();
        column.getToggleSortingHandler()?.(event);
      }
      return;
    }
    const entry = entries[rowIndex - headRowCount];
    // A cell with controls is entered instead; that is the hook's part. A cell whose only control
    // is a button by its role alone, with no tabindex, is neither entered nor a click on the row.
    if (entry?.kind !== 'row' || event.currentTarget.querySelector(cellControlSelector)) return;
    if (rowsClickable) {
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

  const handleContextMenuKey = (
    rowIndex: number,
    _columnIndex: number,
    event: KeyboardEvent<HTMLElement>,
  ) => {
    const entry = entries[rowIndex - headRowCount];
    if (entry?.kind !== 'row' || !onRowContextMenu) return;
    event.preventDefault();
    // Some browsers follow this key with a contextmenu event of their own on the same cell.
    keyboardContextMenuCellRef.current = event.currentTarget;
    onRowContextMenu(entry.row.original, event);
  };

  const handleRowContextMenu = (row: { original: Row }, event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const pressedCell = keyboardContextMenuCellRef.current;
    keyboardContextMenuCellRef.current = null;
    // The echo of a key press that already called the handler.
    if (pressedCell !== null && pressedCell === (event.target as Element).closest('td')) return;
    onRowContextMenu?.(row.original, event);
  };

  const keyboard = useGridKeyboard({
    rowCount: stateKind ? headRowCount : entries.length + headRowCount + (showsLoadError ? 1 : 0),
    headRowCount,
    columnCount,
    onActivate: handleActivate,
    onContextMenu: handleContextMenuKey,
    // Both called from key handlers only, after the virtualiser below exists.
    scrollToEntry: (entryIndex) => virtualizer.scrollToIndex(entryIndex),
    // The rows the virtualiser measured in view; before it has, the estimate.
    getPageSize: () => {
      const range = virtualizer.range;
      return range ? Math.max(1, range.endIndex - range.startIndex + 1) : rowsPerViewport;
    },
  });
  const focusedEntryIndex = keyboard.focusedCell.rowIndex - headRowCount;
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
    // Exact, not rounded to whole pixels as the default does: a row is rarely a whole number of
    // pixels tall, and rounded sizes make the spacers disagree with the rows they stand for.
    measureElement: (element, entry) =>
      entry?.borderBoxSize?.[0]?.blockSize ?? element.getBoundingClientRect().height,
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
  // Annotated for the query handler above, which resets the guard before this line has run.
  const loadMore: ReturnType<typeof useLoadMore> = useLoadMore({
    enabled: serverMode && !awaitingNewRows,
    loading,
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
        <GridSpacerRow
          key={`gap-${virtualItem.index}`}
          height={virtualItem.start - renderedEnd}
          columnCount={columnCount}
        />,
      );
    }
    renderedEnd = virtualItem.end;
    const { row } = entry;
    if (entry.kind === 'detail') {
      bodyRows.push(
        <GridDetailRow
          key={`detail:${row.id}`}
          entryIndex={virtualItem.index}
          firstEntryRow={headRowCount}
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
        firstEntryRow={headRowCount}
        measureRef={virtualizer.measureElement}
        density={density}
        columnOffset={columnOffset}
        highlighted={highlightedId === row.id}
        clickable={rowsClickable}
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
        onContextMenu={onRowContextMenu ? (event) => handleRowContextMenu(row, event) : undefined}
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
  // The error row's aria-rowindex: it comes after the last entry, which follows the head rows.
  const errorRowIndex = entries.length + headRowCount + 1;
  // Every row the app has, not only those loaded.
  const knownRowCount =
    serverMode && totalRowCount !== undefined
      ? Math.max(totalRowCount, rows.length)
      : shownRows.length;
  // The head rows, every known row and the open panels. The error row follows the last entry,
  // whatever the grid knows of rows it has not loaded.
  let ariaRowCount = Math.max(
    knownRowCount + openPanelCount + headRowCount,
    showsLoadError ? errorRowIndex : 0,
  );
  // ARIA's "unknown total" is -1: more rows exist than the app has said how many.
  if (serverMode && totalRowCount === undefined && hasMore) ariaRowCount = -1;
  // The head rows and the state row.
  if (stateKind) ariaRowCount = headRowCount + 1;
  // One region that is always mounted: a live region announces reliably only when its text
  // changes, not when it appears with its text. Each state kind is named after its label.
  const stateLabel = stateKind ? resolvedLabels[stateKind] : '';
  // The app's own content in place of an empty state's message, and the filtered one's button.
  let stateReplacement: ReactNode;
  let clearFiltersButton: GridStateRowProps['clearFilters'];
  if (stateKind === 'empty') stateReplacement = emptyState;
  if (stateKind === 'filteredEmpty') {
    stateReplacement = filteredEmptyState?.(gridQuery.clearFilters);
    // A query the user cannot change offers no button to clear it.
    if (queryEnabled) {
      clearFiltersButton = { label: resolvedLabels.clearFilters, onClick: gridQuery.clearFilters };
    }
  }
  let rowCountText = resolvedLabels.rowCount(rows.length);
  if (serverMode && totalRowCount !== undefined) {
    rowCountText = resolvedLabels.loadedRowCount(rows.length, totalRowCount);
  } else if (!serverMode && gridQuery.activeCount > 0) {
    rowCountText = resolvedLabels.filteredRowCount(shownRows.length, rows.length);
  }

  return (
    <section
      className={fill ? `${styles.card} ${styles.fill}` : styles.card}
      aria-labelledby={headingId}
    >
      <GridCardHeader
        heading={heading}
        headingLevel={headingLevel}
        headingId={headingId}
        actions={actions}
        onRefresh={onRefresh}
        refreshing={refreshing}
        toolbarLabel={resolvedLabels.toolbar}
        refreshLabel={resolvedLabels.refresh}
        search={
          searching
            ? {
                open: showsSearch,
                value: gridQuery.query.search,
                buttonLabel: resolvedLabels.search,
                fieldLabel: resolvedLabels.searchField,
                clearLabel: resolvedLabels.clearSearch,
                onToggle: () => {
                  // Closing clears the search; the setter reports nothing when there is none.
                  if (showsSearch) gridQuery.setSearch('');
                  setSearchOpen(!showsSearch);
                },
                onClose: () => setSearchOpen(false),
                onSearchChange: gridQuery.setSearch,
                // A field the user is in stays open, even once its search is cleared.
                onFieldFocus: () => setSearchOpen(true),
              }
            : undefined
        }
        onToggleFilters={filtering ? () => setFiltersOpen((open) => !open) : undefined}
        filtersOpen={filtersOpen}
        filtersLabel={resolvedLabels.filters(gridQuery.activeCount)}
        filterCount={gridQuery.activeCount}
        showMatchMode={
          filtering && (filtersOpen || Object.keys(gridQuery.query.filters).length > 0)
        }
        matchMode={gridQuery.query.matchMode}
        onMatchModeChange={gridQuery.setMatchMode}
        matchModeLabel={resolvedLabels.matchMode}
        matchAllLabel={resolvedLabels.matchAll}
        matchAnyLabel={resolvedLabels.matchAny}
      />
      <LiveRegion message={stateLabel} politeness="polite" />
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
          aria-rowcount={ariaRowCount}
          aria-colcount={columnCount}
          aria-multiselectable={selecting || undefined}
          aria-busy={loading || undefined}
          data-density={density}
          // The chevron turns with the computed direction, which a stylesheet can set as well.
          data-rtl={rightToLeft ? '' : undefined}
          onPointerDownCapture={forgetKeyboardContextMenu}
          onKeyDownCapture={forgetKeyboardContextMenu}
          onBlur={forgetKeyboardContextMenu}
        >
          <thead ref={headRef} className={styles.head}>
            {table.getHeaderGroups().map((headerGroup) => (
              <GridHeaderRow
                key={headerGroup.id}
                headers={headerGroup.headers}
                columnCount={columnCount}
                columnOffset={columnOffset}
                sortable={sortingEnabled}
                selectAll={
                  selecting
                    ? {
                        label: resolvedLabels.selectAll,
                        checked: selection.allSelected,
                        indeterminate: selection.someSelected,
                        disabled: !selection.canSelectAny,
                        onCheckedChange: selection.toggleAll,
                      }
                    : undefined
                }
                expandLabel={expanding ? resolvedLabels.expandColumn : undefined}
                rowActions={
                  renderRowActions
                    ? { header: rowActionsHeader, label: resolvedLabels.rowActions }
                    : undefined
                }
                getCellProps={keyboard.getCellProps}
              />
            ))}
            {showsFilterStrip ? (
              <GridFilterRow
                headers={leafHeaders}
                columnCount={columnCount}
                columnOffset={columnOffset}
                hasRowActions={renderRowActions !== undefined}
                query={gridQuery}
                labels={resolvedLabels}
                getCellProps={keyboard.getCellProps}
              />
            ) : null}
          </thead>
          <tbody>
            {stateKind ? (
              <GridStateRow
                kind={stateKind}
                label={stateLabel}
                replacement={stateReplacement}
                clearFilters={clearFiltersButton}
                // Under an h2 card heading; under a deeper one, the empty state's deepest level.
                headingLevel={headingLevel === 2 ? 3 : 4}
                columnCount={columnCount}
                firstEntryRow={headRowCount}
                viewportWidth={viewportWidth}
              />
            ) : null}
            {bodyRows}
            {bottomSpacerHeight > 0 ? (
              <GridSpacerRow height={bottomSpacerHeight} columnCount={columnCount} />
            ) : null}
            {showsLoadError ? (
              <GridErrorRow
                entryIndex={entries.length}
                firstEntryRow={headRowCount}
                columnCount={columnCount}
                message={loadError}
                retryLabel={resolvedLabels.retry}
                onRetry={loadMore.retry}
                getCellProps={keyboard.getCellProps}
              />
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
          <span className={styles.rowCount}>{rowCountText}</span>
        </footer>
      )}
    </section>
  );
}
