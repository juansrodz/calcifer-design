import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ReactElement, ReactNode } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';
import { IconButton } from '../IconButton/IconButton';
import popupStyles from '../../styles/popup.module.css';
import styles from './Dialog.module.css';

export type DialogVariant = 'center' | 'sheet';

/** The edge a sheet docks to: `bottom` is the phone pattern, `end` a full-height side panel. */
export type SheetSide = 'bottom' | 'end';

export interface DialogProps {
  /**
   * The control that opens the dialog. Optional: a dialog driven by application state passes
   * `open` and `onOpenChange` instead and renders no trigger at all.
   */
  trigger?: ReactElement;
  /** Names the popup: it is both the visible heading and the popup's `aria-labelledby` target. */
  heading: string;
  headingLevel?: 2 | 3 | 4;
  /** Sits under the heading and becomes the popup's `aria-describedby` target. */
  description?: ReactNode;
  children?: ReactNode;
  /**
   * Pinned below the scrolling body; put the confirming action here. These controls are the
   * caller's own — the header's close control always closes the dialog, and a footer control
   * that needs to close it does so through `open`/`onOpenChange`.
   */
  footer?: ReactNode;
  /** `center` floats in the middle of the viewport; `sheet` docks to an edge — see `side`. */
  variant?: DialogVariant;
  /**
   * The edge a `sheet` docks to. `bottom` (the default) is the phone pattern; `end` is a
   * full-height panel on the trailing edge, for an item editor or a filter drawer. Ignored when
   * `variant` is `center`, and not rendered for it.
   */
  side?: SheetSide;
  /** The accessible name of the close control in the header. */
  closeLabel?: string;
  /**
   * Whether a press outside the popup closes it. Escape always does: Base UI has no prop for
   * that, and vetoing it means cancelling the event inside `onOpenChange`, which this wrapper
   * deliberately does not expose.
   */
  dismissOnOutsidePress?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  /** Base UI calls this as `(open, eventDetails)`; the second argument is passed through. */
  onOpenChange?: (open: boolean, eventDetails: unknown) => void;
}

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export function Dialog({
  trigger,
  heading,
  headingLevel = 2,
  description,
  children,
  footer,
  variant = 'center',
  side = 'bottom',
  closeLabel = 'Close',
  dismissOnOutsidePress = true,
  open,
  defaultOpen,
  onOpenChange,
}: DialogProps) {
  // `side` reaches the DOM only for a sheet, so the skin's `[data-side='end']` rules can never
  // touch a centred dialog and the centred test can assert the attribute's absence.
  const sheetSide = variant === 'sheet' ? side : undefined;
  // The `?? 'h2'` is for JavaScript callers, who are not held to the `2 | 3 | 4` union: an
  // out-of-range level would otherwise resolve to `undefined` and throw in React as an invalid
  // element type. `@calcifer-design/ui` is consumed from JavaScript apps.
  const Heading = headingTags[headingLevel] ?? 'h2';
  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disablePointerDismissal={!dismissOnOutsidePress}
    >
      {trigger === undefined ? null : <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={[popupStyles.dialogLayer, popupStyles.scrim].join(' ')} />
        <BaseDialog.Viewport
          className={[popupStyles.dialogLayer, styles.viewport].join(' ')}
          data-variant={variant}
          data-side={sheetSide}
        >
          <BaseDialog.Popup
            className={popupStyles.surface}
            data-popup={variant === 'sheet' ? 'sheet' : 'dialog'}
            data-side={sheetSide}
          >
            <div className={styles.header}>
              <BaseDialog.Title className={styles.heading} render={<Heading />}>
                {heading}
              </BaseDialog.Title>
              <BaseDialog.Close
                render={
                  <IconButton label={closeLabel} variant="ghost" size="sm">
                    <CloseIcon />
                  </IconButton>
                }
              />
            </div>
            {description === undefined ? null : (
              <BaseDialog.Description className={styles.description}>
                {description}
              </BaseDialog.Description>
            )}
            {children === undefined ? null : <div className={styles.body}>{children}</div>}
            {footer === undefined ? null : <div className={styles.footer}>{footer}</div>}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
