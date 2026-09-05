import type { Meta, StoryObj } from '@storybook/react';
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
