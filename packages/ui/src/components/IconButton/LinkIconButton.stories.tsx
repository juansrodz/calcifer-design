import type { Meta, StoryObj } from '@storybook/react';
import { ChevronRightIcon } from '../../icons/ChevronRightIcon';
import { IconButton } from './IconButton';
import type { IconButtonSize, IconButtonVariant } from './IconButton';
import { LinkIconButton } from './LinkIconButton';

const meta = {
  title: 'Primitives/LinkIconButton',
  component: LinkIconButton,
  args: {
    label: 'Open event',
    href: '#event',
    children: <ChevronRightIcon />,
    variant: 'ghost',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'ghost', 'soft'] },
    size: { control: 'radio', options: ['md', 'sm'] },
  },
} satisfies Meta<typeof LinkIconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Primary: Story = { args: { variant: 'primary' } };
export const Small: Story = { args: { size: 'sm' } };
/** The small soft circle a page header uses to go back to a list. */
export const Soft: Story = {
  args: { variant: 'soft', size: 'sm', label: 'Back to events', href: '#events' },
};
/** The count is drawn only; the label says it too. */
export const WithBadge: Story = { args: { label: 'Messages, 3 unread', badge: 3 } };

const variants: ReadonlyArray<IconButtonVariant> = ['ghost', 'secondary', 'primary', 'soft'];
const sizes: ReadonlyArray<IconButtonSize> = ['md', 'sm'];

/**
 * Each variant and size twice: an `IconButton`, then a `LinkIconButton`. The two must look the
 * same; only the role and the keyboard differ.
 */
export const MatchesIconButton: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {sizes.map((size) => (
        <div key={size} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {variants.map((variant) => (
            <div key={variant} style={{ display: 'flex', gap: 'var(--space-1)' }}>
              <IconButton label={`${variant} ${size} button`} variant={variant} size={size}>
                <ChevronRightIcon />
              </IconButton>
              <LinkIconButton
                {...args}
                label={`${variant} ${size} link`}
                variant={variant}
                size={size}
              />
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        {variants.map((variant) => (
          <div key={variant} style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <IconButton label={`${variant} button, 3 new`} variant={variant} badge={3}>
              <ChevronRightIcon />
            </IconButton>
            <LinkIconButton
              {...args}
              label={`${variant} link, 3 new`}
              variant={variant}
              badge={3}
            />
          </div>
        ))}
      </div>
    </div>
  ),
};
