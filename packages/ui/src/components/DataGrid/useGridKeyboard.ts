import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';

export interface GridCellPosition {
  /** 0 is the header row; body entry `n` is row `n + 1`. */
  rowIndex: number;
  /** Counts every rendered column. */
  columnIndex: number;
}

export type GridCellKeyHandler = (
  rowIndex: number,
  columnIndex: number,
  event: KeyboardEvent<HTMLElement>,
) => void;

export interface UseGridKeyboardOptions {
  /** The rows focus can reach, the header row included. */
  rowCount: number;
  columnCount: number;
  /** How many rows Page Up and Page Down move. */
  pageSize: number;
  /**
   * Enter or Space on a focused cell. Calling `event.preventDefault()` claims the key; an Enter left
   * unclaimed moves focus into the cell's controls, if it has any.
   */
  onActivate: GridCellKeyHandler;
  /** The context menu key or Shift+F10 on a focused cell. */
  onContextMenu: GridCellKeyHandler;
  /** Scrolls a body entry (`rowIndex - 1`) into view, so that it renders. */
  scrollToEntry: (entryIndex: number) => void;
}

export interface GridCellProps {
  tabIndex: number;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  'data-focused': '' | undefined;
}

/**
 * What counts as a control inside a cell. Controls are out of the tab order until the user enters
 * their cell, and a click on one is not a click on its row.
 */
export const cellControlSelector =
  'button, a[href], input, select, textarea, [role="button"], [tabindex]';

/** The cells focus moves between: header cells and the cells of rendered entries. */
const navigableCellSelector = 'thead th, tbody tr[data-index] > td';

/** A control hidden from assistive technology, such as a checkbox's mirror input, is no tab stop. */
function isHiddenControl(control: HTMLElement): boolean {
  return control.closest('[aria-hidden="true"]') !== null;
}

function controlsOf(cell: HTMLElement): HTMLElement[] {
  return [...cell.querySelectorAll<HTMLElement>(cellControlSelector)].filter(
    (control) => !isHiddenControl(control),
  );
}

/**
 * React bubbles events along the component tree, so a popup a cell control portals elsewhere in
 * the page still reaches the cell's handlers. Only events from the cell's own DOM count.
 */
function isFromCell(event: { currentTarget: HTMLElement; target: EventTarget }): boolean {
  return event.target instanceof Node && event.currentTarget.contains(event.target);
}

/** `aria-rowindex` and `aria-colindex` count from 1; positions count from 0. */
function cellAt(grid: HTMLElement, position: GridCellPosition): HTMLElement | null {
  return grid.querySelector<HTMLElement>(
    `tr[aria-rowindex="${position.rowIndex + 1}"] > [aria-colindex="${position.columnIndex + 1}"]`,
  );
}

function clamp(value: number, lowest: number, highest: number): number {
  return Math.min(Math.max(value, lowest), Math.max(highest, lowest));
}

/**
 * Takes every control in the grid out of the tab order, except those of the cell the user has
 * entered, so that the grid keeps one tab stop.
 */
function syncControlTabIndexes(grid: HTMLElement, enteredCell: HTMLElement | null) {
  for (const control of grid.querySelectorAll<HTMLElement>(cellControlSelector)) {
    const cell = control.closest<HTMLElement>('td, th');
    if (cell === null || cell === control || !cell.matches(navigableCellSelector)) continue;
    if (isHiddenControl(control)) {
      control.tabIndex = -1;
      continue;
    }
    control.tabIndex = cell === enteredCell ? 0 : -1;
  }
}

/**
 * Roving focus for a grid, per the WAI-ARIA data grid pattern: one cell is the tab stop, the arrow
 * keys, Home, End and the page keys move it, and Enter or F2 moves into a cell's controls, from
 * which Escape returns. The focused position is clamped to the grid's bounds on every render, so
 * rows or columns going away leave focus at the same position.
 */
