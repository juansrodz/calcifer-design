import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Tag } from '../Tag/Tag';
import { TextInput } from '../TextInput/TextInput';
import { demoTheme, demoThemeCss } from '../ThemeScope/fixtures';
import { ThemeScope } from '../ThemeScope/ThemeScope';
import { Dialog, type DialogProps } from './Dialog';
import { swipe, swipeStage } from './swipeGesture';

/** A three-dot glyph for the header's "More" button; the library ships no such icon. */
function MoreGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="3" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="13" cy="8" r="1.25" />
    </svg>
  );
}

/** Enough paragraphs that a sheet's body has to scroll, so the pinned footer is the point. */
const longBody = Array.from({ length: 24 }, (_unused, index) => (
  <p key={index}>
    Line {index + 1}: anyone already on /projects/showcase will get the not-found page until the
    remote is registered again.
  </p>
));

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  args: {
    trigger: <Button variant="secondary">Remove remote</Button>,
    heading: 'Remove the showcase remote?',
    description: 'It disappears from the registry; the deployment itself is untouched.',
    children: <p>Anyone already on /projects/showcase will get the not-found page.</p>,
    footer: <Button size="sm">Remove</Button>,
  },
  argTypes: {
    variant: { control: 'radio', options: ['center', 'sheet'] },
    side: { control: 'radio', options: ['bottom', 'end'] },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const OpenOnLoad: Story = { args: { defaultOpen: true } };
export const Sheet: Story = { args: { variant: 'sheet', defaultOpen: true } };
export const SideSheet: Story = { args: { variant: 'sheet', side: 'end', defaultOpen: true } };
export const Persistent: Story = { args: { defaultOpen: true, dismissOnOutsidePress: false } };

/** Opens from the keyboard and checks that focus is inside the dialog, not behind it. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remove remote' }).focus();
    await userEvent.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog', { name: 'Remove the showcase remote?' });
    // Base UI moves focus a frame after the popup mounts, so the assertion waits for it.
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
  },
};

/**
 * A sheet whose opener leaves the page while the sheet is open, as an item's does when the list
 * behind it re-renders. Base UI has no trigger or focused control left to return to, so
 * `finalFocus` names where focus goes on close: the "Potluck dinners" heading, which needs
 * `tabIndex={-1}` to take focus. Without it, focus would fall to the page body.
 */
export const FinalFocus: Story = {
  args: { variant: 'sheet', trigger: undefined, heading: 'Potluck salad' },
  render: function FinalFocusRender(args) {
    const [open, setOpen] = useState(false);
    const returnRef = useRef<HTMLHeadingElement>(null);
    return (
      <>
        <h3 ref={returnRef} tabIndex={-1}>
          Potluck dinners
        </h3>
        {open ? null : (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Open item
          </Button>
        )}
        <Dialog
          {...args}
          open={open}
          onOpenChange={(nextOpen) => setOpen(nextOpen)}
          finalFocus={returnRef}
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open item' }));
    const popup = await screen.findByRole('dialog', { name: 'Potluck salad' });
    // Base UI moves focus a frame after the popup mounts; closing before that proves nothing.
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Potluck dinners' })).toHaveFocus(),
    );
  },
};

/**
 * The header takes a slot before the heading and a group of controls after it. The soft close sits
 * beside a soft "More" button; the close stays the 36 px circle (the "More" button is `md`).
 */
export const HeaderSlots: Story = {
  args: {
    defaultOpen: true,
    heading: 'Pasta night',
    headerStart: <Tag>Draft</Tag>,
    headerEnd: (
      <IconButton variant="soft" label="More">
        <MoreGlyph />
      </IconButton>
    ),
    closeVariant: 'soft',
  },
};

/** The heading names the dialog for assistive technology but is not drawn. */
export const HiddenHeading: Story = {
  args: { defaultOpen: true, headingHidden: true, headerStart: <Tag>Draft</Tag> },
};

/** A bottom sheet whose body scrolls under a footer that stays pinned to the sheet's foot. */
export const SheetWithFooter: Story = {
  args: {
    variant: 'sheet',
    defaultOpen: true,
    children: longBody,
    footer: <Button>Register the remote</Button>,
  },
};

/**
 * A centred dialog whose body is long enough to scroll. While it overflows, the body is a Tab stop
 * (a region named by the heading), so a keyboard can scroll text that holds no control.
 */
export const LongBody: Story = { args: { defaultOpen: true, children: longBody } };

/** The same pinned footer in a full-height panel on the trailing edge. */
export const SideSheetWithFooter: Story = {
  args: {
    variant: 'sheet',
    side: 'end',
    defaultOpen: true,
    children: longBody,
    footer: <Button>Register the remote</Button>,
  },
};

/**
 * A sheet with no header close: the footer's "Cancel" is the visible way out, and Escape and the
 * scrim still close it. Focus opens on the text field, the first tabbable control.
 */
export const HiddenClose: Story = {
  args: {
    variant: 'sheet',
    closeHidden: true,
    heading: 'Rename the remote',
    description: undefined,
  },
  render: function HiddenCloseRender(args) {
    const [open, setOpen] = useState(false);
    return (
      <Dialog
        {...args}
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        footer={
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        }
      >
        <Field label="Name">
          <TextInput defaultValue="Showcase" />
        </Field>
      </Dialog>
    );
  },
};

/**
 * A consumer restyles the heading and the sheet's grab handle through five custom properties set
 * on a `ThemeScope` (whose portal host holds the popup) or a DOM ancestor of the popup. The popup
 * portals out of the story's own tree, so the story stylesheet reaches it by its `data-popup`
 * attribute rather than by a wrapper class.
 */
export const HeadingHooks: Story = {
  args: { variant: 'sheet', defaultOpen: true },
  decorators: [
    (Story) => (
      <>
        <style>
          {`[data-popup='sheet'] {
  --dialog-heading-size: var(--text-h2);
  --dialog-heading-tracking: var(--tracking-display);
  --dialog-heading-leading: var(--leading-display);
  --sheet-handle-width: 2.75rem;
  --sheet-handle-height: 0.25rem;
}`}
        </style>
        <Story />
      </>
    ),
  ],
};

/**
 * The hooks as a consumer sets them: from a class on a `ThemeScope`, whose portal host holds the
 * popup, so they inherit into it. These are the WBW mock's container metrics (11b, 11a). The three
 * paddings are a pixel under the mock's figures for the popup's 1 px border: the bottom sheet's
 * handle 10 px down and its content 20 px in, the drawer's content 28 px in. The handle gap is the
 * mock's 12 px as it stands. The scope sets the sheet's hooks and the drawer's together, as an app
 * that switches placement by width would.
 */
const paddingHooksCss = `.dialog-padding-hooks {
  --sheet-padding-block-start: 9px;
  --sheet-padding-inline: 19px;
  --sheet-handle-gap: 12px;
  --drawer-padding-inline: 27px;
}`;

/** Waits for the popup's opening transition, which moves it (and scales a centred one). */
async function settledDialog(): Promise<HTMLElement> {
  const popup = await screen.findByRole('dialog');
  await waitFor(() => expect(popup).not.toHaveAttribute('data-starting-style'));
  await Promise.all(popup.getAnimations().map((animation) => animation.finished));
  return popup;
}

const playPaddingHooks: Story['play'] = async () => {
  const popup = await settledDialog();
  const popupStyle = getComputedStyle(popup);
  if (popup.dataset['side'] === 'end') {
    // The drawer reads its own hook alone: the sheet's block-start hook does not reach it.
    await expect(popupStyle.paddingInlineStart).toBe('27px');
    await expect(popupStyle.paddingInlineEnd).toBe('27px');
    await expect(popupStyle.paddingBlockStart).toBe('24px');
    await expect(popupStyle.paddingBlockEnd).toBe('24px');
    return;
  }
  await expect(popupStyle.paddingBlockStart).toBe('9px');
  await expect(popupStyle.paddingInlineStart).toBe('19px');
  await expect(popupStyle.paddingInlineEnd).toBe('19px');
  await expect(popupStyle.paddingBlockEnd).toBe('24px');
  const handle = popup.firstElementChild;
  const header = within(popup).getByRole('heading').parentElement;
  if (!(handle instanceof HTMLElement) || header === null) {
    throw new Error('the bottom sheet has no handle or no header');
  }
  const popupBox = popup.getBoundingClientRect();
  const handleBox = handle.getBoundingClientRect();
  // The handle sits under the 1 px border and the 9 px padding; the header 12 px under the handle.
  await expect(handleBox.top - popupBox.top).toBeCloseTo(10, 1);
  await expect(header.getBoundingClientRect().top - handleBox.bottom).toBeCloseTo(12, 1);
};

/** A bottom sheet padded through the hooks; the play reads the padding the popup computes. */
export const PaddingHooks: Story = {
  args: { variant: 'sheet', defaultOpen: true },
  decorators: [
    (Story) => (
      <>
        <style>{`${demoThemeCss}\n${paddingHooksCss}`}</style>
        <ThemeScope theme={demoTheme} className="dialog-padding-hooks">
          <Story />
        </ThemeScope>
      </>
    ),
  ],
  play: playPaddingHooks,
};

/** The same scope around an end drawer: only the drawer's own hook reaches it. */
export const DrawerPaddingHooks: Story = {
  ...PaddingHooks,
  args: { ...PaddingHooks.args, side: 'end' },
  play: playPaddingHooks,
};

/**
 * The hooks at their floor: the inline paddings at `0px`, and the bottom sheet's top padding at
 * `0px` with a 4 px handle gap, the least that keeps the close clear of the corner at the default
 * radius. The close's 44 px target reaches 4 px past its 36 px circle and the popup clips at its
 * rounded corner, so the header insets the close. The play presses each corner of the target, past
 * the circle, and checks that the popup does not scroll sideways.
 */
const floorCss = `.dialog-padding-floor {
  --sheet-padding-block-start: 0px;
  --sheet-padding-inline: 0px;
  --sheet-handle-gap: 4px;
  --drawer-padding-inline: 0px;
}`;

const playAtTheFloor: Story['play'] = async () => {
  const popup = await settledDialog();
  await expect(getComputedStyle(popup).paddingInlineEnd).toBe('0px');
  const close = within(popup).getByRole('button', { name: 'Close' });
  const closeBox = close.getBoundingClientRect();
  const reach = (44 - closeBox.width) / 2;
  const target = {
    left: closeBox.left - reach,
    right: closeBox.right + reach,
    top: closeBox.top - reach,
    bottom: closeBox.bottom + reach,
  };
  const popupBox = popup.getBoundingClientRect();
  // The target's box sits inside the popup's padding box, inside the 1 px border.
  await expect(target.top).toBeGreaterThanOrEqual(popupBox.top + popup.clientTop);
  await expect(target.right).toBeLessThanOrEqual(
    popupBox.left + popup.clientLeft + popup.clientWidth,
  );
  // Half a pixel inside each corner of the target: the press still lands on the close.
  for (const [horizontal, vertical] of [
    [target.left + 0.5, target.top + 0.5],
    [target.right - 0.5, target.top + 0.5],
    [target.left + 0.5, target.bottom - 0.5],
    [target.right - 0.5, target.bottom - 0.5],
  ] as const) {
    await expect(close.contains(document.elementFromPoint(horizontal, vertical))).toBe(true);
  }
  await expect(popup.scrollWidth).toBe(popup.clientWidth);
};

/** The bottom sheet at the floor. */
export const SheetAtTheFloor: Story = {
  args: { variant: 'sheet', defaultOpen: true },
  decorators: [
    (Story) => (
      <>
        <style>{`${demoThemeCss}\n${floorCss}`}</style>
        <ThemeScope theme={demoTheme} className="dialog-padding-floor">
          <Story />
        </ThemeScope>
      </>
    ),
  ],
  play: playAtTheFloor,
};

/** The end drawer at the floor, its close in the drawer's square end corner. */
export const DrawerAtTheFloor: Story = {
  ...SheetAtTheFloor,
  args: { ...SheetAtTheFloor.args, side: 'end' },
  play: playAtTheFloor,
};

/**
 * Opened with the pointer: the close takes focus with its ring held back, as a pointer user asked
 * for none, and the first key lets it back. A keyboard open (`KeyboardOpen`) draws it at once.
 */
export const QuietPointerOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove remote' }));
    const close = await screen.findByRole('button', { name: 'Close' });
    await waitFor(() => expect(close).toHaveFocus());
    await expect(close).toHaveAttribute('data-quiet-focus');
    await expect(getComputedStyle(close).outlineStyle).toBe('none');
    await userEvent.keyboard('{Shift}');
    await expect(close).not.toHaveAttribute('data-quiet-focus');
    await waitFor(() => expect(getComputedStyle(close).outlineStyle).toBe('solid'));
  },
};

