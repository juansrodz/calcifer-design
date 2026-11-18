import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Popover } from './Popover';

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  args: {
    trigger: <Button variant="secondary">Remote details</Button>,
    heading: 'Showcase remote',
    description: 'Loaded from the registry entry at /projects/showcase.',
    children: <p>Mounted 184ms after the route resolved.</p>,
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Above: Story = { args: { side: 'top' } };
export const AlignedToTheStart: Story = { args: { align: 'start' } };
export const Modal: Story = { args: { modal: true } };
export const OpenOnLoad: Story = {
  args: { defaultOpen: true },
  parameters: {
    a11y: {
      // An open popover renders Base UI's focus guards beside the trigger: visually hidden spans
      // that are `aria-hidden` and `tabIndex={0}`, so Tab into or out of the portalled popup lands
      // on a guard and is redirected (Base UI's `utils/FocusGuard`). axe's `aria-hidden-focus`
      // flags them unless a dialog is visible on the page, and the popup is `role="dialog"`. Only
      // this story needs the exclusion: the test-runner flags it (loaded on its own page it
      // passes), while KeyboardOpen is checked after its play has waited for focus in the visible
      // dialog and passes with the rule on. Nothing in this library renders the guards, so the
      // rule is excluded, as for ToastRegion's close control.
      options: { rules: { 'aria-hidden-focus': { enabled: false } } },
    },
  },
};

/** Opens from the keyboard and checks that focus lands inside the popup, not behind it. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remote details' }).focus();
    await userEvent.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog', { name: 'Showcase remote' });
    // Base UI moves focus into the popup after it mounts, a moment after it is in the DOM.
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
  },
};
