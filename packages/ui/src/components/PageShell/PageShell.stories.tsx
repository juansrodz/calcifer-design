import type { Meta, StoryObj } from '@storybook/react';
import { PageShell } from './PageShell';

const meta = {
  title: 'Layout/PageShell',
  component: PageShell,
  parameters: { layout: 'fullscreen' },
  args: {
    header: <p>Calcifer</p>,
    children: <p>The page's own content.</p>,
    footer: <p>Built in the open.</p>,
  },
} satisfies Meta<typeof PageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const sidebar = (
  <nav aria-label="Sections">
    <a href="#overview">Overview</a>
  </nav>
);

export const Default: Story = {};
export const WithSidebar: Story = { args: { sidebar, sidebarLabel: 'Project sections' } };
export const ContentOnly: Story = { args: { header: undefined, footer: undefined } };
export const CustomTarget: Story = {
  args: { mainId: 'page-content', skipLinkLabel: 'Jump to the page' },
};
export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { sidebar, sidebarLabel: 'Project sections' },
};
