import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';
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
export const OpenOnLoad: Story = { args: { defaultOpen: true } };

/** Opens from the keyboard and checks that focus lands inside the popup, not behind it. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remote details' }).focus();
    await userEvent.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog', { name: 'Showcase remote' });
    await expect(popup.contains(document.activeElement)).toBe(true);
  },
};