/** The window event `QuietReopenMidClose`'s play sends to stand in for the app's own state. */
const APP_STATE_EVENT = 'dialog-story-app-state';

interface AppDialogState {
  open: boolean;
  quietFocus: boolean;
}

function sendAppState(state: AppDialogState): void {
  window.dispatchEvent(new CustomEvent<AppDialogState>(APP_STATE_EVENT, { detail: state }));
}

/**
 * A dialog the app reopens from its own state while it is still closing, as a live update can:
 * opened quietly (`quietFocus`, no trigger), closed, then reopened mid-close with the ring wanted
 * (`quietFocus={false}`). Nothing moves focus in between, so the close keeps it, still marked
 * quiet, and Base UI keeps the same popup: the reopen ends the earlier quiet mark before it places
 * the opening focus, so the ring draws.
 *
 * The `play` stands in for the app, setting `open` and `quietFocus` through a window event (an
 * args update would end the test runner's play early), and holds the closing transition still so
 * the reopen lands mid-close however busy the machine is.
 */
export const QuietReopenMidClose: Story = {
  args: { trigger: undefined },
  render: function QuietReopenMidCloseRender(args) {
    const [state, setState] = useState<AppDialogState>({ open: true, quietFocus: true });
    useEffect(() => {
      const takeState = (event: Event) => setState((event as CustomEvent<AppDialogState>).detail);
      window.addEventListener(APP_STATE_EVENT, takeState);
      return () => window.removeEventListener(APP_STATE_EVENT, takeState);
    }, []);
    return (
      <Dialog
        {...args}
        open={state.open}
        quietFocus={state.quietFocus}
        onOpenChange={(nextOpen) => setState((current) => ({ ...current, open: nextOpen }))}
      />
    );
  },
  play: async () => {
    const popup = await settledDialog();
    const close = within(popup).getByRole('button', { name: 'Close' });
    await waitFor(() => expect(close).toHaveFocus());
    await expect(close).toHaveAttribute('data-quiet-focus');

    sendAppState({ open: false, quietFocus: true });
    await waitFor(() => expect(popup).toHaveAttribute('data-ending-style'));
    for (const animation of popup.getAnimations()) {
      animation.pause();
    }
    // Mid-close: the popup is still there and the close still holds focus, marked quiet.
    await expect(popup.isConnected).toBe(true);
    await expect(close).toHaveFocus();
    await expect(close).toHaveAttribute('data-quiet-focus');

    sendAppState({ open: true, quietFocus: false });
    await waitFor(() => expect(popup).not.toHaveAttribute('data-ending-style'));
    // The same popup, reopened, not a fresh one mounted after the close finished.
    await expect(screen.getByRole('dialog')).toBe(popup);
    await waitFor(() => expect(close).toHaveFocus());
    await expect(close).not.toHaveAttribute('data-quiet-focus');
    await waitFor(() => expect(getComputedStyle(close).outlineStyle).toBe('solid'));
  },
};

