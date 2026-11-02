import type { ReactNode } from 'react';
import styles from './ViewField.module.css';

/** Shown for a value with nothing to show. Internal, shared with `Descriptions`. */
export const DEFAULT_EMPTY_TEXT = '—';

/**
 * The values that render as nothing and that a caller means as "no value". `0` is a value, and
 * so is the word `none`. `true` and an empty array also render as nothing, but neither is what
 * `{isSet && value}` or a missing field produces, so they stay the caller's to say. Internal,
 * like `FieldMessages`: reachable across modules, absent from `src/index.ts`.
 */
export function isEmptyValue(value: ReactNode): boolean {
  return value === undefined || value === null || value === false || value === '';
}

export type ViewFieldLayout = 'stacked' | 'inline';

export interface ViewFieldProps {
  /** Names the value: the `<dt>`. */
  label: ReactNode;
  /** The value: the `<dd>`. */
  children?: ReactNode;
  /** `stacked` (default) puts the label above the value; `inline` beside it, wrapping if tight. */
  layout?: ViewFieldLayout;
  /** Shown instead of a value that is `undefined`, `null`, `false` or `''`. */
  emptyText?: ReactNode;
}

/**
 * One read-only label and value. For several together use `Descriptions`, which is one list
 * rather than one list per pair.
 */
export function ViewField({
  label,
  children,
  layout = 'stacked',
  emptyText = DEFAULT_EMPTY_TEXT,
}: ViewFieldProps) {
  const isEmpty = isEmptyValue(children);
  return (
    <dl className={styles.root}>
      <div className={styles.group} data-layout={layout}>
        <dt className={styles.label}>{label}</dt>
        <dd className={styles.value} data-empty={isEmpty ? '' : undefined}>
          {isEmpty ? emptyText : children}
        </dd>
      </div>
    </dl>
  );
}
