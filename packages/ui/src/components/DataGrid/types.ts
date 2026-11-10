import type { RowData, SortingState } from '@tanstack/react-table';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import type { DataGridColumnDef } from './columns';
import type { DataGridLabels } from './labels';

export type DataGridMode = 'client' | 'server';
export type DataGridDensity = 'comfortable' | 'compact';
export type DataGridFilterValue = string | string[];

export interface DataGridQuery {
  sorting: SortingState;
  filters: Record<string, DataGridFilterValue>;
  matchMode: 'all' | 'any';
  search: string;
}

export type DataGridRowEvent = MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;

export interface DataGridProps<Row extends RowData> {
  gridId: string;
  heading: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /**
   * In server mode, pass a new array only when your data changes: after a query change the grid
   * waits for a new `rows` array before it asks for more, so a copy made on every render would
   * end that wait early.
   */
  rows: Row[];
  /** Build with `createDataGridColumnHelper<Row>().columns([...])`, not a plain array literal. */
  columns: DataGridColumnDef<Row, unknown>[];
  getRowId: (row: Row) => string;
  /** Defaults to the text value of the first column. */
  getRowLabel?: (row: Row) => string;
  actions?: ReactNode;
  /**
   * `'client'` (the default) sorts, filters and searches the given rows itself. `'server'` leaves
   * the query to the app and asks for rows page by page; there, sorting, filters and search are
   * available only when `onQueryChange` is given.
   */
  mode?: DataGridMode;
  totalRowCount?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
  loadError?: string;
  onLoadMore?: () => void;
  /**
   * The user changed the query: the sort, a filter, the match mode or the search. In client mode it
   * reports the query for the app to keep, for example in the URL; in server mode it is the cue to
   * load the first page of rows for this query. Without it, server mode and a controlled `query`
   * offer no sorting, filters or search, and their headers carry no `aria-sort`. A text filter
   * still waiting out its delay when the grid unmounts is committed then, and reported here.
   */
  onQueryChange?: (query: DataGridQuery) => void;
  /**
   * The query the grid starts with: filters, sort, match mode and search, as a "view all" link
   * would set them. Its `sorting` wins over `initialSorting`. Read once, on mount; filters the grid
   * cannot apply (an unknown column, one without a filter, a value of the wrong shape) are dropped.
   * In server mode its filters and search apply only with `onQueryChange`. The grid does not call
   * `onQueryChange` on mount, so a server-mode app's first fetch must use this same query.
   */
  initialQuery?: Partial<DataGridQuery>;
  /**
   * Makes the query controlled: the grid shows this query and reports every change through
   * `onQueryChange`, for an app whose own search field or tabs sit outside the grid. Normalised
   * against `columns` on every render. Without it the grid keeps its own query.
   *
   * Adopt a change synchronously, in the handler: once the grid renders again it builds the next
   * change on the query it shows, so a second change made before an asynchronous adoption lands
   * can drop the first. To reject a change, render the grid again with the old query; until it
   * renders, the next change builds on the rejected one. Without `onQueryChange` the query is
   * read-only: its filters and search apply, but the grid offers no sorting (so its `sorting` does
   * not apply), no filters button or strip, and no Clear filters button.
   */
  query?: DataGridQuery;
  /**
   * The sort the grid starts with, unless `initialQuery` gives one or `query` makes the query
   * controlled. Read once, on mount.
   */
  initialSorting?: SortingState;
  /** Adds the search button to the toolbar. */
  enableSearch?: boolean;
  enableSorting?: boolean;
  multiSort?: boolean;
  loading?: boolean;
  /**
   * Replaces the default empty message. The grid announces `labels.empty` when it is empty, not
   * this node, so set `labels.empty` to match your message.
   */
  emptyState?: ReactNode;
  /**
   * Replaces the message shown when filters or search match nothing. It receives the grid's
   * "clear filters and search" action. The grid announces `labels.filteredEmpty`.
   */
  filteredEmptyState?: (clearFilters: () => void) => ReactNode;
  density?: DataGridDensity;
  /**
   * The tallest the scrolling body grows before it scrolls, as a CSS length. Defaults to the
   * viewport height minus 16rem, which leaves room for a page header. Ignored when `fill` is set.
   */
  maxHeight?: string;
  fill?: boolean;
  hideFooter?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  highlightOnClick?: boolean;
  highlightedRowId?: string | null;
  onHighlightChange?: (rowId: string | null) => void;
  selectionMode?: 'none' | 'multiple';
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectedRowIdsChange?: (rowIds: string[]) => void;
  isRowSelectable?: (row: Row) => boolean;
  onRowClick?: (row: Row, event: DataGridRowEvent) => void;
  onRowDoubleClick?: (row: Row, event: DataGridRowEvent) => void;
  onRowContextMenu?: (row: Row, event: DataGridRowEvent) => void;
  renderRowActions?: (row: Row) => ReactNode;
  rowActionsHeader?: ReactNode;
  renderExpandedRow?: (row: Row) => ReactNode;
  isRowExpandable?: (row: Row) => boolean;
  expandedRowIds?: string[];
  defaultExpandedRowIds?: string[];
  onExpandedRowIdsChange?: (rowIds: string[]) => void;
  labels?: Partial<DataGridLabels>;
}
