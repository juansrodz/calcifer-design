import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { useRef, type ReactElement, type ReactNode } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';
import { IconButton } from '../IconButton/IconButton';
import { usePortalContainer } from '../ThemeScope/PortalContainerContext';
import a11yStyles from '../../styles/a11y.module.css';
import popupStyles from '../../styles/popup.module.css';
import { hasContent } from '../../utils/hasContent';
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
  /**
   * Hides the heading from view while it stays the popup's name (`aria-labelledby`), for a dialog
   * whose own content already says what it is. The header's end group keeps its place at the end.
   */
  headingHidden?: boolean;
  /**
   * Content before the heading in the header row, such as a `Tag` naming the kind of thing the
   * dialog is about.
   */
  headerStart?: ReactNode;
  /**
   * Controls grouped at the end of the header, before the close control, such as a "More" menu
   * button. On open, focus lands on the close control, except with `closeHidden`, when it goes to
   * the first tabbable control, which may be a `headerEnd` button.
   */
  headerEnd?: ReactNode;
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
   * `ghost` (the default) is the bare close; `soft` is the quiet filled circle the mock draws on a
   * photo or a tinted header. The close is drawn as a 36 px circle in both, with a 44 px touch
   * target, never a larger button.
   */
  closeVariant?: 'ghost' | 'soft';
  /**
   * Draws no close control. The caller renders its own visible way out (a "Cancel" in the footer);
   * Escape and a press on the scrim still close the dialog, and `headerEnd` still renders. With no
   * close control the opening focus goes to the first tabbable control in the popup.
   */
  closeHidden?: boolean;
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
  headingHidden = false,
  headerStart,
  headerEnd,
  description,
  children,
  footer,
  variant = 'center',
  side = 'bottom',
  closeLabel = 'Close',
  closeVariant = 'ghost',
  closeHidden = false,
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
  const container = usePortalContainer();
  const popupRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Base UI's own rule focuses the first tabbable control on open, which would be a slot button
  // whenever `headerEnd` holds one, and the popup itself on a touch open (so a phone sheet opens
  // with no ring on the close circle). This keeps the touch rule and otherwise targets the close
  // control; with `closeHidden` the ref is empty and `true` hands the choice back to Base UI.
  const initialFocus = (interactionType: string) =>
    interactionType === 'touch' ? popupRef.current : (closeRef.current ?? true);
  const showEndGroup = hasContent(headerEnd) || !closeHidden;
  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disablePointerDismissal={!dismissOnOutsidePress}
    >
      {trigger === undefined ? null : <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal container={container}>
        <BaseDialog.Backdrop
          className={[popupStyles.dialogLayer, popupStyles.scrim].join(' ')}
          data-variant={variant}
          data-side={sheetSide}
        />
        <BaseDialog.Viewport
          className={[popupStyles.dialogLayer, styles.viewport].join(' ')}
          data-variant={variant}
          data-side={sheetSide}
        >
          <BaseDialog.Popup
            ref={popupRef}
            className={popupStyles.surface}
            data-popup={variant === 'sheet' ? 'sheet' : 'dialog'}
            data-side={sheetSide}
            initialFocus={initialFocus}
          >
            {sheetSide === 'bottom' ? <div className={styles.handle} aria-hidden="true" /> : null}
            <div className={styles.header}>
              {headerStart}
              <BaseDialog.Title
                className={[styles.heading, headingHidden ? a11yStyles.visuallyHidden : undefined]
                  .filter(Boolean)
                  .join(' ')}
                render={<Heading />}
              >
                {heading}
              </BaseDialog.Title>
              {showEndGroup ? (
                <div className={styles.headerEnd}>
                  {headerEnd}
                  {closeHidden ? null : (
                    <BaseDialog.Close
                      ref={closeRef}
                      render={
                        <IconButton
                          label={closeLabel}
                          variant={closeVariant}
                          size="sm"
                          className={styles.close}
                        >
                          <CloseIcon />
                        </IconButton>
                      }
                    />
                  )}
                </div>
              ) : null}
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
