import type { Meta, StoryObj } from '@storybook/react';
import type { PaintCheck } from '../../../.storybook/paint-checks';
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
    variant: { control: 'radio', options: ['primary', 'secondary', 'ghost', 'soft'] },
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
/** A quiet filled circle; its glyph draws at 16px in both sizes. */
export const Soft: Story = { args: { variant: 'soft' } };

export const PressedAndBadge: Story = {
  args: { label: 'Filters, 2 active', pressed: true, badge: 2 },
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <IconButton {...args} />
      <IconButton {...args} label="Filters" pressed={false} badge={undefined} />
    </div>
  ),
};

const unavailableVariants = ['ghost', 'secondary', 'primary', 'soft'] as const;

const unavailablePaint = {
  ghost: { backgroundColor: 'transparent', color: 'var(--color-text-muted)' },
  secondary: { backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text)' },
  primary: { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' },
  soft: { backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' },
} satisfies Record<(typeof unavailableVariants)[number], object>;

/**
 * Each variant marked `aria-disabled`: focusable and announced, but unavailable, as the
 * `DatePicker`'s month button is at the end of its range. Under the pointer each one looks as it
 * does at rest, with no hover tint; the test runner hovers each with a real pointer and compares
 * its colours with the variant's resting ones. The loading button after them (Base UI marks it
 * `aria-disabled` and `data-disabled`) keeps its own look.
 */
export const Unavailable: Story = {
  parameters: {
    paintChecks: [
      ...unavailableVariants.map((variant) => ({
        target: `button[aria-disabled='true'][data-variant='${variant}']:not([data-loading])`,
        interaction: 'hover' as const,
        expected: unavailablePaint[variant],
      })),
      {
        target: 'button[data-loading]',
        interaction: 'hover' as const,
        expected: unavailablePaint.ghost,
      },
    ] satisfies readonly PaintCheck[],
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      {unavailableVariants.map((variant) => (
        <IconButton
          key={variant}
          {...args}
          variant={variant}
          label={`Delete remote (${variant}, unavailable)`}
          aria-disabled
        />
      ))}
      <IconButton {...args} label="Deleting remote" loading />
    </div>
  ),
};
