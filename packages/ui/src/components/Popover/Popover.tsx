import { Popover as BasePopover } from '@base-ui/react/popover';
import type { ReactElement, ReactNode } from 'react';
import a11yStyles from '../../styles/a11y.module.css';
import popupStyles from '../../styles/popup.module.css';
import styles from './Popover.module.css';

export type PopupSide = 'top' | 'bottom' | 'left' | 'right';
export type PopupAlign = 'start' | 'center' | 'end';

export interface PopoverProps {
  /**
   * The control that opens the popover, rendered as the trigger itself: Base UI merges
   * `aria-haspopup`, `aria-expanded` and `aria-controls` onto this element, so it must be a
   * single element that produces a native `<button>` — `Button` and `IconButton` both do.
   */
  trigger: ReactElement;
  /** Names the popup: it is both the visible heading and the popup's `aria-labelledby` target. */
  heading: string;
  headingLevel?: 2 | 3 | 4;
  /** Sits under the heading and becomes the popup's `aria-describedby` target. */
  description?: ReactNode;
  children?: ReactNode;
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the anchor and the popup, in pixels. */
  sideOffset?: number;
  /**
   * `true` locks page scroll, blocks pointer interaction outside, and paints the scrim.
   * `'trap-focus'` traps focus and nothing else: page scroll keeps working and clicks outside
   * still land, so it paints **no** scrim — a full-viewport wash that swallows every outside
   * click is exactly what that mode exists not to do. `false`, the default, does none of it.
   *
   * Either truthy value renders the visually-hidden close control below, because Base UI only
   * arms its focus trap when a `Popover.Close` is present inside the popup — `modal` on its own
   * traps nothing, silently — and because a touch screen reader needs a way out of the popup.
   */
  modal?: boolean | 'trap-focus';
  /** The accessible name of that close control. */
  closeLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  /**
   * Base UI calls this as `(open, eventDetails)`; a handler that takes only the first argument
   * is what most callers want, and the second is passed through untouched for one that doesn't.
   */
  onOpenChange?: (open: boolean, eventDetails: unknown) => void;
}

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export function Popover({
  trigger,
  heading,
  headingLevel = 3,
  description,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  modal = false,
  closeLabel = 'Close',
  open,
  defaultOpen,
  onOpenChange,
}: PopoverProps) {
  // The `?? 'h3'` is for JavaScript callers, who are not held to the `2 | 3 | 4` union: an
  // out-of-range level would otherwise resolve to `undefined` and throw in React as an invalid
  // element type. `@calcifer-design/ui` is consumed from JavaScript apps.
  const Heading = headingTags[headingLevel] ?? 'h3';
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        {/* Only full `modal`, never `'trap-focus'`. Base UI's backdrop is a hit-testable element
            unless the popover was opened by hover (`PopoverBackdrop.js` sets
            `pointerEvents: 'none'` for `REASONS.triggerHover` and for nothing else), and the
            shared `.scrim` is `position: fixed; inset: 0`. Rendering it under `'trap-focus'`
            would block every outside click and wash the page over, which is precisely the
            behaviour that mode is documented as leaving alone. */}
        {modal === true ? (
          <BasePopover.Backdrop className={[popupStyles.layer, popupStyles.scrim].join(' ')} />
        ) : null}
        <BasePopover.Positioner
          className={popupStyles.layer}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BasePopover.Popup className={popupStyles.surface} data-popup="popover">
            <BasePopover.Title className={styles.heading} render={<Heading />}>
              {heading}
            </BasePopover.Title>
            {description === undefined ? null : (
              <BasePopover.Description className={styles.description}>
                {description}
              </BasePopover.Description>
            )}
            {children}
            {modal === false ? null : (
              <BasePopover.Close className={a11yStyles.visuallyHidden}>
                {closeLabel}
              </BasePopover.Close>
            )}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
