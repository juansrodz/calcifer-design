import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import {
  useCallback,
  useId,
  useRef,
  type FocusEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useOverflowFocusable } from '../../hooks/useOverflowFocusable';
import { usePortalContainer } from '../ThemeScope/PortalContainerContext';
import popupStyles from '../../styles/popup.module.css';
import { DialogContent } from './DialogContent';
import styles from './Dialog.module.css';

// The package's `types` carry no Node globals, so the declaration build does not know `process`.
// Declared at module scope, as in `TabBar`, so it never collides with a global `process`.
declare const process: { env: { NODE_ENV?: string } };

export type DialogVariant = 'center' | 'sheet';

/** The edge a sheet docks to: `bottom` is the phone pattern, `end` a full-height side panel. */
export type SheetSide = 'bottom' | 'end';

/**
 * Dialog's consumer hooks are custom properties set on a `ThemeScope` (whose portal host holds the
 * popup) or another ancestor of the popup. Each defaults to what the dialog drew before it:
 * - `--dialog-heading-size`, `--dialog-heading-tracking` and `--dialog-heading-leading` restyle
 *   the heading (default `--text-h3`, the heading tracking, the snug leading).
 * - `--sheet-handle-width` and `--sheet-handle-height` size the bottom sheet's grab handle.
 * - `--sheet-padding-block-start` is the space above the bottom sheet's handle,
 *   `--sheet-handle-gap` the space between the handle and the header, and
 *   `--sheet-padding-inline` the sheet's inline padding. `--drawer-padding-inline` is the end
 *   drawer's inline padding. The gap defaults to `--space-4`, the paddings to `--space-5` (24 px).
 *   Each takes a length with a unit (`0px`, not `0`, and no percentage; a development build warns
 *   about a bare number). The padding sits inside the popup's 1 px border.
 *
 * Under a thin inline padding the header insets the close so its 44 px touch target stays inside
 * the popup's rounded corner. In the bottom sheet, keep `--sheet-padding-block-start` plus
 * `--sheet-handle-gap` at 4 px or more (at the default radius) for the same reason. That floor
 * assumes the default 5 px handle (`--sheet-handle-height`), which sits between the two: a shorter
 * handle raises it by the difference.
 */
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
   * and focus then falls to `<body>`, or to a control an earlier popup remembered. `finalFocus`
   * says where it goes instead. It takes the same values as Base UI's `Dialog.Popup` `finalFocus`:
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
   * `tabIndex` (a heading needs `tabIndex={-1}`). An element that is not in the tab order hands
   * focus to its first tabbable descendant, so a `tabIndex={-1}` heading that holds a link focuses
   * the link. An element that cannot take focus, such as a plain heading, moves nothing: focus
   * falls to `<body>`, not to the default.
   *
   * A ref or function target also wins over focus that your own `onOpenChange` moves as the dialog
   * closes. `true`, or leaving it out, keeps Base UI's rule of leaving focus where the app put it.
   *
   * Set it on the outermost dialog. Leave it out on a dialog nested in another: closing the
   * nested one would send focus to the target while the outer modal is still open, out of the
   * focus trap.
   */
  finalFocus?: BaseDialog.Popup.Props['finalFocus'];
  /**
   * Holds back the focus ring on the control the dialog focuses as it opens, until a key is
   * pressed or focus leaves that control; then it draws as usual. A pointer user (mouse, touch,
   * pen) asked for no ring, and a phone browser can light one on scripted focus. Under forced
   * colours the ring is held back too, but the browser's own `Highlight` border on a focused
   * button stays, so focus still shows there.
   *
   * Only the focus the dialog places as it opens is held back: when focus is already inside at
   * open (an `autoFocus` field, a child that focuses itself), nothing is. A text field (an `input`
   * of a text type, a `textarea`, an editable element) is never held back: its ring shows where
   * typing goes. A slider, a date, a file or a colour input is held back like a button. A ring a
   * component draws on another element (a `ChoiceCard`'s card, an `Upload`'s face) is not.
   *
   * - left out: quiet when Base UI saw a pointer open the dialog through its `trigger`. A keyboard
   *   open, and an open it cannot see (no `trigger`, the app's own state), draw the ring.
   * - `true`: quiet for every open except a keyboard one Base UI saw. A dialog opened from app
   *   state passes it when the app knows a pointer (or a link) opened it.
   * - `false`: never quiet; the opening focus draws whatever the browser draws.
   */
  quietFocus?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  /** Base UI calls this as `(open, eventDetails)`; the second argument is passed through. */
  onOpenChange?: (open: boolean, eventDetails: unknown) => void;
}