/**
 * The end drawer in a right-to-left page: it docks on the inline end, the left, and rounds its
 * inline-start corners, the right pair, while the two that meet the viewport's edges stay square.
 * It slides out to the left as it closes.
 */
export const SideSheetRightToLeft: Story = {
  args: { variant: 'sheet', side: 'end', defaultOpen: true, heading: 'تعديل الطبق' },
  decorators: [
    (Story) => (
      <div dir="rtl">
        <style>{demoThemeCss}</style>
        <ThemeScope theme={demoTheme}>
          <Story />
        </ThemeScope>
      </div>
    ),
  ],
  play: async () => {
    const popup = await settledDialog();
    const popupStyle = getComputedStyle(popup);
    await expect(popupStyle.direction).toBe('rtl');
    await expect(popup.getBoundingClientRect().left).toBeCloseTo(0, 0);
    await expect(popupStyle.borderTopLeftRadius).toBe('0px');
    await expect(popupStyle.borderBottomLeftRadius).toBe('0px');
    await expect(popupStyle.borderTopRightRadius).not.toBe('0px');
    await expect(popupStyle.borderBottomRightRadius).toBe(popupStyle.borderTopRightRadius);
    // The slide, read from the closing transition itself.
    await userEvent.keyboard('{Escape}');
    const slide = await waitFor(() => {
      const transition = popup
        .getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSTransition && animation.transitionProperty === 'transform',
        );
      if (transition === undefined) {
        throw new Error('the drawer has no transform transition yet');
      }
      return transition;
    });
    // Held halfway through, the drawer's painted position lies off its left edge.
    slide.pause();
    const halfway = Number(slide.effect?.getComputedTiming().duration ?? 0) / 2;
    slide.currentTime = halfway;
    const slidTo = new DOMMatrixReadOnly(getComputedStyle(popup).transform);
    slide.finish();
    await expect(halfway).toBeGreaterThan(0);
    await expect(slidTo.m41).toBeLessThan(0);
  },
};

