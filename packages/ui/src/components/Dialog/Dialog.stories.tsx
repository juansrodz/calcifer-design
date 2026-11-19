import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
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
 * popup, so they inherit into it. These are the WBW mock's container metrics (11b, 11a), each a
 * pixel under the mock's figure for the popup's 1 px border: the bottom sheet's content 20 px in
 * from its sides and its handle 10 px down, 12 px between the handle and the header, and the end
 * drawer's content 28 px in from its sides. Every edge left unset stays 24 px.
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
 * Every edge at a bare `0`. The close's 44 px touch target reaches 4 px past its 36 px circle, and
 * the popup clips what passes its padding edge and its rounded corner, so the header pads the reach
 * and the corner's inset at the top and the inline end. The play presses the target's outer
 * corner, past the circle and in the popup's rounded corner, and finds the close; and the popup
 * does not scroll sideways.
 */
export const ZeroPadding: Story = {
  args: { defaultOpen: true },
  decorators: [
    (Story) => (
      <>
        <style>
          {`${demoThemeCss}
.dialog-zero-padding {
  --dialog-padding-block-start: 0;
  --dialog-padding-block-end: 0;
  --dialog-padding-inline: 0;
}`}
        </style>
        <ThemeScope theme={demoTheme} className="dialog-zero-padding">
          <Story />
        </ThemeScope>
      </>
    ),
  ],
  play: async () => {
    const popup = await settledDialog();
    await expect(getComputedStyle(popup).paddingBlockStart).toBe('0px');
    await expect(getComputedStyle(popup).paddingInlineEnd).toBe('0px');
    const close = within(popup).getByRole('button', { name: 'Close' });
    const closeBox = close.getBoundingClientRect();
    const reach = (44 - closeBox.width) / 2;
    const popupBox = popup.getBoundingClientRect();
    // The target's box sits inside the popup's padding box, inside the 1 px border.
    await expect(closeBox.top - reach).toBeGreaterThanOrEqual(popupBox.top + popup.clientTop);
    await expect(closeBox.right + reach).toBeLessThanOrEqual(
      popupBox.left + popup.clientLeft + popup.clientWidth,
    );
    // Half a pixel inside the target's outer corner, past the circle: the press still lands on it.
    const cornerTarget = document.elementFromPoint(
      closeBox.right + reach - 0.5,
      closeBox.top - reach + 0.5,
    );
    await expect(close.contains(cornerTarget)).toBe(true);
    await expect(popup.scrollWidth).toBe(popup.clientWidth);
  },
};
