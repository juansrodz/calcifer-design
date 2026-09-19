import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Switch } from './Switch';

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  args: { label: 'Email me when someone joins', name: 'notify', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Described: Story = {
  args: { description: 'One message per event, never a digest.' },
};
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
export const WithError: Story = { args: { required: true, error: 'Turn this on to continue.' } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultChecked: true } };
