import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import styles from './Collapsible.module.css';

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
  children: ReactNode;
  /**
   * A class for the root, joined after the component's own. It is how a consumer sets the one
   * size hook, `--collapsible-heading-size`, which resizes the heading (default `--text-md`). Like
   * any custom property the hook inherits, so a wrapper that sets it resizes every collapsible
   * inside it.
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
  children,
  className,
}: CollapsibleProps) {
  // The `?? 'h3'` is for JavaScript callers, who are not held to the union: an out-of-range level
  // would otherwise resolve to `undefined` and throw in React as an invalid element type.
  const Heading = headingTags[headingLevel] ?? 'h3';
  // Base UI writes `aria-controls` on the trigger only while the panel is open. This panel is
  // always mounted, so the id is passed to both and the relationship holds when it is closed too.
  const panelId = useId();
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
              and the aside only with this text node (jsdom computes both spans as inline). */}
          {headingAside === undefined ? null : ' '}
          {headingAside}
          <span className={styles.chevron} aria-hidden="true">
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
