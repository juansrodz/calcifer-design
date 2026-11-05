import type { RowSelectionState } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useLatest } from './useLatest';

export interface UseRowSelectionOptions<Row> {
  /** False for `selectionMode: 'none'`: nothing is selected and nothing is reported. */
  enabled: boolean;
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  isRowSelectable?: (row: Row) => boolean;
  /** Rows on their way in are not yet the rows the selection must match. */
  loading: boolean;
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectedRowIdsChange?: (rowIds: string[]) => void;
  /** The ids on screen, in display order. Read when a range is chosen, which is after a sort. */
  getDisplayedRowIds: () => string[];
}

export interface RowSelection {
  selectedIds: ReadonlySet<string>;
  /** TanStack's own shape of the selection, for its row and table readers. */
  rowSelection: RowSelectionState;
  /** Every selectable row is selected. */
  allSelected: boolean;
  /** Some rows are selected, but not all. */
  someSelected: boolean;
  /** Whether any row can be selected, so select-all has something to do. */
  canSelectAny: boolean;
  isSelectable: (rowId: string) => boolean;
  /** Toggles one row, or with `range` selects from the last toggled row to this one. */
  toggleRow: (rowId: string, options?: { range?: boolean }) => void;
  /** A checkbox click: the Shift key it carried decides between a toggle and a range. */
  toggleRowFromCheckbox: (rowId: string) => void;
  /** Capture-phase click handler for the checkbox cell, which sees the Shift key first. */
  noteCheckboxClick: (event: MouseEvent<HTMLElement>) => void;
  toggleAll: () => void;
  clear: () => void;
}

const noIds: readonly string[] = [];
const noSelection: RowSelectionState = {};
const noRowIds: ReadonlySet<string> = new Set();

/**
 * Checkbox selection over the loaded rows. The ids it reports are in the order of the `rows` it
 * is given, whatever the sort. A selected row that leaves the grid is dropped, once, and reported.
 */
export function useRowSelection<Row>({
  enabled,
  rows,
  getRowId,
  isRowSelectable,
  loading,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectedRowIdsChange,
  getDisplayedRowIds,
}: UseRowSelectionOptions<Row>): RowSelection {
  const [ownIds, setOwnIds] = useState<readonly string[]>(defaultSelectedRowIds);
  // The last row toggled by a plain or Ctrl/Cmd action: where a range starts.
  const anchorRef = useRef<string | null>(null);
  const checkboxShiftRef = useRef(false);

  const { orderedIds, selectableIds } = useMemo(() => {
    const ids: string[] = [];
    const selectable = new Set<string>();
    if (enabled) {
      for (const row of rows) {
        const rowId = getRowId(row);
        ids.push(rowId);
        if (isRowSelectable?.(row) ?? true) selectable.add(rowId);
      }
    }
    return { orderedIds: ids, selectableIds: selectable };
  }, [enabled, rows, getRowId, isRowSelectable]);

  const reportedIds = enabled ? (selectedRowIds ?? ownIds) : noIds;
  const selectedIds = useMemo(() => {
    if (!enabled) return noRowIds;
    const present = new Set(orderedIds);
    return new Set(reportedIds.filter((rowId) => present.has(rowId)));
  }, [enabled, orderedIds, reportedIds]);
  const rowSelection = useMemo(() => {
    if (selectedIds.size === 0) return noSelection;
    return Object.fromEntries([...selectedIds].map((rowId) => [rowId, true as const]));
  }, [selectedIds]);

  const commit = (nextIds: ReadonlySet<string>) => {
    const ordered = orderedIds.filter((rowId) => nextIds.has(rowId));
    onSelectedRowIdsChange?.(ordered);
    if (selectedRowIds === undefined) setOwnIds(ordered);
  };

  const dropGoneRowsRef = useLatest(() => commit(selectedIds));
  const hasGoneRows = enabled && !loading && selectedIds.size !== reportedIds.length;
  useEffect(() => {
    // The rows changed under the selection, which no event of ours started: the consumer must be
    // told, and the effect is where a change in the props is answered.
    if (hasGoneRows) dropGoneRowsRef.current();
  }, [hasGoneRows, rows, dropGoneRowsRef]);

  const toggleRow: RowSelection['toggleRow'] = (rowId, { range = false } = {}) => {
    if (!selectableIds.has(rowId)) return;
    const next = new Set(selectedIds);
    const displayedIds = getDisplayedRowIds();
    const anchorPosition =
      anchorRef.current === null ? -1 : displayedIds.indexOf(anchorRef.current);
    const targetPosition = displayedIds.indexOf(rowId);
    if (range && anchorPosition >= 0 && targetPosition >= 0) {
      const first = Math.min(anchorPosition, targetPosition);
      const last = Math.max(anchorPosition, targetPosition);
      for (const inRange of displayedIds.slice(first, last + 1)) {
        if (selectableIds.has(inRange)) next.add(inRange);
      }
    } else {
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      anchorRef.current = rowId;
    }
    commit(next);
  };

  const allSelected =
    selectableIds.size > 0 && [...selectableIds].every((rowId) => selectedIds.has(rowId));

  return {
    selectedIds,
    rowSelection,
    allSelected,
    someSelected: selectedIds.size > 0 && !allSelected,
    canSelectAny: selectableIds.size > 0,
    isSelectable: (rowId) => selectableIds.has(rowId),
    toggleRow,
    toggleRowFromCheckbox: (rowId) => {
      const range = checkboxShiftRef.current;
      checkboxShiftRef.current = false;
      toggleRow(rowId, { range });
    },
    noteCheckboxClick: (event) => {
      checkboxShiftRef.current = event.shiftKey;
    },
    toggleAll: () => commit(allSelected ? new Set() : selectableIds),
    clear: () => {
      if (selectedIds.size > 0) commit(new Set());
    },
  };
}
