import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Spinner } from '../Spinner/Spinner';
import styles from './DataGrid.module.css';
import type { GetCellProps } from './useGridKeyboard';

export type GridStateKind = 'loading' | 'empty';

export interface GridStateRowProps {
  kind: GridStateKind;
  /** The message for `kind`. */
  label: string;
  /** Shown in place of the empty message. */
  emptyState?: ReactNode;
  columnCount: number;
}

/** The body's only row while it loads or has no rows: one cell across every column. */
export function GridStateRow({ kind, label, emptyState, columnCount }: GridStateRowProps) {
  return (
    <tr aria-rowindex={2}>
      <td role="gridcell" className={styles.stateCell} colSpan={columnCount} aria-colindex={1}>
        {kind === 'loading' ? (
          <div className={styles.state} aria-hidden="true">
            <Spinner size="md" />
            {label}
          </div>
        ) : (
          (emptyState ?? (
            <div className={styles.state} aria-hidden="true">
              {label}
            </div>
          ))
        )}
      </td>
    </tr>
  );
}

export interface GridErrorRowProps {
  /** The row's place after the grid's entries; its keyboard row is one more. */
  entryIndex: number;
  columnCount: number;
  message: string;
  retryLabel: string;
  onRetry: () => void;
  getCellProps: GetCellProps;
}

/** A failed load in server mode: the error and a retry button, after the last entry. */
export function GridErrorRow({
  entryIndex,
  columnCount,
  message,
  retryLabel,
  onRetry,
  getCellProps,
}: GridErrorRowProps) {
  const rowIndex = entryIndex + 1;
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
