import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './CardList.module.css';

export interface CardListProps<Item> {
  items: readonly Item[];
  /** What tells one item from another across renders. */
  getKey: (item: Item) => string | number;
  /** One card. A `Card` is the usual answer, and any node will do. */
  renderItem: (item: Item) => ReactNode;
  /**
   * The narrowest a column may get, as any CSS length, before the list drops to fewer columns.
   * Defaults to `16rem`. A width greater than the list's own takes the list's own, so no value can
   * overflow a phone.
   */
  minColumnWidth?: string;
  /**
   * Sets `aria-busy`. Items already here stay, so that a refresh loses nobody's focus or place, and
   * skeletons stand in only for an empty list. To show skeletons, pass no items.
   */
  loading?: boolean;
  /** How many skeletons stand in, up to 100. */
  skeletonCount?: number;
  /** Shown when there are no items and nothing is loading. Without it, nothing is drawn. */
  emptyState?: ReactNode;
  /** Names the list. */
  'aria-label': string;
}

/**
 * A responsive list of cards: as many columns as fit, down to one. Each skeleton's item is hidden
 * from assistive technology, so a list still loading reads as a busy list and not as blank rows.
 */
export function CardList<Item>({
  items,
  getKey,
  renderItem,
  minColumnWidth,
  loading = false,
  skeletonCount = 6,
  emptyState,
  'aria-label': ariaLabel,
}: CardListProps<Item>) {
  if (items.length === 0 && !loading) {
    // No empty list: a `list` role must own its items.
    return emptyState === undefined ? null : <div className={styles.empty}>{emptyState}</div>;
  }
  // The same guard `Skeleton` has on its lines: `Array()` throws on some numbers `length` accepts.
  const standIns =
    items.length === 0 && Number.isFinite(skeletonCount)
      ? Math.min(Math.max(0, Math.trunc(skeletonCount)), 100)
      : 0;
  return (
    // `role="list"` is not redundant: WebKit drops list semantics for `list-style: none` outside a
    // `nav`, and this list is what tells a screen reader how many cards there are.
    <ul
      role="list"
      className={styles.list}
      style={
        minColumnWidth === undefined
          ? undefined
          : ({ '--card-list-min-column': minColumnWidth } as CSSProperties)
      }
      aria-label={ariaLabel}
      aria-busy={loading ? true : undefined}
    >
      {items.map((item) => (
        <li key={getKey(item)} className={styles.item}>
          {renderItem(item)}
        </li>
      ))}
      {Array.from({ length: standIns }, (_unused, position) => (
        <li key={position} className={styles.item} aria-hidden="true">
          <Skeleton variant="block" />
        </li>
      ))}
    </ul>
  );
}
