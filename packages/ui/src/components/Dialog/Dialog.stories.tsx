import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Tag } from '../Tag/Tag';
import { TextInput } from '../TextInput/TextInput';
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
 * A sheet that opens from a card's title and takes the title away while it is open, as an item
 * sheet does when the list behind it re-renders. Base UI has no trigger or focused control left
 * to return to, so `finalFocus` names where focus goes on close: the "Back to the list" button.
 * Without it, focus would fall to the page body.
 */
export const FinalFocus: Story = {
  args: { variant: 'sheet', trigger: undefined, heading: 'Potluck salad' },
  render: function FinalFocusRender(args) {
    const [open, setOpen] = useState(false);
    const returnRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        {open ? null : (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Open item
          </Button>
        )}
        <Button variant="secondary" nativeButton render={<button ref={returnRef} type="button" />}>
          Back to the list
        </Button>
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
      expect(canvas.getByRole('button', { name: 'Back to the list' })).toHaveFocus(),
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
