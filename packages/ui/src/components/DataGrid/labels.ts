export interface DataGridLabels {
  toolbar: string;
  refresh: string;
  rowCount: (count: number) => string;
  loadedRowCount: (loaded: number, total: number) => string;
  /** Client mode while filters or search are active: the rows shown of every row. */
  filteredRowCount: (shown: number, total: number) => string;
  selectedCount: (count: number) => string;
  loading: string;
  loadingMore: string;
  retry: string;
  empty: string;
  filteredEmpty: string;
  clearFilters: string;
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
  filteredRowCount: (shown, total) =>
    `${numberFormat.format(shown)} of ${numberFormat.format(total)} ${total === 1 ? 'row' : 'rows'}`,
  selectedCount: (count) => `${numberFormat.format(count)} selected`,
  loading: 'Loading rows…',
  loadingMore: 'Loading more rows…',
  retry: 'Try again',
  empty: 'No rows to show.',
  filteredEmpty: 'No rows match the filters.',
  clearFilters: 'Clear filters',
  selectAll: 'Select all rows',
  selectRow: (rowLabel) => `Select ${rowLabel}`,
  expandColumn: 'Details',
  expandRow: (rowLabel) => `Show details for ${rowLabel}`,
  rowActions: 'Actions',
};

/** The defaults with the given labels over them; a label given as undefined keeps its default. */
export function resolveDataGridLabels(labels: Partial<DataGridLabels> | undefined): DataGridLabels {
  const givenLabels = Object.entries(labels ?? {}).filter(([, label]) => label !== undefined);
  return { ...defaultDataGridLabels, ...Object.fromEntries(givenLabels) };
}
