export interface DataGridLabels {
  toolbar: string;
  refresh: string;
  rowCount: (count: number) => string;
  loadedRowCount: (loaded: number, total: number) => string;
  selectedCount: (count: number) => string;
  loading: string;
  loadingMore: string;
  retry: string;
  empty: string;
  selectAll: string;
  selectRow: (rowLabel: string) => string;
  /** The expand column's header, which shows nothing but needs a name. */
  expandColumn: string;
  expandRow: (rowLabel: string) => string;
  rowActions: string;
}

const numberFormat = new Intl.NumberFormat('en-US');

export const defaultDataGridLabels: DataGridLabels = {
  toolbar: 'Grid tools',
  refresh: 'Refresh',
  rowCount: (count) => `${numberFormat.format(count)} ${count === 1 ? 'row' : 'rows'}`,
  loadedRowCount: (loaded, total) =>
    `Showing ${numberFormat.format(loaded)} of ${numberFormat.format(total)} rows`,
  selectedCount: (count) => `${numberFormat.format(count)} selected`,
  loading: 'Loading rows…',
  loadingMore: 'Loading more rows…',
  retry: 'Try again',
  empty: 'No rows to show.',
  selectAll: 'Select all rows',
  selectRow: (rowLabel) => `Select ${rowLabel}`,
  expandColumn: 'Details',
  expandRow: (rowLabel) => `Show details for ${rowLabel}`,
  rowActions: 'Actions',
};
