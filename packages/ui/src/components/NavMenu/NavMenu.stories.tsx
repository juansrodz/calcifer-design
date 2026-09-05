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

/** Tabs to the nav at desktop width and checks the first link lands there. */
export const FocusVisible: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus();
  },
};