const DIALOG_PARTS = {
  Title: BaseDialog.Title,
  Description: BaseDialog.Description,
  Close: BaseDialog.Close,
};
const DRAWER_PARTS = { Title: Drawer.Title, Description: Drawer.Description, Close: Drawer.Close };
// Drawer's scrim lets presses through while it closes; the sheet's has always caught them until
// it unmounts, as the centred dialog's still does.
const SCRIM_TAKES_PRESSES = { pointerEvents: 'auto' } as const;

/** The opens Base UI reports for a pointer: its `initialFocus` function receives one of these. */
const POINTER_OPENS = new Set(['mouse', 'touch', 'pen']);

/**
 * A control that takes typing: its ring says where the text goes, so it is never held back. The
 * text types only; a slider, a date, a file or a colour input is held back like a button.
 */
const TEXT_ENTRY = [
  'input:not([type])',
  ...['text', 'search', 'url', 'tel', 'email', 'password', 'number'].map(
    (inputType) => `input[type="${inputType}"]`,
  ),
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/**
 * Marks `element` so `Dialog.module.css` draws no focus ring on it, until a key is pressed
 * anywhere in its document or focus leaves it. Returns the function that lifts the mark early.
 */
function holdRingBack(element: HTMLElement): () => void {
  const ownerDocument = element.ownerDocument;
  const lift = () => {
    element.removeAttribute('data-quiet-focus');
    ownerDocument.removeEventListener('keydown', lift, true);
    element.removeEventListener('blur', lift);
  };
  element.setAttribute('data-quiet-focus', '');
  ownerDocument.addEventListener('keydown', lift, true);
  element.addEventListener('blur', lift);
  return lift;
}

/** The padding hooks each placement reads. */
const PADDING_HOOKS = {
  bottom: ['--sheet-padding-block-start', '--sheet-padding-inline', '--sheet-handle-gap'],
  end: ['--drawer-padding-inline'],
} as const;

const UNITLESS_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

/**
 * The padding hooks take a length with a unit. A bare number (`0`) is no length: the paddings
 * read it as nothing and fall back, and the handle gap's `calc()` is invalid and keeps 16 px. CSS
 * says nothing, so a development build says it here.
 */
function warnUnitlessPaddingHooks(popup: HTMLElement, side: SheetSide): void {
  const computed = getComputedStyle(popup);
  for (const hook of PADDING_HOOKS[side]) {
    const value = computed.getPropertyValue(hook).trim();
    if (UNITLESS_NUMBER.test(value)) {
      console.warn(
        `Dialog: ${hook} is "${value}", a number with no unit, which the dialog cannot use; write a length such as "${value}px".`,
      );
    }
  }
}

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
  quietFocus,
  open,
  defaultOpen,
  onOpenChange,
}: DialogProps) {
  // `side` reaches the DOM only for a sheet, so the skin's `[data-side='end']` rules can never
  // touch a centred dialog and the centred test can assert the attribute's absence.
  const sheetSide = variant === 'sheet' ? side : undefined;
  const container = usePortalContainer();
  const popupRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The quiet opening focus (`quietFocus`). A quiet open arms `disarmQuietRef`; the opening focus
  // Base UI then places takes that arming (`holdOpeningRingBack`) and marks its target, which
  // `liftQuietRef` unmarks. Base UI places no opening focus when focus is already inside (an
  // `autoFocus` field), so that open arms nothing; and any key disarms, so a focus that comes
  // after a key is never taken for the opening one.
  const disarmQuietRef = useRef<(() => void) | null>(null);
  const liftQuietRef = useRef<(() => void) | null>(null);
  const endQuiet = useCallback(() => {
    disarmQuietRef.current?.();
    liftQuietRef.current?.();
  }, []);
  // Base UI's own rule focuses the first tabbable control on open, which would be a slot button
  // whenever `headerEnd` holds one, and the popup itself on a touch open (so a phone sheet opens
  // with no ring on the close circle). This keeps the touch rule and otherwise targets the close
  // control; with `closeHidden` the ref is empty and `true` hands the choice back to Base UI.
  // Base UI passes the open's interaction type, `''` when no trigger saw it.
  const initialFocus = (interactionType: string) => {
    endQuiet();
    const popup = popupRef.current;
    const quiet =
      quietFocus === undefined
        ? POINTER_OPENS.has(interactionType)
        : quietFocus && interactionType !== 'keyboard';
    if (popup !== null && quiet && !popup.contains(popup.ownerDocument.activeElement)) {
      const ownerDocument = popup.ownerDocument;
      const disarm = () => {
        ownerDocument.removeEventListener('keydown', disarm, true);
        disarmQuietRef.current = null;
      };
      ownerDocument.addEventListener('keydown', disarm, true);
      disarmQuietRef.current = disarm;
    }
    return interactionType === 'touch' ? popup : (closeRef.current ?? true);
  };
  const holdOpeningRingBack = (event: FocusEvent<HTMLDivElement>) => {
    const disarm = disarmQuietRef.current;
    if (disarm === null) {
      return;
    }
    disarm();
    if (!event.target.matches(TEXT_ENTRY)) {
      liftQuietRef.current = holdRingBack(event.target);
    }
  };
  // Base UI's focus guards, the popup's siblings, pass a Tab that reaches one back into the popup
  // a frame later (`enqueueFocus`), so a second Tab inside that frame (a held key on a busy page)
  // goes on from the guard to the page behind. Focusing the popup itself at once keeps focus in
  // the trap through that frame; Base UI's own redirect then lands as it always did. Only this
  // dialog's own two guards, the viewport's children: React's focus event also bubbles here from
  // the guards of a popover or a nested dialog inside, which are theirs to handle.
  const holdFocusInTrap = (event: FocusEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      target.parentElement === event.currentTarget &&
      target.hasAttribute('data-base-ui-focus-guard')
    ) {
      popupRef.current?.focus({ preventScroll: true });
    }
  };
  // The popup's ref. On mount it checks the padding hooks: development only (the literal
  // `process.env.NODE_ENV` is the form a consumer's bundler replaces, as in `TabBar`), and not for
  // a centred dialog, which has no hooks. On unmount it ends any quiet focus, so a dialog closed
  // while quiet leaves no mark or listener behind. Stable per side, so React attaches it once per
  // mount rather than on every render.
  const attachPopup = useCallback(
    (popup: HTMLDivElement | null) => {
      popupRef.current = popup;
      if (popup === null) {
        endQuiet();
      } else if (sheetSide !== undefined && process.env.NODE_ENV !== 'production') {
        warnUnitlessPaddingHooks(popup, sheetSide);
      }
    },
    [endQuiet, sheetSide],
  );
  // A body that scrolls is a Tab stop while it overflows, named by the heading, so a keyboard can
  // scroll text that holds no control of its own (Safari makes no scroller focusable). A body that
  // fits adds no stop. The heading's id is ours so the body can point at it.
  const titleId = useId();
  const [bodyRef, bodyOverflows] = useOverflowFocusable<HTMLDivElement>();
  const contentProps = {
    showHandle: sheetSide === 'bottom',
    heading,
    headingLevel,
    headingHidden,
    headerStart,
    headerEnd,
    description,
    children,
    footer,
    closeLabel,
    closeVariant,
    closeHidden,
    closeRef,
    titleId,
    bodyRef,
    bodyOverflows,
  };
  const backdropProps = {
    className: [popupStyles.dialogLayer, popupStyles.scrim].join(' '),
    'data-variant': variant,
    'data-side': sheetSide,
  };
  const viewportProps = {
    className: [popupStyles.dialogLayer, styles.viewport].join(' '),
    'data-variant': variant,
    'data-side': sheetSide,
    onFocus: holdFocusInTrap,
  };
  const popupProps = {
    ref: attachPopup,
    className: [popupStyles.surface, styles.popup].join(' '),
    'data-popup': variant === 'sheet' ? 'sheet' : 'dialog',
    'data-side': sheetSide,
    // Modal (Base UI's default, which this wrapper never changes): focus is trapped and Base UI
    // hides the rest of the page with `aria-hidden` while open. Base UI does not write
    // `aria-modal`, so the popup says it here, as the DatePicker's calendar does.
    'aria-modal': 'true' as const,
    initialFocus,
    finalFocus,
    onFocus: holdOpeningRingBack,
  };
  if (variant === 'sheet') {
    return (
      <Drawer.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        disablePointerDismissal={!dismissOnOutsidePress}
        swipeDirection="down"
      >
        {trigger === undefined ? null : <Drawer.Trigger render={trigger} />}
        <Drawer.Portal container={container}>
          <Drawer.Backdrop {...backdropProps} style={SCRIM_TAKES_PRESSES} />
          <Drawer.Viewport {...viewportProps}>
            <Drawer.Popup {...popupProps}>
              <DialogContent parts={DRAWER_PARTS} {...contentProps} />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }
  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disablePointerDismissal={!dismissOnOutsidePress}
    >
      {trigger === undefined ? null : <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal container={container}>
        <BaseDialog.Backdrop {...backdropProps} />
        <BaseDialog.Viewport {...viewportProps}>
          <BaseDialog.Popup {...popupProps}>
            <DialogContent parts={DIALOG_PARTS} {...contentProps} />
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
