import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  args: { variant: 'text' },
  argTypes: {
    variant: { control: 'radio', options: ['text', 'block', 'circle'] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextLines: Story = {};
export const OneLine: Story = { args: { lines: 1 } };
export const Block: Story = { args: { variant: 'block', height: '8rem' } };
export const Circle: Story = { args: { variant: 'circle', width: '2.5rem', height: '2.5rem' } };

/**
 * A consumer rounds the `text` and `block` skeletons through `--skeleton-radius`, set on a
 * `ThemeScope` or another DOM ancestor of the skeleton (it takes no `className`); the circle keeps
 * its full radius. The story stylesheet sets it on a wrapper.
 */
export const RadiusHook: Story = {
  render: () => (
    <div data-skeleton-radius-hook="" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <style>
        {`[data-skeleton-radius-hook] {
  --skeleton-radius: var(--radius-lg);
}`}
      </style>
      <Skeleton variant="text" lines={1} />
      <Skeleton variant="block" height="4rem" />
      <Skeleton variant="circle" />
    </div>
  ),
};
