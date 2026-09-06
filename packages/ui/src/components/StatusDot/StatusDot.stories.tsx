import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot } from './StatusDot';

const meta = {
  title: 'Primitives/StatusDot',
  component: StatusDot,
  args: { label: 'showcase', status: 'registered' },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Registered: Story = {};
export const Loading: Story = { args: { status: 'loading' } };
export const Loaded: Story = { args: { status: 'loaded' } };
export const Failed: Story = { args: { status: 'failed' } };
export const TextLabel: Story = {
  args: { status: 'loaded', label: 'Federation Showcase', labelStyle: 'text' },
};
