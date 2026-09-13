import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';

/** A 16x16 stroke glyph, sized by the button's own stylesheet. */
function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.75 4.25h10.5" />
      <path d="M6.25 4.25V2.75h3.5v1.5" />
      <path d="M4.25 4.25 4.9 13.25h6.2l.65-9" />
    </svg>
  );
}

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { label: 'Delete remote', children: <TrashIcon />, variant: 'ghost', size: 'md' },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'radio', options: ['md', 'sm'] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Primary: Story = { args: { variant: 'primary' } };
export const Small: Story = { args: { size: 'sm' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
