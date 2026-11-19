import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Tag } from '../Tag/Tag';
import { TextInput } from '../TextInput/TextInput';
import { demoTheme, demoThemeCss } from '../ThemeScope/fixtures';
import { ThemeScope } from '../ThemeScope/ThemeScope';
import { Dialog } from './Dialog';

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
 * The runner's window is 1280 px wide, so the 200% text stories pin the centred popup at the
 * width a 390 px phone gives it, and the root at twice the size. The viewport's gutter is
 * `--space-4`, which doubles with the text: the popup is 326 px, not the 358 px a 16 px gutter
 * would leave.
 */
const doubleTextOnAPhone = `html { font-size: 200%; }
[data-popup='dialog'] { width: min(32rem, calc(390px - 2 * var(--space-4))) !important; }`;

/**
 * The play for the 200% text stories: the end group and the heading stay inside the popup's
 * padding box, the heading holds its text (nothing runs past its box), no line of it crosses the
 * end group, a word breaks only when it is wider than the whole header row, and the close stays
 * the 36 px circle (twice that here, as the text is twice its size).
 */
const playHeadingAtDoubleText: Story['play'] = async () => {
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
    // The header is the subject: at twice the text a body would scroll, and the axe smoke check
    // can run before the scrolling body becomes a Tab stop.
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
  decorators: [
    (Story) => (
      <>
        <style>{doubleTextOnAPhone}</style>
        <Story />
      </>
    ),
  ],
  play: playHeadingAtDoubleText,
};

/** The default dialog at 200% text on a 390 px phone: the heading reads in whole words. */
export const DefaultAtDoubleText: Story = {
  args: { defaultOpen: true, description: undefined, children: undefined },
  decorators: HeadingAtDoubleText.decorators,
  play: playHeadingAtDoubleText,
};
