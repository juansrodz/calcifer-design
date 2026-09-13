import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Alert } from './Alert';

const meta = {
  title: 'Primitives/Alert',
  component: Alert,
  args: {
    tone: 'info',
    children: 'The registry was last refreshed 4 minutes ago.',
  },
  argTypes: {
    tone: { control: 'radio', options: ['info', 'success', 'warning', 'danger'] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = {
  args: { tone: 'success', children: 'The showcase remote is registered and loaded.' },
};
export const Warning: Story = {
  args: { tone: 'warning', children: 'This remote is two versions behind the shell.' },
};
export const Danger: Story = {
  args: { tone: 'danger', children: 'The showcase remote failed to load.' },
};
export const WithHeading: Story = {
  args: {
    tone: 'danger',
    heading: 'Remote unavailable',
    children: 'The showcase remote failed to load.',
  },
};
export const Dismissible: Story = {
  args: { onDismiss: fn(), dismissLabel: 'Dismiss this notice' },
};
export const Announced: Story = {
  args: { tone: 'danger', announce: true, children: 'Saving failed. Nothing was changed.' },
};
