import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  /**
   * A picture ahead of the heading. It is decorative and the slot is hidden from assistive
   * technology, so anything that must be read or operated belongs in `heading`, `children` or
   * `actions` instead. The slot lays several in-flow children out in a row, so pass one element
   * or wrap them. The root is `position: relative`, so an absolutely positioned child is placed
   * against the card and may spill over its edge.
   */
  illustration?: ReactNode;
  /** The headline, on the display type. Its tag is `headingLevel`. */
  heading: ReactNode;
  /** The tag of the heading, `h2` unless the page's outline needs another. */
  headingLevel?: 2 | 3 | 4;
  /** The sentence or two under the heading. Nothing is drawn when it is empty. */
  children?: ReactNode;
  /** Buttons or links under the body, in a row that wraps. */
  actions?: ReactNode;
  /** `selected` paints the selected colour with its own text colour. */
  tone?: 'neutral' | 'selected';
  /** Where the content sits: the centre of the card, or its start edge. */
  align?: 'center' | 'start';
  /**
   * A class for the root, joined after the component's own. It is how a consumer sets the one size
   * hook, `--empty-state-heading-size`, which resizes the heading (default `--text-h3`). Like any
   * custom property the hook inherits, so a wrapper that sets it resizes every empty state inside
   * it.
   */
  className?: string;
}

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

/**
 * What a list or a screen shows when it has nothing to list: an optional picture, a headline, a
 * sentence and the next step. It is a plain box, not a landmark.
 */
export function EmptyState({
  illustration,
  heading,
  headingLevel = 2,
  children,
  actions,
  tone = 'neutral',
  align = 'center',
  className,
}: EmptyStateProps) {
  // The `?? 'h2'` is for JavaScript callers, who are not held to the union: an out-of-range level
  // would otherwise resolve to `undefined` and throw in React as an invalid element type.
  const Heading = headingTags[headingLevel] ?? 'h2';
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-align={align}
    >
      {illustration ? (
        <div className={styles.illustration} aria-hidden="true">
          {illustration}
        </div>
      ) : null}
      <Heading className={styles.heading}>{heading}</Heading>
      {children ? <div className={styles.body}>{children}</div> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