/**
 * The 200% text stories run in a real 390 px phone window (the `mobile` viewport, which the test
 * runner sizes its page to as the Storybook toolbar does) with the root at twice the size. The
 * viewport's gutter is `--space-4`, which doubles with the text: the popup is 326 px, not the
 * 358 px a 16 px gutter would leave.
 */
const doubleText = 'html { font-size: 200%; }';

/**
 * The play for the 200% text stories: the end group and the heading stay inside the popup's
 * padding box, the heading holds its text (nothing runs past its box), no line of it crosses the
 * end group, a word breaks only when it is wider than the whole header row, and the close stays
 * the 36 px circle (twice that here, as the text is twice its size).
 */
const playHeadingAtDoubleText: Story['play'] = async () => {
  // The phone's own window, not a wider one with the popup pinned to a phone's width.
  await expect(window.innerWidth).toBe(390);
  const popup = await settledDialog();
  const heading = within(popup).getByRole('heading');
  const close = within(popup).getByRole('button', { name: 'Close' });
  const header = heading.parentElement;
  const endGroup = close.parentElement;
  if (header === null || endGroup === null) {
    throw new Error('the heading has no header row, or the close no end group');
  }
  const popupBox = popup.getBoundingClientRect();
  const popupStyle = getComputedStyle(popup);
  const contentLeft =
    popupBox.left + parseFloat(popupStyle.borderLeftWidth) + parseFloat(popupStyle.paddingLeft);
  const contentRight =
    popupBox.right - parseFloat(popupStyle.borderRightWidth) - parseFloat(popupStyle.paddingRight);
  const groupBox = endGroup.getBoundingClientRect();
  await expect(groupBox.left).toBeGreaterThanOrEqual(contentLeft - 0.5);
  await expect(groupBox.right).toBeLessThanOrEqual(contentRight + 0.5);
  const headingBox = heading.getBoundingClientRect();
  await expect(headingBox.left).toBeGreaterThanOrEqual(contentLeft - 0.5);
  await expect(headingBox.right).toBeLessThanOrEqual(contentRight + 0.5);
  await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth);

  const headingText = heading.firstChild;
  if (!(headingText instanceof Text)) {
    throw new Error('the heading holds no text node');
  }
  const headerStyle = getComputedStyle(header);
  const rowWidth =
    header.clientWidth - parseFloat(headerStyle.paddingLeft) - parseFloat(headerStyle.paddingRight);
  const range = document.createRange();
  range.selectNodeContents(heading);
  for (const line of Array.from(range.getClientRects())) {
    const sharesRow = line.bottom > groupBox.top && line.top < groupBox.bottom;
    await expect(sharesRow && line.right > groupBox.left).toBe(false);
  }
  for (const word of headingText.data.matchAll(/\S+/g)) {
    range.setStart(headingText, word.index);
    range.setEnd(headingText, word.index + word[0].length);
    const pieces = Array.from(range.getClientRects());
    if (pieces.length > 1) {
      const wordWidth = pieces.reduce((total, piece) => total + piece.width, 0);
      await expect({ word: word[0], widerThanTheRow: wordWidth > rowWidth }).toEqual({
        word: word[0],
        widerThanTheRow: true,
      });
    }
  }
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  await expect(close.getBoundingClientRect().width).toBeCloseTo((36 / 16) * rootSize, 0);
};

/**
 * A long heading beside a `headerStart` tag, a "More" button and the close, at 200% text on a
 * 390 px phone. The header wraps before any word breaks, so the end group takes a row of its own;
 * only "Grandmother’s", wider than the whole row, breaks.
 */
export const HeadingAtDoubleText: Story = {
  args: {
    defaultOpen: true,
    // The header is the subject; at twice the text a body would scroll.
    description: undefined,
    children: undefined,
    heading: 'Grandmother’s extravagant lasagne',
    headerStart: <Tag>Draft</Tag>,
    headerEnd: (
      <IconButton label="More" variant="soft">
        <MoreGlyph />
      </IconButton>
    ),
  },
  globals: { viewport: { value: 'mobile' } },
  decorators: [
    (Story) => (
      <>
        <style>{doubleText}</style>
        <Story />
      </>
    ),
  ],
  play: playHeadingAtDoubleText,
};

