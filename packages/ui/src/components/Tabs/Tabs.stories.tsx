import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from './Tabs';

const items = [
  {
    value: 'overview',
    label: 'Overview',
    content: <p>What this remote is and how it was built.</p>,
  },
  { value: 'components', label: 'Components', content: <p>Gallery of shared primitives.</p> },
  { value: 'playground', label: 'Playground', content: <p>Host to remote messages.</p> },
];

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  args: { items, label: 'Showcase sections' },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithDisabled: Story = {
  args: {
    items: [...items, { value: 'admin', label: 'Admin', content: <p>Admin</p>, disabled: true }],
  },
};

/** Tabs to the tablist and checks the active tab (roving tabindex) lands there. */
export const FocusVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  },
};
