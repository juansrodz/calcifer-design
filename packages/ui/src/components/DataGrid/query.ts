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
 * character (a new line or a code point of two units too), everything else is literal. The term
 * is trimmed; an empty term gives null. A term of only stars matches every text, the empty one
 * included. It is a JavaScript RegExp (a capturing lookahead, a backreference, `[^]` and the `u`
 * flag), so a JavaScript server matches with it exactly as client mode does; its `source` is not
 * portable to other engines, such as a database's.
 */
export function dataGridSearchPattern(term: string): RegExp | null {
  const trimmed = term.trim();
  if (trimmed === '') return null;
  // The text between the stars. The match is unanchored, so stars at either end add nothing, and a
  // run of stars is one step. Escaping happens in one pass, so a backslash in the term can never be
  // mistaken for the escape of a wildcard; every character it escapes is one the `u` flag allows.
  const segments = trimmed
    .split(/\*+/)
    .filter((segment) => segment !== '')
    .map((segment) =>
      segment.replace(/[.+?^${}()|[\]\\]/g, (character) =>
        character === '?' ? '.' : `\\${character}`,
      ),
    );
  const [first = '', ...rest] = segments;
  // Joining the segments with `.*` would let the engine retry each star with every length, which
  // costs n to the power of the stars on text that fails to match. Instead each later segment is
  // found by a lookahead for its earliest occurrence, which the engine never reopens, and the
  // backreference then consumes exactly what the lookahead found. Segments have a fixed length, so
  // the earliest occurrence leaves the most text for the segments after it: no match is lost.
  const source = rest.reduce(
    (pattern, segment, index) => `${pattern}(?=([^]*?${segment}))\\${index + 1}`,
    first,
  );
  return new RegExp(source, 'isu');
}

/** No sort, filter or search. Frozen: grids and tests share it, so nothing may change it in place. */
export const emptyDataGridQuery: DataGridQuery = {
  sorting: [],
  filters: {},
  matchMode: 'all',
  search: '',
};
Object.freeze(emptyDataGridQuery.sorting);
Object.freeze(emptyDataGridQuery.filters);
Object.freeze(emptyDataGridQuery);

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
 *
 * `useDebouncedDraft` tells the echo of its own commit from a reset elsewhere by this trimming
 * alone ("hex " comes back as "hex"): a change to how text is normalised here must change it too.
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

/**
 * A multi-select's values combine with OR, so they are compared in any order: an app that hands
 * back the same values reordered has not changed the query.
 */
function isSameFilterValue(first: DataGridFilterValue, second: DataGridFilterValue): boolean {
  if (typeof first === 'string' || typeof second === 'string') return first === second;
  if (first.length !== second.length) return false;
  const sortedSecond = [...second].sort();
  return [...first].sort().every((item, index) => item === sortedSecond[index]);
}

/** Whether two queries are the same, value for value; a multi-select's values in any order. */
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