/** The default dialog at 200% text on a 390 px phone: the heading reads in whole words. */
export const DefaultAtDoubleText: Story = {
  args: { defaultOpen: true, description: undefined, children: undefined },
  globals: HeadingAtDoubleText.globals,
  decorators: HeadingAtDoubleText.decorators,
  play: playHeadingAtDoubleText,
};

/** A phone sheet in the demo theme: the swipe stories run in the 390 px `mobile` window. */
const swipeStory = {
  globals: { viewport: { value: 'mobile' } },
  decorators: [
    (Story) => (
      <>
        <style>{demoThemeCss}</style>
        <ThemeScope theme={demoTheme}>
          <Story />
        </ThemeScope>
      </>
    ),
  ],
} satisfies Story;

/** A bottom sheet open on load, with its own `onOpenChange` spy. */
function swipeArgs(): Story['args'] {
  return { variant: 'sheet', defaultOpen: true, onOpenChange: fn() };
}

/** The open bottom sheet's scrim, which Drawer renders as a presentation `div`. */
function sheetScrim(): HTMLElement {
  const scrim = document.querySelector<HTMLElement>('[role="presentation"][data-variant="sheet"]');
  if (scrim === null) {
    throw new Error('the sheet has no scrim');
  }
  return scrim;
}

/** The transform transitions running on the element. */
function transformTransitions(element: Element): Animation[] {
  return element
    .getAnimations()
    .filter(
      (animation) =>
        animation instanceof CSSTransition && animation.transitionProperty === 'transform',
    );
}

const playSwipeToDismiss: Story['play'] = async ({ args }) => {
  const popup = await settledDialog();
  await swipe(popup, { deltaY: popup.offsetHeight * 0.6, durationMs: 300 });
  await waitFor(() =>
    expect(args.onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'swipe' }),
    ),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
};

const playShortSwipeReturns: Story['play'] = async ({ args }) => {
  const popup = await settledDialog();
  const restTop = popup.getBoundingClientRect().top;
  await swipe(popup, { deltaY: 40, durationMs: 800 });
  await waitFor(() => expect(popup.getBoundingClientRect().top).toBeCloseTo(restTop, 0));
  await expect(args.onOpenChange).not.toHaveBeenCalled();
};

const playFlickCloses: Story['play'] = async ({ args }) => {
  const popup = await settledDialog();
  await swipe(popup, { deltaY: 60, durationMs: 60, steps: 4 });
  await waitFor(() =>
    expect(args.onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'swipe' }),
    ),
  );
};

/** Swiping down past half the sheet's height closes it with the swipe reason. */
export const SheetSwipeToDismiss: Story = {
  ...swipeStory,
  args: swipeArgs(),
  play: playSwipeToDismiss,
};

/** Mid-drag the popup is translated by the drag, with no transition running on transform. */
export const SheetFollowsTheFinger: Story = {
  ...swipeStory,
  args: swipeArgs(),
  play: async () => {
    const popup = await settledDialog();
    const restTop = popup.getBoundingClientRect().top;
    const drag = await swipeStage(popup, { deltaY: 80 });
    await expect(popup.getBoundingClientRect().top - restTop).toBeCloseTo(80, -1);
    await expect(
      popup.getAnimations().filter((animation) => animation instanceof CSSTransition),
    ).toHaveLength(0);
    // The scrim lightens with the share of the sheet dragged away.
    const scrim = sheetScrim();
    await expect(Number(getComputedStyle(scrim).opacity)).toBeCloseTo(
      1 - 80 / popup.offsetHeight,
      2,
    );
    await drag.release();
  },
};

/** A swipe close slides on from where the finger let go, and quicker than a close from rest. */
export const SheetSwipeCloseKeepsTheDrag: Story = {
  ...swipeStory,
  args: swipeArgs(),
  play: async () => {
    const popup = await settledDialog();
    const restDurationMs = parseFloat(getComputedStyle(popup).transitionDuration) * 1000;
    const drag = await swipeStage(popup, { deltaY: popup.offsetHeight * 0.6, durationMs: 300 });
    const releasedTop = popup.getBoundingClientRect().top;
    await drag.release();
    const [slide] = transformTransitions(popup);
    if (slide === undefined) {
      throw new Error('the sheet runs no transform transition as it closes');
    }
    slide.pause();
    slide.currentTime = 0;
    await expect(popup.getBoundingClientRect().top).toBeCloseTo(releasedTop, 0);
    const slideDurationMs = Number(slide.effect?.getComputedTiming().duration ?? 0);
    slide.finish();
    await expect(slideDurationMs).toBeGreaterThan(0);
    await expect(slideDurationMs).toBeLessThan(restDurationMs);
  },
};

/** A slow drag of 40 px springs back and never calls `onOpenChange`. */
export const SheetShortSwipeReturns: Story = {
  ...swipeStory,
  args: swipeArgs(),
  play: playShortSwipeReturns,
};

/** A fast 60 px flick closes even though it is short of half the height. */
export const SheetFlickCloses: Story = {
  ...swipeStory,
  args: swipeArgs(),
  play: playFlickCloses,
};

/**
 * With the body scrolled to 300 px, a downward drag on the body is left to the body's scroll: each
 * move reaches the body uncancelled, so the browser scrolls it, and the sheet stays where it is.
 */
