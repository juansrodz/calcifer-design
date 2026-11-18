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
      // While the popup is open, Base UI renders focus guards beside the trigger: visually hidden
      // spans that are `aria-hidden` and `tabIndex={0}`, so Tab into or out of the portalled
      // popup lands on a guard and is redirected (Base UI's `utils/FocusGuard`). Deliberate, and
      // it trips axe's `aria-hidden-focus` in a real browser; nothing in this library renders
      // them, so the rule is excluded for this open state, as for ToastRegion's close control.
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
