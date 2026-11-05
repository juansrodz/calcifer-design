import type { RowData, SortingState } from '@tanstack/react-table';
import type { ReactNode } from 'react';
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

export type DataGridRowEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;

export interface DataGridProps<Row extends RowData> {
  gridId: string;
  heading: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  rows: Row[];
  /** Build with `createDataGridColumnHelper<Row>().columns([...])`, not a plain array literal. */
  columns: DataGridColumnDef<Row, unknown>[];
  getRowId: (row: Row) => string;
  /** Defaults to the text value of the first column. */
  getRowLabel?: (row: Row) => string;
  actions?: ReactNode;
  mode?: DataGridMode;
  totalRowCount?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
  loadError?: string;
  onLoadMore?: () => void;
  onQueryChange?: (query: DataGridQuery) => void;
  initialSorting?: SortingState;
  enableSorting?: boolean;
  multiSort?: boolean;
  loading?: boolean;
  /**
   * Replaces the default empty message. The grid announces `labels.empty` when it is empty, not
   * this node, so set `labels.empty` to match your message.
   */
  emptyState?: ReactNode;
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
