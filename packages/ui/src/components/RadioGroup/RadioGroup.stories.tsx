import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  args: {
    label: 'Who can see this event',
    name: 'visibility',
    defaultValue: 'link',
    options: [
      { value: 'public', label: 'Anyone with the address' },
      { value: 'link', label: 'Anyone with the link' },
      { value: 'invited', label: 'Invited people only' },
      { value: 'archived', label: 'Nobody — archived', disabled: true },
    ],
    onValueChange: fn(),
  },
  argTypes: { orientation: { control: 'radio', options: ['vertical', 'horizontal'] } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Horizontal: Story = {
  args: {
    label: 'Portion size',
    name: 'portion',
    orientation: 'horizontal',
    defaultValue: 'medium',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
};
export const Described: Story = {
  args: { description: 'You can change this at any time from the event page.' },
};
export const Required: Story = { args: { required: true, defaultValue: undefined } };
export const WithError: Story = {
  args: { required: true, defaultValue: undefined, error: 'Choose who can see the event.' },
};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' } };
