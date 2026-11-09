import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Spinner } from '../Spinner/Spinner';
import styles from './DataGrid.module.css';
import type { GetCellProps } from './useGridKeyboard';

/** `filteredEmpty`: there are rows, or may be, but the filters and search match none of them. */
export type GridStateKind = 'loading' | 'empty' | 'filteredEmpty';

export interface GridStateRowProps {
  kind: GridStateKind;
  /** The message for `kind`, which the grid also announces. */
  label: string;
  /** For the empty kinds: the app's own content in place of the message. */
  replacement?: ReactNode;
  /** For `filteredEmpty`: the button beside the message. Without it the message shows alone. */
  clearFilters?: { label: string; onClick: () => void };
  columnCount: number;
  /** The keyboard row of entry 0: the grid's `headRowCount`. The state row sits where it would. */
  firstEntryRow: number;
}

/**
 * The body's only row while it loads, has no rows or shows none: one cell across every column.
 * The live region speaks the message, so the visible copy is hidden from assistive technology;
 * the Clear filters button beside it is not, and stays a tab stop, as the row is no keyboard row.
 */
export function GridStateRow({
  kind,
  label,
  replacement,
  clearFilters,
  columnCount,
  firstEntryRow,
}: GridStateRowProps) {
  let content: ReactNode;
  if (kind === 'loading') {
    content = (
      <div className={styles.state} aria-hidden="true">
        <Spinner size="md" />
        {label}
      </div>
    );
  } else if (kind === 'empty') {
    content = replacement ?? (
      <div className={styles.state} aria-hidden="true">
        {label}
      </div>
    );
  } else {
    content = replacement ?? (
      <div className={`${styles.state} ${styles.filteredEmpty}`}>
        <span aria-hidden="true">{label}</span>
        {clearFilters ? (
          <Button variant="secondary" size="sm" onClick={clearFilters.onClick}>
            {clearFilters.label}
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <tr aria-rowindex={firstEntryRow + 1}>
      <td role="gridcell" className={styles.stateCell} colSpan={columnCount} aria-colindex={1}>
        {content}
      </td>
    </tr>
  );
}

export interface GridErrorRowProps {
  /** The row's place after the grid's entries; its keyboard row is `firstEntryRow` more. */
  entryIndex: number;
  /** The keyboard row of entry 0: the grid's `headRowCount`. */
  firstEntryRow: number;
  columnCount: number;
  message: string;
  retryLabel: string;
  onRetry: () => void;
  getCellProps: GetCellProps;
}

/** A failed load in server mode: the error and a retry button, after the last entry. */
export function GridErrorRow({
  entryIndex,
  firstEntryRow,
  columnCount,
  message,
  retryLabel,
  onRetry,
  getCellProps,
}: GridErrorRowProps) {
  const rowIndex = entryIndex + firstEntryRow;
  return (
    <tr data-index={entryIndex} aria-rowindex={rowIndex + 1}>
      <td
        role="gridcell"
        className={styles.errorCell}
        colSpan={columnCount}
        aria-colindex={1}
        {...getCellProps(rowIndex, 0, columnCount)}
      >
        <div className={styles.errorContent}>
          <span role="alert">{message}</span>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      </td>
    </tr>
  );
}
