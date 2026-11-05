import { useMemo, useState } from 'react';

export interface UseRowExpansionOptions {
  expandedRowIds?: string[];
  defaultExpandedRowIds?: string[];
  onExpandedRowIdsChange?: (rowIds: string[]) => void;
}

/**
 * The ids of the expanded rows: controlled when `expandedRowIds` is given, else the grid's own.
 * Keyed by row id, so a panel follows its row through a sort. A toggle adds the id at the end or
 * takes it out; ids are kept for rows that are not loaded, so such a row opens again on its return.
 */
export function useRowExpansion({
  expandedRowIds,
  defaultExpandedRowIds = [],
  onExpandedRowIdsChange,
}: UseRowExpansionOptions): {
  expandedIds: ReadonlySet<string>;
  toggleRow: (rowId: string) => void;
} {
  const [ownIds, setOwnIds] = useState<readonly string[]>(defaultExpandedRowIds);
  const currentIds = expandedRowIds ?? ownIds;
  const expandedIds = useMemo(() => new Set(currentIds), [currentIds]);

  const toggleRow = (rowId: string) => {
    const nextIds = expandedIds.has(rowId)
      ? currentIds.filter((expandedId) => expandedId !== rowId)
      : [...currentIds, rowId];
    onExpandedRowIdsChange?.(nextIds);
    if (expandedRowIds === undefined) setOwnIds(nextIds);
  };

  return { expandedIds, toggleRow };
}