export const SheetScrollsBeforeSwipe: Story = {
  ...swipeStory,
  args: { ...swipeArgs(), children: longBody },
  play: async ({ args }) => {
    const popup = await settledDialog();
    const body = within(popup).getByRole('region');
    body.scrollTop = 300;
    await expect(body.scrollTop).toBe(300);
    const restTop = popup.getBoundingClientRect().top;
    // The drawer claims a move by stopping it before the body sees it and cancelling it.
    const movesCancelled: boolean[] = [];
    const recordMove = (event: Event) => movesCancelled.push(event.defaultPrevented);
    body.addEventListener('touchmove', recordMove);
    try {
      await swipe(body, { deltaY: 120 });
    } finally {
      body.removeEventListener('touchmove', recordMove);
    }
    await expect(movesCancelled).toEqual(Array.from({ length: 10 }, () => false));
    await expect(popup).not.toHaveAttribute('data-swiping');
    await expect(popup.getBoundingClientRect().top).toBeCloseTo(restTop, 0);
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

/** The footer button's own handler, which the tap story counts. */
const registerClick = fn();

/** A touch tap (no move) on the footer button fires its `onClick` and leaves the sheet open. */
export const SheetTapIsNotASwipe: Story = {
  ...swipeStory,
  args: { ...swipeArgs(), footer: <Button onClick={registerClick}>Register the remote</Button> },
  play: async ({ args }) => {
    registerClick.mockClear();
    const popup = await settledDialog();
    const button = within(popup).getByRole('button', { name: 'Register the remote' });
    // The browser sends no click after a tap whose touchstart or touchend was cancelled.
    const cancelled: string[] = [];
    const recordCancelled = (event: Event) => {
      if (event.defaultPrevented) {
        cancelled.push(event.type);
      }
    };
    window.addEventListener('touchstart', recordCancelled);
    window.addEventListener('touchend', recordCancelled);
    try {
      await swipe(button, { steps: 0, durationMs: 80 });
    } finally {
      window.removeEventListener('touchstart', recordCancelled);
      window.removeEventListener('touchend', recordCancelled);
    }
    await expect(cancelled).toEqual([]);
    // The click the browser sends after an uncancelled tap.
    button.click();
    await expect(registerClick).toHaveBeenCalledTimes(1);
    await expect(popup).not.toHaveAttribute('data-swiping');
    await expect(screen.getByRole('dialog')).toBe(popup);
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

/**
 * The short swipe, the flick and the long swipe under reduced motion, which the test runner
 * emulates for this story (`parameters.reducedMotion`). The snap back runs no transform transition.
 */
export const SheetSwipeReducedMotion: Story = {
  ...swipeStory,
  args: swipeArgs(),
  parameters: { reducedMotion: true },
  play: async (context) => {
    await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    const onOpenChange = context.args.onOpenChange as ReturnType<typeof fn>;
    const popup = await settledDialog();
    const restTop = popup.getBoundingClientRect().top;
    await swipe(popup, { deltaY: 40, durationMs: 800 });
    // Read straight after the release: the snap back is already over.
    await expect(transformTransitions(popup)).toHaveLength(0);
    await expect(popup.getBoundingClientRect().top).toBeCloseTo(restTop, 0);
    await expect(onOpenChange).not.toHaveBeenCalled();
    // The flick closes with no slide either.
    await swipe(popup, { deltaY: 60, durationMs: 60, steps: 4 });
    await expect(transformTransitions(popup)).toHaveLength(0);
    await waitFor(() =>
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    within(context.canvasElement).getByRole('button', { name: 'Remove remote' }).click();
    onOpenChange.mockClear();
    await playSwipeToDismiss?.(context);
  },
};

/** A side panel in the demo theme: the 1280 px `desktop` window is wide enough to show it as one. */
const sideSwipeStory = {
  ...swipeStory,
  globals: { viewport: { value: 'desktop' } },
} satisfies Story;

/** A side sheet open on load, with its own `onOpenChange` spy. */
function sideSwipeArgs(): Story['args'] {
  return { variant: 'sheet', side: 'end', defaultOpen: true, onOpenChange: fn() };
}

/** A horizontal travel of 60% of the popup's width, toward `direction`. */
function sideTravel(popup: HTMLElement, direction: 'right' | 'left'): { deltaX: number } {
  return { deltaX: popup.offsetWidth * (direction === 'right' ? 0.6 : -0.6) };
}

/** Swiping a side sheet toward its edge, right in a left-to-right page, closes it. */
export const SideSheetSwipeRight: Story = {
  ...sideSwipeStory,
  args: sideSwipeArgs(),
  play: async ({ args }) => {
    const popup = await settledDialog();
    const restLeft = popup.getBoundingClientRect().left;
    // Away from the edge it springs back and closes nothing.
    await swipe(popup, { ...sideTravel(popup, 'left'), durationMs: 300 });
    await waitFor(() => expect(popup.getBoundingClientRect().left).toBeCloseTo(restLeft, 0));
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await swipe(popup, { ...sideTravel(popup, 'right'), durationMs: 300 });
    await waitFor(() =>
      expect(args.onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** In a right-to-left page the side sheet docks on the left, so it closes on a swipe left. */
export const SideSheetRightToLeftSwipesLeft: Story = {
  ...SideSheetRightToLeft,
  args: { ...SideSheetRightToLeft.args, onOpenChange: fn() },
  globals: sideSwipeStory.globals,
  play: async ({ args }) => {
    const popup = await settledDialog();
    const restLeft = popup.getBoundingClientRect().left;
    // A swipe right of the same length is away from the edge: it springs back and closes nothing.
    await swipe(popup, { ...sideTravel(popup, 'right'), durationMs: 300 });
    await waitFor(() => expect(popup.getBoundingClientRect().left).toBeCloseTo(restLeft, 0));
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await swipe(popup, { ...sideTravel(popup, 'left'), durationMs: 300 });
    await waitFor(() =>
      expect(args.onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/**
 * A mouse or pen press on the sheet starts no swipe: held 60% of the way, the popup has not moved
 * and is not swiping, and letting go closes nothing.
 */
function playIgnoresDrag(kind: 'mouse' | 'pen', side: 'bottom' | 'end'): Story['play'] {
  return async ({ args }) => {
    const popup = await settledDialog();
    const restBox = popup.getBoundingClientRect();
    const travel =
      side === 'bottom' ? { deltaY: restBox.height * 0.6 } : { deltaX: restBox.width * 0.6 };
    const drag = await swipeStage(popup, { ...travel, durationMs: 300, kind });
    const draggedBox = popup.getBoundingClientRect();
    await expect(popup).not.toHaveAttribute('data-swiping');
    await expect(draggedBox.top).toBeCloseTo(restBox.top, 0);
    await expect(draggedBox.left).toBeCloseTo(restBox.left, 0);
    await drag.release();
    await expect(screen.getByRole('dialog')).toBe(popup);
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  };
}

/** Swiping is for touch: a mouse drag does not move the bottom sheet. */
export const SheetIgnoresMouseDrag: Story = {
  ...swipeStory,
  args: swipeArgs(),
  play: playIgnoresDrag('mouse', 'bottom'),
};

/** A pen drag does not move the bottom sheet either. */
export const SheetIgnoresPenDrag: Story = {
  ...swipeStory,
  args: swipeArgs(),
  play: playIgnoresDrag('pen', 'bottom'),
};

/** A mouse drag does not move the side sheet. */
export const SideSheetIgnoresMouseDrag: Story = {
  ...sideSwipeStory,
  args: sideSwipeArgs(),
  play: playIgnoresDrag('mouse', 'end'),
};

const GUARDED_HEADING = 'Edit the potluck item';
const DISCARD_HEADING = 'Discard changes?';

/** A sheet holding unsaved changes: any close asks first, through a centred confirm of its own. */
function GuardedSheet(args: DialogProps) {
  const [open, setOpen] = useState(true);
  const [confirming, setConfirming] = useState(false);
  return (
    <Dialog
      {...args}
      heading={GUARDED_HEADING}
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        args.onOpenChange?.(nextOpen, eventDetails);
        // The close is refused: the sheet stays open and the confirm asks.
        if (nextOpen) {
          setOpen(true);
        } else {
          setConfirming(true);
        }
      }}
    >
      <p>The dish name and the note are not saved yet.</p>
      <Dialog
        heading={DISCARD_HEADING}
        description="The changes to this item are lost."
        open={confirming}
        onOpenChange={setConfirming}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
              Keep editing
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setConfirming(false);
                setOpen(false);
              }}
            >
              Discard
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

/** The guarded sheet, open on load, with its own `onOpenChange` spy. */
function guardedArgs(): Story['args'] {
  return { variant: 'sheet', trigger: undefined, onOpenChange: fn() };
}

interface FrameSample {
  top: number;
  scrimOpacity: number;
}

/** Samples the sheet's top and its scrim's opacity on every frame until `stop()`. */
function recordFrames(popup: HTMLElement, scrim: HTMLElement): { stop(): FrameSample[] } {
  const frames: FrameSample[] = [];
  let recording = true;
  const sample = () => {
    if (!recording) {
      return;
    }
    frames.push({
      top: popup.getBoundingClientRect().top,
      scrimOpacity: Number(getComputedStyle(scrim).opacity),
    });
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  return {
    stop() {
      recording = false;
      return frames;
    },
  };
}

/** Waits for the popup's running transitions, then a frame, so a reset that follows has landed. */
async function transitionsFinished(popup: HTMLElement): Promise<void> {
  await Promise.all(popup.getAnimations().map((animation) => animation.finished));
  await new Promise((resume) => requestAnimationFrame(resume));
}

/**
 * A swipe close the caller refuses, as WBW's dirty guard does: the sheet stays open and returns to
 * rest from where the finger let go, never further down, and the discard confirm opens with focus.
 */
export const SheetRefusesSwipeClose: Story = {
  ...swipeStory,
  args: guardedArgs(),
  render: GuardedSheet,
  play: async ({ args }) => {
    const sheet = await settledDialog();
    const restTop = sheet.getBoundingClientRect().top;
    const drag = await swipeStage(sheet, { deltaY: sheet.offsetHeight * 0.6, durationMs: 300 });
    const releasedTop = sheet.getBoundingClientRect().top;
    const releasedScrimOpacity = Number(getComputedStyle(sheetScrim()).opacity);
    const frames = recordFrames(sheet, sheetScrim());
    await drag.release();
    await waitFor(() =>
      expect(args.onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
    const confirm = await screen.findByRole('dialog', { name: DISCARD_HEADING });
    await waitFor(() => expect(sheet.getBoundingClientRect().top).toBeLessThan(releasedTop - 1));
    await transitionsFinished(sheet);
    await waitFor(() => expect(confirm).not.toHaveAttribute('data-starting-style'));
    await transitionsFinished(confirm);
    await expect(confirm).toBeVisible();
    await expect(confirm.contains(document.activeElement)).toBe(true);
    const samples = frames.stop();
    await expect(samples.length).toBeGreaterThan(1);
    await expect(sheet.isConnected).toBe(true);
    await expect(sheet).not.toHaveAttribute('data-ending-style');
    await expect(Math.abs(sheet.getBoundingClientRect().top - restTop)).toBeLessThanOrEqual(1);
    // No jump toward closed on the way back, and the scrim never lightens past the release.
    await expect(Math.max(...samples.map((sample) => sample.top))).toBeLessThanOrEqual(
      releasedTop + 1,
    );
    await expect(Math.min(...samples.map((sample) => sample.scrimOpacity))).toBeGreaterThanOrEqual(
      releasedScrimOpacity - 0.01,
    );
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
  },
};

/**
 * With the discard confirm over the sheet, a touch drag across the sheet (from the confirm, and from
 * the confirm's layer over the sheet's handle) moves nothing, and the confirm stays open.
 */
export const SheetUnderConfirm: Story = {
  ...swipeStory,
  args: guardedArgs(),
  render: GuardedSheet,
  play: async ({ args }) => {
    const sheet = await settledDialog();
    within(sheet).getByRole('button', { name: 'Close' }).click();
    const confirm = await screen.findByRole('dialog', { name: DISCARD_HEADING });
    await waitFor(() => expect(confirm).not.toHaveAttribute('data-starting-style'));
    await transitionsFinished(confirm);
    const restTop = sheet.getBoundingClientRect().top;
    const handle = sheet.firstElementChild;
    if (handle === null) {
      throw new Error('the bottom sheet has no handle');
    }
    for (const startAt of [sheet, handle]) {
      // The press lands on the confirm's layer, which covers the whole sheet.
      const startBox = startAt.getBoundingClientRect();
      const pressed = document.elementFromPoint(
        startBox.left + startBox.width / 2,
        startBox.top + startBox.height / 2,
      );
      await expect(sheet.contains(pressed)).toBe(false);
      const drag = await swipeStage(sheet, {
        deltaY: sheet.offsetHeight * 0.6,
        durationMs: 300,
        startAt,
      });
      await expect(sheet).not.toHaveAttribute('data-swiping');
      await expect(sheet.getBoundingClientRect().top).toBeCloseTo(restTop, 0);
      await drag.release();
      await transitionsFinished(sheet);
      await expect(sheet.getBoundingClientRect().top).toBeCloseTo(restTop, 0);
      await expect(confirm.isConnected).toBe(true);
      await expect(confirm).not.toHaveAttribute('data-ending-style');
    }
    // The one close is the X that opened the confirm.
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
  },
};

const PARENT_HEADING = 'Edit the potluck';
const CHILD_HEADING = 'Switch to Request?';

/** The child sheet's own `onOpenChange` spy. */
const childOpenChange = fn();

/** A sheet that opens a second sheet over itself, as WBW's who-can-join switch confirm does. */
function SheetWithChildSheet(args: DialogProps) {
  const [childOpen, setChildOpen] = useState(false);
  return (
    <Dialog {...args} heading={PARENT_HEADING}>
      <p>Who can join decides who sees the event and who has to ask.</p>
      <Button variant="secondary" onClick={() => setChildOpen(true)}>
        Change who can join
      </Button>
      <Dialog
        variant="sheet"
        heading={CHILD_HEADING}
        description="People who are not friends of a host have to ask to join."
        open={childOpen}
        onOpenChange={(nextOpen, eventDetails) => {
          childOpenChange(nextOpen, eventDetails);
          setChildOpen(nextOpen);
        }}
        footer={<Button size="sm">Switch</Button>}
      />
    </Dialog>
  );
}

/** What a parent sheet looks like: where it is, and how it is transformed and rounded. */
function sheetLook(popup: HTMLElement) {
  const { top, left, width, height } = popup.getBoundingClientRect();
  const computed = getComputedStyle(popup);
  return { top, left, width, height, transform: computed.transform, radius: computed.borderRadius };
}

/**
 * A sheet on a sheet: the parent keeps its look while the child is open, the child swipes closed
 * on its own, and the parent then swipes closed too.
 */
export const SheetOnSheet: Story = {
  ...swipeStory,
  args: swipeArgs(),
  render: SheetWithChildSheet,
  play: async ({ args }) => {
    childOpenChange.mockClear();
    const parent = await settledDialog();
    const restLook = sheetLook(parent);
    within(parent).getByRole('button', { name: 'Change who can join' }).click();
    const child = await screen.findByRole('dialog', { name: CHILD_HEADING });
    await waitFor(() => expect(child).not.toHaveAttribute('data-starting-style'));
    await transitionsFinished(child);
    // Drawer's nested state is on, and the skin draws nothing for it.
    await expect(parent).toHaveAttribute('data-nested-drawer-open');
    await expect(sheetLook(parent)).toEqual(restLook);
    const parentScrim = sheetScrim();
    const parentScrimOpacity = getComputedStyle(parentScrim).opacity;
    // Mid-drag the child moves, and the parent and its scrim stay as they are.
    const childRestTop = child.getBoundingClientRect().top;
    const drag = await swipeStage(child, { deltaY: child.offsetHeight * 0.6, durationMs: 300 });
    await expect(child.getBoundingClientRect().top).toBeGreaterThan(childRestTop + 1);
    await expect(sheetLook(parent)).toEqual(restLook);
    await expect(getComputedStyle(parentScrim).opacity).toBe(parentScrimOpacity);
    await drag.release();
    await waitFor(() =>
      expect(childOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
    await waitFor(() => expect(child.isConnected).toBe(false));
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await expect(parent).not.toHaveAttribute('data-ending-style');
    await transitionsFinished(parent);
    await expect(sheetLook(parent)).toEqual(restLook);
    await swipe(parent, { deltaY: parent.offsetHeight * 0.6, durationMs: 300 });
    await waitFor(() =>
      expect(args.onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
