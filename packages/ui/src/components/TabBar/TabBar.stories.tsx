import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import { TabBar } from './TabBar';
import type { TabBarItem } from './TabBar';

/** A 16-unit outline icon in the library's own style; the stories draw their own, as an app does. */
function StoryIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const fiveItems: readonly TabBarItem[] = [
  {
    href: '/events',
    label: 'Events',
    icon: (
      <StoryIcon>
        <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
        <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
      </StoryIcon>
    ),
  },
  {
    href: '/items',
    label: 'My items',
    icon: (
      <StoryIcon>
        <path d="M3 4.5h10M3 8h10M3 11.5h6" />
      </StoryIcon>
    ),
  },
  {
    href: '/people',
    label: 'People',
    icon: (
      <StoryIcon>
        <circle cx="8" cy="5.5" r="2.5" />
        <path d="M3 13.5c.6-2.4 2.6-3.5 5-3.5s4.4 1.1 5 3.5" />
      </StoryIcon>
    ),
  },
  {
    href: '/alerts',
    label: 'Alerts',
    icon: (
      <StoryIcon>
        <path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14h3" />
      </StoryIcon>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <StoryIcon>
        <circle cx="8" cy="8" r="5.5" />
        <circle cx="8" cy="6.5" r="1.5" />
        <path d="M4.8 12c.8-1.4 2-2 3.2-2s2.4.6 3.2 2" />
      </StoryIcon>
    ),
  },
];

const meta = {
  title: 'Navigation/TabBar',
  component: TabBar,
  args: { items: fiveItems, currentPath: '/events/e1' },
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'mobile' } },
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five items, the current page (`/events/e1`, under `/events`) filled and showing its label. */
export const Default: Story = {};

/** A circular action beside the pill, before it. The node is the caller's; the bar places it. */
export const WithAction: Story = {
  args: {
    action: (
      <IconButton variant="primary" label="Add event">
        <StoryIcon>
          <path d="M8 3v10M3 8h10" />
        </StoryIcon>
      </IconButton>
    ),
  },
};

/** Two to five items; three leave the links spaced evenly along the pill. */
export const ThreeItems: Story = {
  args: { items: fiveItems.slice(0, 3), currentPath: '/items' },
};

type RoutedItem = TabBarItem & { routeId: string };

const routedItems: readonly RoutedItem[] = fiveItems.map((item) => ({
  ...item,
  routeId: item.href.slice(1),
}));

/**
 * `renderLink` receives each item whole, extra field and all, and renders the shell's router link
 * in place of the plain anchor. The anchors here stand in for a router's `Link`.
 */
export const RouterLinks: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <TabBar<RoutedItem>
      {...args}
      items={routedItems}
      renderLink={(item, { children, ...linkProps }) => (
        <a href={item.href} data-router="" data-route-id={item.routeId} {...linkProps}>
          {children}
        </a>
      )}
    />
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark', viewport: { value: 'mobile' } },
  parameters: { controls: { disable: true } },
  args: {
    action: (
      <IconButton variant="primary" label="Add event">
        <StoryIcon>
          <path d="M8 3v10M3 8h10" />
        </StoryIcon>
      </IconButton>
    ),
  },
};
