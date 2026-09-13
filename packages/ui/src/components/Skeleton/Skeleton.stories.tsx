import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextLines: Story = {};
export const OneLine: Story = { args: { lines: 1 } };
export const Block: Story = { args: { variant: 'block', height: '8rem' } };
export const Circle: Story = { args: { variant: 'circle', width: '2.5rem', height: '2.5rem' } };
