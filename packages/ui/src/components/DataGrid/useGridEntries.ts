import { useMemo } from 'react';

export type GridEntry<Row> =
  { kind: 'row'; row: Row; rowIndex: number } | { kind: 'detail'; row: Row; rowIndex: number };

/**
 * Flattens rows and the detail panels of expanded rows into the one list the virtualiser walks.
 * `aria-rowindex` of an entry is 2 plus its position here (row 1 is the header). A row gets a panel
 * when its id is in `expandedIds` and `canExpand` allows it.
 */
export function useGridEntries<Row extends { id: string }>(
  rows: readonly Row[],
  expandedIds: ReadonlySet<string>,
  canExpand: (row: Row) => boolean,
): GridEntry<Row>[] {
  const rowsById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  // The entries are rebuilt only when the open rows change, not whenever `canExpand` or the set
  // is a new object: new entries make the virtualiser rebuild its measurements.
  const openIdsKey = JSON.stringify(
    [...expandedIds].filter((rowId) => {
      const row = rowsById.get(rowId);
      return row !== undefined && canExpand(row);
    }),
  );
  return useMemo(() => {
    const openIds = new Set(JSON.parse(openIdsKey) as string[]);
    return rows.flatMap((row, rowIndex): GridEntry<Row>[] =>
      openIds.has(row.id)
        ? [
            { kind: 'row', row, rowIndex },
            { kind: 'detail', row, rowIndex },
          ]
        : [{ kind: 'row', row, rowIndex }],
    );
  }, [rows, openIdsKey]);
}
