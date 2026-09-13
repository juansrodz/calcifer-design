import styles from './Skeleton.module.css';

export interface SkeletonProps {
  /** `text` draws one bar per line at text height, `block` a rectangle, `circle` an avatar slot. */
  variant?: 'text' | 'block' | 'circle';
  /** How many bars `text` draws. The last one is drawn short, as a paragraph's last line is. */
  lines?: number;
  /** Any CSS length. Ignored by the last line of a `text` skeleton, which is always 60%. */
  width?: string;
  height?: string;
}

export function Skeleton({ variant = 'text', lines = 3, width, height }: SkeletonProps) {
  // Both branches pass `width` and `height` straight through: React skips a style property whose
  // value is `undefined`, so an unset dimension falls through to the stylesheet.
  if (variant !== 'text') {
    return (
      <span
        className={styles.root}
        data-variant={variant}
        data-testid="skeleton"
        aria-hidden="true"
        style={{ width, height }}
      />
    );
  }

  // A placeholder's job is to occupy space, so a fractional count truncates rather than renders
  // nothing. The cap is what keeps `Array()` in range — `Number.isInteger(1e21)` is true, so an
  // integer check alone still throws — and stops a miscomputed count freezing the tab.
  const lineCount = Number.isFinite(lines) ? Math.min(Math.max(0, Math.trunc(lines)), 100) : 0;
  return (
    <span className={styles.lines} data-testid="skeleton" aria-hidden="true">
      {[...Array(lineCount).keys()].map((lineIndex) => {
        const isLastOfSeveral = lineCount > 1 && lineIndex === lineCount - 1;
        return (
          <span
            key={lineIndex}
            className={styles.root}
            data-variant="text"
            style={{ width: isLastOfSeveral ? '60%' : width, height }}
          />
        );
      })}
    </span>
  );
}
