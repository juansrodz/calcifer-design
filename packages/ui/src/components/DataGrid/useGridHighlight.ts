import { useEffect, useEffectEvent, useState } from 'react';

export interface UseGridHighlightOptions<Row> {
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  /** Rows on their way in are not yet the rows the highlight must match. */
  loading: boolean;
  highlightedRowId?: string | null;
  onHighlightChange?: (rowId: string | null) => void;
}

/**
 * The highlighted row: controlled when `highlightedRowId` is given (null included), else the
 * grid's own. A highlight whose row leaves the grid is cleared, and the consumer hears of it.
 */
export function useGridHighlight<Row>({
  rows,
  getRowId,
  loading,
  highlightedRowId,
  onHighlightChange,
}: UseGridHighlightOptions<Row>): {
  highlightedId: string | null;
  setHighlightedId: (rowId: string | null) => void;
} {
  const [ownHighlightedId, setOwnHighlightedId] = useState<string | null>(null);
  const highlightedId = highlightedRowId === undefined ? ownHighlightedId : highlightedRowId;

  const setHighlightedId = (next: string | null) => {
    onHighlightChange?.(next);
    if (highlightedRowId === undefined) setOwnHighlightedId(next);
  };

  const clearHighlight = useEffectEvent(() => setHighlightedId(null));
  const isStale =
    highlightedId !== null && !loading && !rows.some((row) => getRowId(row) === highlightedId);
  useEffect(() => {
    // The rows changed under the highlight, which no event of ours started: the consumer must be
    // told, and the effect is where a change in the props is answered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isStale) clearHighlight();
  }, [isStale, rows]);

  return { highlightedId, setHighlightedId };
}