export function useGridKeyboard({
  rowCount,
  columnCount,
  pageSize,
  onActivate,
  onContextMenu,
  scrollToEntry,
}: UseGridKeyboardOptions): {
  focusedCell: GridCellPosition;
  getCellProps: (rowIndex: number, columnIndex: number) => GridCellProps;
  gridRef: RefObject<HTMLTableElement | null>;
} {
  const gridRef = useRef<HTMLTableElement>(null);
  const [heldCell, setHeldCell] = useState<GridCellPosition>({ rowIndex: 0, columnIndex: 0 });
  // True while focus is on one of the focused cell's controls rather than on the cell.
  const [inside, setInside] = useState(false);
  // React fires no blur for an element it removes, so this still says focus was in the grid when
  // the focused row goes away, while `activeElement` says it no longer is.
  const hasFocusRef = useRef(false);
  const pendingFocusRef = useRef(false);

  const lastRow = rowCount - 1;
  const lastColumn = columnCount - 1;
  const focusedCell: GridCellPosition = {
    rowIndex: clamp(heldCell.rowIndex, 0, lastRow),
    columnIndex: clamp(heldCell.columnIndex, 0, lastColumn),
  };
  if (
    focusedCell.rowIndex !== heldCell.rowIndex ||
    focusedCell.columnIndex !== heldCell.columnIndex
  ) {
    // Kept clamped, not just shown clamped: rows that grow back must not pull focus to the
    // position they once shrank away from.
    setHeldCell(focusedCell);
  }
  const enteredCell = inside ? focusedCell : null;

  // Every commit: the cell to focus may render a commit after the move that asked for it, a
  // removed row takes focus with it, and a reordered row carries focus to another position.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (grid === null) return;
    const cell = cellAt(grid, focusedCell);
    const active = document.activeElement;
    const focusAstray =
      hasFocusRef.current &&
      active !== cell &&
      (!grid.contains(active) || active?.matches(navigableCellSelector) === true);
    if (!pendingFocusRef.current && !focusAstray) return;
    if (cell !== null) {
      pendingFocusRef.current = false;
      cell.focus();
    }
  });

  const enteredRow = enteredCell?.rowIndex;
  const enteredColumn = enteredCell?.columnIndex;
  // Before paint, so the controls a cell renders are never briefly in the tab order.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (grid === null) return;
    const findEnteredCell = () =>
      enteredRow === undefined || enteredColumn === undefined
        ? null
        : cellAt(grid, { rowIndex: enteredRow, columnIndex: enteredColumn });
    syncControlTabIndexes(grid, findEnteredCell());
    // Cells render their own content, which can add controls without the grid rendering.
    const observer = new MutationObserver(() => syncControlTabIndexes(grid, findEnteredCell()));
    observer.observe(grid, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enteredRow, enteredColumn]);

  const moveTo = (target: GridCellPosition) => {
    const next = {
      rowIndex: clamp(target.rowIndex, 0, lastRow),
      columnIndex: clamp(target.columnIndex, 0, lastColumn),
    };
    if (next.rowIndex === focusedCell.rowIndex && next.columnIndex === focusedCell.columnIndex) {
      return;
    }
    if (next.rowIndex > 0) scrollToEntry(next.rowIndex - 1);
    pendingFocusRef.current = true;
    setHeldCell(next);
  };

  const enter = (controls: HTMLElement[]) => {
    for (const control of controls) control.tabIndex = 0;
    controls[0]?.focus();
  };

  const handleKeyDown = (position: GridCellPosition, event: KeyboardEvent<HTMLElement>) => {
    const cell = event.currentTarget;
    if (!isFromCell(event)) return;
    if (event.target !== cell) {
      // Inside a cell every key belongs to its controls, except the one that leaves.
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        setInside(false);
        cell.focus();
      }
      return;
    }

    const { key, ctrlKey, shiftKey, altKey, metaKey } = event;
    const { rowIndex, columnIndex } = position;

    if (key === 'ContextMenu' || (key === 'F10' && shiftKey)) {
      onContextMenu(rowIndex, columnIndex, event);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      onActivate(rowIndex, columnIndex, event);
      if (event.defaultPrevented || key === ' ') return;
    }
    if (key === 'Enter' || key === 'F2') {
      const controls = controlsOf(cell);
      if (controls.length > 0) {
        event.preventDefault();
        enter(controls);
      }
      return;
    }

    // Modified keys are left to the page (Alt+Left goes back), except Ctrl+Home and Ctrl+End.
    if (altKey || metaKey || shiftKey || (ctrlKey && key !== 'Home' && key !== 'End')) return;
    const inRightToLeft = getComputedStyle(cell).direction === 'rtl';
    const forward = inRightToLeft ? -1 : 1;
    const targets: Record<string, () => GridCellPosition> = {
      ArrowUp: () => ({ rowIndex: rowIndex - 1, columnIndex }),
      ArrowDown: () => ({ rowIndex: rowIndex + 1, columnIndex }),
      ArrowLeft: () => ({ rowIndex, columnIndex: columnIndex - forward }),
      ArrowRight: () => ({ rowIndex, columnIndex: columnIndex + forward }),
      Home: () => (ctrlKey ? { rowIndex: 0, columnIndex: 0 } : { rowIndex, columnIndex: 0 }),
      End: () =>
        ctrlKey
          ? { rowIndex: lastRow, columnIndex: lastColumn }
          : { rowIndex, columnIndex: lastColumn },
      PageUp: () => ({ rowIndex: rowIndex - pageSize, columnIndex }),
      PageDown: () => ({ rowIndex: rowIndex + pageSize, columnIndex }),
    };
    const target = targets[key];
    if (target) {
      event.preventDefault();
      moveTo(target());
    }
  };

  const getCellProps = (rowIndex: number, columnIndex: number): GridCellProps => {
    const isFocused = rowIndex === focusedCell.rowIndex && columnIndex === focusedCell.columnIndex;
    const position = { rowIndex, columnIndex };
    return {
      tabIndex: isFocused && !inside ? 0 : -1,
      'data-focused': isFocused ? '' : undefined,
      onKeyDown: (event) => handleKeyDown(position, event),
      onFocus: (event) => {
        if (!isFromCell(event)) return;
        hasFocusRef.current = true;
        if (!isFocused) setHeldCell(position);
        // A click on a control enters its cell as Enter would.
        setInside(event.target !== event.currentTarget);
      },
      onBlur: (event) => {
        if (!isFromCell(event)) return;
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        if (!(next instanceof Node && gridRef.current?.contains(next))) {
          hasFocusRef.current = false;
          setInside(false);
        }
      },
    };
  };

  return { focusedCell, getCellProps, gridRef };
}
