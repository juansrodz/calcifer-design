import type { Meta, StoryObj } from '@storybook/react';
import { LiveRegion } from './LiveRegion';

const meta = {
  title: 'Primitives/LiveRegion',
  component: LiveRegion,
  args: { message: 'Loading Federation Showcase' },
  decorators: [(Story) => (<div><p>The region below is visually hidden; use a screen reader to hear it.</p><Story /></div>)],
} satisfies Meta<typeof LiveRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Polite: Story = {};
export const Assertive: Story = { args: { politeness: 'assertive', message: 'Failed to load Federation Showcase' } };
