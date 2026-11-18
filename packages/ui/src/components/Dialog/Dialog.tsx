import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { useId, useRef, type ReactElement, type ReactNode } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';
import { useOverflowFocusable } from '../../hooks/useOverflowFocusable';
import { IconButton } from '../IconButton/IconButton';
import { usePortalContainer } from '../ThemeScope/PortalContainerContext';
import a11yStyles from '../../styles/a11y.module.css';
import closeCircleStyles from '../../styles/closeCircle.module.css';
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
  /**
   * Where focus goes when the dialog closes. Left out, Base UI returns it to the `trigger`, or to
   * whatever held focus when the dialog opened. A dialog opened with no trigger and no focused
   * control (from a URL parameter, say), or whose opener unmounted while it was open, has neither,
   * and focus then falls to `<body>`, or to a control an earlier popup remembered. Pass
   * `finalFocus` to say where it goes instead.
   *
   * - a ref: focus moves to that ref's element, in preference to the trigger. A ref with nothing
   *   in it falls back to the default.
   * - a function: called as the dialog closes with how it was closed (`'mouse'`, `'touch'`,
   *   `'pen'`, `'keyboard'`, or `''` when that is unknown). Return an element to focus it, or
   *   `true` or `null` for the default. Return `false` or nothing (`undefined`) to move focus
   *   nowhere, so write `ref.current ?? null`, not `ref.current ?? undefined`, to keep the default
   *   while a ref is empty.
   * - `false`: move focus nowhere, not even back to the trigger.
   * - `true`, or left out: the default above.
   *
   * The element has to be able to take focus: a button, a link, a field, or an element with a
   * `tabIndex`. A heading needs `tabIndex={-1}`. An element that is not in the tab order but holds
   * a tabbable one hands focus to the first such descendant, so a `tabIndex={-1}` heading that
   * holds a link focuses the link. An element that cannot take focus (a plain heading) moves
   * nothing, so focus falls to `<body>`; it does not fall back to the default.
   *
   * An element named by a ref or a function also wins over focus that your own `onOpenChange`
   * moves as the dialog closes. `true`, or leaving it out, keeps Base UI's rule of leaving focus
   * where the app put it.
   *
   * Set it on the outermost dialog. Leave it out on a dialog nested in another: closing the
   * nested one would send focus to the target while the outer modal is still open, out of the
   * focus trap.
   *
   * It takes the same values as Base UI's `Dialog.Popup` `finalFocus`.
   */
  finalFocus?: BaseDialog.Popup.Props['finalFocus'];
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
  finalFocus,
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
  // A body that scrolls is a Tab stop while it overflows, named by the heading, so a keyboard can
  // scroll text that holds no control of its own (Safari makes no scroller focusable). A body that
  // fits adds no stop. The heading's id is ours so the body can point at it.
  const titleId = useId();
  const [bodyRef, bodyOverflows] = useOverflowFocusable<HTMLDivElement>();
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
            // Modal (Base UI's default, which this wrapper never changes): focus is trapped and
            // Base UI hides the rest of the page with `aria-hidden` while open. Base UI does not
            // write `aria-modal`, so the popup says it here, as the DatePicker's calendar does.
            aria-modal="true"
            initialFocus={initialFocus}
            finalFocus={finalFocus}
          >
            {sheetSide === 'bottom' ? <div className={styles.handle} aria-hidden="true" /> : null}
            <div className={styles.header}>
              {headerStart}
              <BaseDialog.Title
                id={titleId}
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
                          className={closeCircleStyles.close}
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
            {children === undefined ? null : (
              <div
                ref={bodyRef}
                className={styles.body}
                {...(bodyOverflows
                  ? { tabIndex: 0, role: 'region', 'aria-labelledby': titleId }
                  : undefined)}
              >
                {children}
              </div>
            )}
            {footer === undefined ? null : <div className={styles.footer}>{footer}</div>}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
