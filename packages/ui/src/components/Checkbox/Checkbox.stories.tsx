import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: { label: 'Bring a dish', name: 'bringing', onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { label: 'Select all items', indeterminate: true } };
export const Described: Story = {
  args: { description: 'We will list you next to the dish on the event page.' },
};
export const Required: Story = { args: { label: 'Accept the house rules', required: true } };
export const WithError: Story = {
  args: { label: 'Accept the house rules', required: true, error: 'You must accept to join.' },
};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultChecked: true } };
