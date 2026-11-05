import { useMemo } from 'react';

export type GridEntry<Row> =
  { kind: 'row'; row: Row; rowIndex: number } | { kind: 'detail'; row: Row; rowIndex: number };

/**
 * Flattens rows and the detail panels of expanded rows into the one list the virtualiser walks.
 * `aria-rowindex` of an entry is 2 plus its position here (row 1 is the header).
 */
export function useGridEntries<Row extends { id: string }>(
  rows: readonly Row[],
  expandedIds: ReadonlySet<string>,
): GridEntry<Row>[] {
  return useMemo(
    () =>
      rows.flatMap((row, rowIndex): GridEntry<Row>[] =>
        expandedIds.has(row.id)
          ? [
              { kind: 'row', row, rowIndex },
              { kind: 'detail', row, rowIndex },
            ]
          : [{ kind: 'row', row, rowIndex }],
      ),
    [rows, expandedIds],
  );
}
