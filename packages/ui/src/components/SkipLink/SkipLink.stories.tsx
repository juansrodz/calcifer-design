import type { Meta, StoryObj } from '@storybook/react';
import { SkipLink } from './SkipLink';

const meta = {
  title: 'Primitives/SkipLink',
  component: SkipLink,
  args: { targetId: 'main' },
  decorators: [
    (Story) => (
      <div>
        <Story />
        <p>Press Tab to reveal the skip link.</p>
        <main id="main" tabIndex={-1}>Main content</main>
      </div>
    ),
  ],
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
