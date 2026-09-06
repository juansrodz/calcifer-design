import type { Meta, StoryObj } from '@storybook/react';
import { PageHeading } from './PageHeading';

const meta = {
  title: 'Primitives/PageHeading',
  component: PageHeading,
  args: { children: 'Projects' },
} satisfies Meta<typeof PageHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithEyebrow: Story = { args: { eyebrow: 'Fleet', children: 'Under the hood' } };
export const Display: Story = { args: { size: 'display', children: 'Juan Sebastian Rodriguez' } };
export const Compact: Story = { args: { size: 'compact', children: 'Under the hood' } };
export const FocusOnMount: Story = { args: { focusOnMount: true } };
