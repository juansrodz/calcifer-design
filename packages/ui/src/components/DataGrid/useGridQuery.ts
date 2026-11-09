import type { RowData, SortingState } from '@tanstack/react-table';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { DataGridColumnDef } from './columns';
import { countActiveCriteria, isSameQuery, normaliseQuery } from './query';
import type { DataGridFilterValue, DataGridQuery } from './types';
import { useLatest } from './useLatest';

export interface UseGridQueryOptions<Row extends RowData> {
  columns: readonly DataGridColumnDef<Row, unknown>[];
  initialQuery?: Partial<DataGridQuery>;
  initialSorting?: SortingState;
  /** Makes the query controlled: it is shown, normalised, and the setters only report changes. */
  query?: DataGridQuery;
  /**
   * The shown query changed. Called from the setter that changed it, in the same event, with the
   * new query; for a controlled query, from a layout effect once the app passes a different one.
   */
  onChange: (query: DataGridQuery) => void;
  /**
   * A setter changed the query: called in the same event with the new query, after `onChange` when
   * the query is the grid's own.
   */
  onQueryChange?: (query: DataGridQuery) => void;
}

export interface GridQuery {
  query: DataGridQuery;
  /**
   * The app has passed a controlled query that `onChange` has not heard of yet, as it will in this
   * commit's layout effects. Until then the rows on screen answer a query the grid has not acted on.
   */
  pendingChange: boolean;
  /** `countActiveCriteria(query)`. */
  activeCount: number;
  setSorting: (sorting: SortingState) => void;
  /** An empty value (after trimming) removes the filter. */
  setFilter: (columnId: string, value: DataGridFilterValue | undefined) => void;
  setMatchMode: (matchMode: DataGridQuery['matchMode']) => void;
  setSearch: (term: string) => void;
  /** Removes every filter and the search; keeps the sort and the match mode. */
  clearFilters: () => void;
}

/**
 * The grid's query: its own, started from `initialQuery` and `initialSorting`, or the app's when
 * `query` is given. Either way it is normalised against `columns`, so it holds only what can
 * apply, and `onChange` hears of every change to it, whichever side made it.
 */
export function useGridQuery<Row extends RowData>({
  columns,
  initialQuery,
  initialSorting = [],
  query,
  onChange,
  onQueryChange,
}: UseGridQueryOptions<Row>): GridQuery {
  const [ownQuery, setOwnQuery] = useState(() =>
    normaliseQuery({ ...initialQuery, sorting: initialQuery?.sorting ?? initialSorting }, columns),
  );
  const shownQuery = useMemo(
    () => normaliseQuery(query ?? ownQuery, columns),
    [query, ownQuery, columns],
  );
  // The query `onChange` last heard of. A setter of the grid's own query tells it at once; a
  // controlled query that differs from it is the app's change, answered before the next paint.
  const [actedOnQuery, setActedOnQuery] = useState(shownQuery);
  const pendingChange = !isSameQuery(shownQuery, actedOnQuery);
  const actOn = (nextQuery: DataGridQuery) => {
    setActedOnQuery(nextQuery);
    onChange(nextQuery);
  };
  const actOnRef = useLatest(actOn);
  useLayoutEffect(() => {
    if (pendingChange) actOnRef.current(shownQuery);
  }, [pendingChange, shownQuery, actOnRef]);

  const update = (change: Partial<DataGridQuery>) => {
    const nextQuery = normaliseQuery({ ...shownQuery, ...change }, columns);
    if (isSameQuery(nextQuery, shownQuery)) return;
    // A controlled query changes when the app passes the new one.
    if (query === undefined) {
      setOwnQuery(nextQuery);
      actOn(nextQuery);
    }
    onQueryChange?.(nextQuery);
  };

  return {
    query: shownQuery,
    pendingChange,
    activeCount: countActiveCriteria(shownQuery),
    setSorting: (sorting) => update({ sorting }),
    setFilter: (columnId, value) => {
      const { [columnId]: _replaced, ...otherFilters } = shownQuery.filters;
      update({
        filters: value === undefined ? otherFilters : { ...otherFilters, [columnId]: value },
      });
    },
    setMatchMode: (matchMode) => update({ matchMode }),
    setSearch: (term) => update({ search: term }),
    clearFilters: () => update({ filters: {}, search: '' }),
  };
}
