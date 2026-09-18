import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Menu } from './Menu';

const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  args: {
    trigger: <Button variant="secondary">Remote actions</Button>,
    items: [
      { id: 'reload', label: 'Reload manifest', onSelect: fn() },
      { id: 'open', label: 'Open standalone', onSelect: fn() },
      { id: 'remove', label: 'Remove from registry', onSelect: fn(), separatorBefore: true },
      { id: 'pin', label: 'Pin version', onSelect: fn(), disabled: true },
    ],
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AlignedToTheStart: Story = { args: { align: 'start' } };
export const OpenOnLoad: Story = { args: { defaultOpen: true } };

/** Opens with the keyboard and checks the first item takes focus, so arrow keys work at once. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remote actions' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(await screen.findByRole('menuitem', { name: 'Reload manifest' })).toHaveFocus();
  },
};
