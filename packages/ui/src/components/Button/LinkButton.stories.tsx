import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { ChevronRightIcon } from '../../icons/ChevronRightIcon';
import { LinkButton } from './LinkButton';

/** The accent surface an inverse link is made for. */
const onAccent = [
  (Story: () => ReactNode) => (
    <div
      style={{
        display: 'inline-block',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-accent)',
      }}
    >
      <Story />
    </div>
  ),
];

const meta = {
  title: 'Primitives/LinkButton',
  component: LinkButton,
  args: { children: 'View projects', href: '#projects', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'ghost', 'row'] },
    size: { control: 'radio', options: ['md', 'sm', 'lg'] },
    tone: { control: 'radio', options: ['accent', 'inverse', 'selected'] },
  },
} satisfies Meta<typeof LinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'About me ›' } };
export const Small: Story = { args: { size: 'sm' } };
/** The inverse tone reaches a link through the same stylesheet as a button. */
export const Inverse: Story = { args: { tone: 'inverse' }, decorators: onAccent };
export const Large: Story = { args: { size: 'lg', tone: 'inverse' }, decorators: onAccent };
/** A row that navigates: the same list row as `Button`'s, on an anchor, with a decorative chevron. */
export const Row: Story = {
  args: {
    variant: 'row',
    href: '#security',
    endIcon: <ChevronRightIcon />,
    children: 'Change password',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '20rem' }}>
        <Story />
      </div>
    ),
  ],
};
