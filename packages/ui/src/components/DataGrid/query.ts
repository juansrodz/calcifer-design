import type { RowData } from '@tanstack/react-table';
import { textValueOf, type DataGridColumnDef, type DataGridColumnFilter } from './columns';
import type { DataGridFilterValue, DataGridQuery } from './types';

/**
 * The id TanStack gives a column definition: `id`, else `accessorKey` with every `.` replaced by
 * `_`, else a string `header`. Written out here because the definition is all the query has.
 */
export function columnIdOf<Row extends RowData, Value = unknown>(
  column: DataGridColumnDef<Row, Value>,
): string | undefined {
  if (column.id !== undefined) return column.id;
  if ('accessorKey' in column && column.accessorKey !== undefined) {
    return String(column.accessorKey).replaceAll('.', '_');
  }
  return typeof column.header === 'string' ? column.header : undefined;
}

/** The column's header when it is a string, else its id: the name in "Filter by <name>". */
export function columnNameOf<Row extends RowData, Value = unknown>(
  column: DataGridColumnDef<Row, Value>,
): string {
  return typeof column.header === 'string' ? column.header : (columnIdOf(column) ?? '');
}

/**
 * A search term as a case-insensitive, unanchored RegExp: `*` is any run of characters, `?` is one
 * character, everything else is literal. The term is trimmed; an empty term gives null.
 */
export function dataGridSearchPattern(term: string): RegExp | null {
  const trimmed = term.trim();
  if (trimmed === '') return null;
  // One pass, so a backslash in the term can never be mistaken for the escape of a wildcard.
  const source = trimmed.replace(/[.*+?^${}()|[\]\\]/g, (character) => {
    if (character === '*') return '.*';
    if (character === '?') return '.';
    return `\\${character}`;
  });
  return new RegExp(source, 'i');
}

export const emptyDataGridQuery: DataGridQuery = {
  sorting: [],
  filters: {},
  matchMode: 'all',
  search: '',
};

function columnsById<Row extends RowData>(
  columns: readonly DataGridColumnDef<Row, unknown>[],
): Map<string, DataGridColumnDef<Row, unknown>> {
  const byId = new Map<string, DataGridColumnDef<Row, unknown>>();
  for (const column of columns) {
    const id = columnIdOf(column);
    if (id !== undefined && !byId.has(id)) byId.set(id, column);
  }
  return byId;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** The value as the column's filter can use it, or undefined when it cannot apply. */
function usableFilterValue(
  column: { filter?: DataGridColumnFilter } | undefined,
  value: unknown,
): DataGridFilterValue | undefined {
  if (!column?.filter) return undefined;
  if (column.filter.type === 'multiSelect') {
    return isStringArray(value) && value.length > 0 ? [...value] : undefined;
  }
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * A full query from a partial one, keeping only what can apply: text values and the search
 * trimmed, empty values dropped, and filters dropped whose column is unknown, has no filter, or
 * whose value has the wrong shape (a string for `text` and `select`, a non-empty string array for
 * `multiSelect`).
 */
export function normaliseQuery<Row extends RowData>(
  query: Partial<DataGridQuery> | undefined,
  columns: readonly DataGridColumnDef<Row, unknown>[],
): DataGridQuery {
  const byId = columnsById(columns);
  const filters: Record<string, DataGridFilterValue> = {};
  for (const [columnId, value] of Object.entries(query?.filters ?? {})) {
    const usable = usableFilterValue(byId.get(columnId), value);
    if (usable !== undefined) filters[columnId] = usable;
  }
  return {
    sorting: query?.sorting ?? [],
    filters,
    matchMode: query?.matchMode ?? 'all',
    search: (query?.search ?? '').trim(),
  };
}

/** Active column filters plus one for a search: the filter button's badge. */
export function countActiveCriteria(query: DataGridQuery): number {
  return Object.keys(query.filters).length + (query.search.trim() === '' ? 0 : 1);
}

function isSameFilterValue(first: DataGridFilterValue, second: DataGridFilterValue): boolean {
  if (typeof first === 'string' || typeof second === 'string') return first === second;
  return first.length === second.length && first.every((item, index) => item === second[index]);
}

/** Whether two queries are the same, value for value. */
export function isSameQuery(first: DataGridQuery, second: DataGridQuery): boolean {
  if (first.matchMode !== second.matchMode || first.search !== second.search) return false;
  const sameSorting =
    first.sorting.length === second.sorting.length &&
    first.sorting.every(
      (sort, index) =>
        sort.id === second.sorting[index]?.id && sort.desc === second.sorting[index]?.desc,
    );
  if (!sameSorting) return false;
  const firstIds = Object.keys(first.filters);
  if (firstIds.length !== Object.keys(second.filters).length) return false;
  return firstIds.every((columnId) => {
    const secondValue = second.filters[columnId];
    return (
      secondValue !== undefined && isSameFilterValue(first.filters[columnId] ?? '', secondValue)
    );
  });
}

function createFilterTest<Row extends RowData>(
  column: DataGridColumnDef<Row, unknown>,
  value: DataGridFilterValue,
): ((row: Row) => boolean) | null {
  const textOf = (row: Row) => textValueOf(column, row);
  switch (column.filter?.type) {
    case 'text': {
      if (typeof value !== 'string') return null;
      const needle = value.toLowerCase();
      return (row) => textOf(row)?.toLowerCase().includes(needle) ?? false;
    }
    case 'select':
      if (typeof value !== 'string') return null;
      return (row) => textOf(row) === value;
    case 'multiSelect': {
      if (typeof value === 'string') return null;
      const accepted = new Set(value);
      return (row) => {
        const text = textOf(row);
        return text !== undefined && accepted.has(text);
      };
    }
    default:
      return null;
  }
}

/**
 * A predicate for rows that match a normalised query, or null when the query has no filters and
 * no search. Search and the filters combine with AND; the filters with each other by `matchMode`.
 */
export function createQueryMatcher<Row extends RowData>(
  columns: readonly DataGridColumnDef<Row, unknown>[],
  query: DataGridQuery,
): ((row: Row) => boolean) | null {
  const byId = columnsById(columns);
  const filterTests: Array<(row: Row) => boolean> = [];
  for (const [columnId, value] of Object.entries(query.filters)) {
    const column = byId.get(columnId);
    const test = column && createFilterTest(column, value);
    if (test) filterTests.push(test);
  }
  const pattern = dataGridSearchPattern(query.search);
  if (filterTests.length === 0 && !pattern) return null;

  const searchColumns = columns.filter((column) => column.searchable !== false);
  const matchesFilters = (row: Row) =>
    filterTests.length === 0 ||
    (query.matchMode === 'any'
      ? filterTests.some((test) => test(row))
      : filterTests.every((test) => test(row)));
  const matchesSearch = (row: Row) =>
    pattern === null ||
    searchColumns.some((column) => {
      const text = textValueOf(column, row);
      return text !== undefined && pattern.test(text);
    });

  return (row) => matchesFilters(row) && matchesSearch(row);
}
