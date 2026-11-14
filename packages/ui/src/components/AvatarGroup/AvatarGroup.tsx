import a11yStyles from '../../styles/a11y.module.css';
import { Avatar } from '../Avatar/Avatar';
import type { AvatarSize } from '../Avatar/Avatar';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupItem {
  /** What tells one person from another across renders. */
  id: string;
  /** The person's name: the avatar's text for a screen reader, and its initials source. */
  name: string;
  src?: string;
  /** A stable id for the person, which `Avatar` turns into one of the theme's six colours. */
  colorSeed?: string;
}

export interface AvatarGroupProps {
  items: readonly AvatarGroupItem[];
  /**
   * How many avatars show before the rest fold into a `+N` chip. Defaults to 4. A value below 1
   * reads as 1, and the chip is drawn only when there are more items than this.
   */
  max?: number;
  /**
   * One of `Avatar`'s five sizes. Defaults to `sm`. The chip is drawn at the same size. Like the
   * avatars', it follows `--avatar-size` and `--avatar-font-size` when a wrapper sets them.
   */
  size?: AvatarSize;
  /** Names the list. */
  label: string;
  /**
   * What a screen reader hears for the chip, given how many are hidden. A library English default,
   * `3 more`; pass a function for another wording or language. The chip's visible `+3` is
   * decorative, so this text is the chip's whole meaning.
   */
  overflowLabel?: (count: number) => string;
}

const DEFAULT_MAX = 4;

function defaultOverflowLabel(count: number): string {
  return `${count} more`;
}

/** At least one avatar shows, whole ones only, and a `NaN` from a caller's arithmetic reads as one. */
function shownCountFor(max: number): number {
  return Math.max(1, Math.trunc(max) || 1);
}

/**
 * Avatars laid edge to edge, each overlapping the one before it and ringed in the ground colour so
 * the overlap reads as a stack. Past `max`, a `+N` chip stands for the rest. An empty `items`
 * draws nothing: a list must own its items, so there is no empty list to name.
 */
export function AvatarGroup({
  items,
  max = DEFAULT_MAX,
  size = 'sm',
  label,
  overflowLabel = defaultOverflowLabel,
}: AvatarGroupProps) {
  if (items.length === 0) {
    return null;
  }
  const shownItems = items.slice(0, shownCountFor(max));
  const hiddenCount = items.length - shownItems.length;
  return (
    // `role="list"` is not redundant: WebKit drops list semantics for `list-style: none` outside a
    // `nav`, and this list is what tells a screen reader how many people there are.
    <ul role="list" aria-label={label} className={styles.list} data-size={size}>
      {shownItems.map((item) => (
        <li key={item.id} className={styles.item}>
          <Avatar
            name={item.name}
            src={item.src}
            colorSeed={item.colorSeed}
            size={size}
            className={styles.ring}
          />
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li className={styles.item}>
          <span className={styles.overflow} aria-hidden="true">
            +{hiddenCount}
          </span>
          <span className={a11yStyles.visuallyHidden}>{overflowLabel(hiddenCount)}</span>
        </li>
      ) : null}
    </ul>
  );
}
