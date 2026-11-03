import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';

const items: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Design system' },
];

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  args: { items },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CustomLabel: Story = { args: { 'aria-label': 'You are here' } };
export const UnlinkedMiddle: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Archive' },
      { label: '2026', href: '/archive/2026' },
      { label: 'November' },
    ],
  },
};
export const OnlyTheCurrentPage: Story = { args: { items: [{ label: 'Home' }] } };
/** A trail too long for a phone: it wraps onto further rows rather than scroll the page. */
export const LongTrail: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Organisations', href: '/organisations' },
      { label: 'A rather long organisation name', href: '/organisations/long' },
      { label: 'Projects', href: '/organisations/long/projects' },
      { label: 'Anunbrokenprojectnamethatislongerthanaphoneiswideandhasnowheretobreakatall' },
    ],
  },
};
export const RouterLinks: Story = {
  args: {
    renderLink: (item, { children, ...linkProps }) => (
      <a href={`#router${item.href}`} data-router-link="" {...linkProps}>
        {children}
      </a>
    ),
  },
};
export const Dark: Story = { globals: { theme: 'dark' } };
