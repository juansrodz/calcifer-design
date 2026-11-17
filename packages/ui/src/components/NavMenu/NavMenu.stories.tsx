import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { NavMenu } from './NavMenu';

const items = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/under-the-hood', label: 'Under the hood' },
];

const meta = {
  title: 'Navigation/NavMenu',
  component: NavMenu,
  args: { items, currentPath: '/projects' },
} satisfies Meta<typeof NavMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: { viewport: { value: 'desktop' } } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

/**
 * The sidebar form (`orientation="vertical"`): the links stack and each one spans the width of the
 * box the nav sits in, here a 15rem column. Desktop only; at mobile width the menu ignores it.
 */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  globals: { viewport: { value: 'desktop' } },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: '15rem' }}>
        <Story />
      </div>
    ),
  ],
};

/** Tabs to the nav at desktop width and checks the first link lands there. */
export const FocusVisible: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus();
  },
};
