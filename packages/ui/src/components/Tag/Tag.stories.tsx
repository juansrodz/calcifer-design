import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta = {
  title: 'Primitives/Tag',
  component: Tag,
  args: { children: 'react' },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Accent: Story = { args: { tone: 'accent', children: 'bridge' } };
