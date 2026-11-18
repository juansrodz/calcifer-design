import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { useId, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import { hasContent } from '../../utils/hasContent';
import styles from './Collapsible.module.css';

/**
 * Which way the chevron points, closed then open. `down-up` points down at a closed panel and up
 * once it is open. `end-down` points to the reading end (right, or left in a right-to-left page)
 * while closed and down at the panel once it is open, as a disclosure triangle does.
 */
export type CollapsibleChevron = 'down-up' | 'end-down';

export interface CollapsibleProps {
  /** The label on the row. It is the trigger's accessible name, with `headingAside` after it. */
  heading: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /**
   * After the heading text and before the chevron: a count, a status word. It sits inside the
   * trigger button, so it must be decorative or plain text; an interactive node here is a caller
   * error, because a button cannot hold another control.
   */
  headingAside?: ReactNode;
  /** Controlled. Pair it with `onOpenChange`; use `defaultOpen` for an uncontrolled one. */
  open?: boolean;
  /** Closed on arrival unless this is set; a screen that opens every group passes `true`. */
  defaultOpen?: boolean;
  /** Called with the next state each time the trigger asks to change it. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The trigger stays in the tab order, announced as disabled, and does nothing. This is Base UI's
   * `disabled`: a native `disabled` button would drop out of the tab order, and a keyboard user
   * would not learn the row exists.
   */
  disabled?: boolean;
  /**
   * Which way the chevron points, closed then open (`CollapsibleChevron`). The default, `down-up`,
   * is the look every collapsible had before the option.
   *
   * `end-down` reads the computed direction (a `dir` on any ancestor, or a stylesheet's
   * `direction`) after each render, so a direction changed under a memoised subtree takes effect on
   * its next render. Server-rendered HTML carries no direction until hydration, so before then a
   * closed chevron in a right-to-left page points right.
   */
  chevron?: CollapsibleChevron;
  children: ReactNode;
  /**
   * A class for the root, joined after the component's own. It is how a consumer sets the three
   * hooks, each a custom property that inherits, so a wrapper that sets one reaches every
   * collapsible inside it:
   * - `--collapsible-heading-size` resizes the heading (default `--text-md`);
   * - `--collapsible-trigger-padding-block` and `--collapsible-trigger-padding-inline` pad the
   *   trigger row inside its edges (default `0` each). Each takes what `padding-block` and
   *   `padding-inline` take, one value or a start and an end. The padding is inside the button, so
   *   it is pointer target too, and the focus ring goes round it.
   */
  className?: string;
}

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const;

/**
 * A heading row that opens and closes a region under it: the item of an accordion, not the
 * accordion (a stack with one open at a time is a later component). The region stays mounted
 * while closed and is `hidden`, so what is inside keeps its state and the trigger's
 * `aria-controls` always names an element that exists.
 */
export function Collapsible({
  heading,
  headingLevel = 3,
  headingAside,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  chevron = 'down-up',
  children,
  className,
}: CollapsibleProps) {
  // The `?? 'h3'` is for JavaScript callers, who are not held to the union: an out-of-range level
  // would otherwise resolve to `undefined` and throw in React as an invalid element type.
  const Heading = headingTags[headingLevel] ?? 'h3';
  // Base UI writes `aria-controls` on the trigger only while the panel is open. This panel is
  // always mounted, so the id is passed to both and the relationship holds when it is closed too.
  const panelId = useId();
  // The `end-down` chevron's closed turn depends on the reading direction. It is read from the page
  // and written straight to the node, as `Tree` and `DatePicker`'s `Calendar` do, so there is no
  // second render. Not `:dir()`: at the build's browser targets lightningcss rewrites it to a list
  // of `:lang()`, which ignores `dir`. A new or changed direction corrects the glyph rather than
  // changing its state, so it is written with the transition off (a closed group mounting in a
  // right-to-left page would otherwise turn from its first, left-to-right guess through a half
  // turn), and only when it differs, so a re-render mid-toggle leaves a running turn alone.
  const chevronRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const chevronElement = chevronRef.current;
    if (chevron !== 'end-down' || chevronElement === null) {
      return;
    }
    const readingDirection = getComputedStyle(chevronElement).direction;
    if (chevronElement.dataset.direction === readingDirection) {
      return;
    }
    chevronElement.style.transition = 'none';
    chevronElement.dataset.direction = readingDirection;
    // Reading the transform makes the browser apply the new turn while the transition is off.
    void getComputedStyle(chevronElement).transform;
    chevronElement.style.removeProperty('transition');
  });
  return (
    <BaseCollapsible.Root
      render={<section />}
      className={[styles.root, className].filter(Boolean).join(' ')}
      open={open}
      defaultOpen={defaultOpen}
      disabled={disabled}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
    >
      <Heading className={styles.heading}>
        <BaseCollapsible.Trigger className={styles.trigger} aria-controls={panelId}>
          <span className={styles.label}>{heading}</span>
          {/* A browser draws no space between flex items, but the accessible name joins the label
              and the aside only with this text node (jsdom computes both spans as inline). The
              aside's own span makes it a flex item even as plain text, so a disabled row dims it
              with the label and the chevron. */}
          {hasContent(headingAside) ? (
            <>
              {' '}
              <span>{headingAside}</span>
            </>
          ) : null}
          <span
            ref={chevronRef}
            className={styles.chevron}
            data-chevron={chevron}
            aria-hidden="true"
          >
            <ChevronDownIcon />
          </span>
        </BaseCollapsible.Trigger>
      </Heading>
      <BaseCollapsible.Panel id={panelId} className={styles.panel} keepMounted>
        {children}
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
