import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../Card/Card';
import { CardList } from './CardList';

interface Project {
  slug: string;
  name: string;
  summary: string;
}

const projects: Project[] = [
  { slug: 'atlas', name: 'Atlas', summary: 'Maps of every service and who owns it.' },
  { slug: 'beacon', name: 'Beacon', summary: 'Status pages that update themselves.' },
  { slug: 'cairn', name: 'Cairn', summary: 'Release notes written from the commits.' },
  { slug: 'delta', name: 'Delta', summary: 'Compares two builds, byte for byte.' },
];

function renderProject(project: Project) {
  return <Card heading={project.name}>{project.summary}</Card>;
}

const meta = {
  title: 'Data display/CardList',
  component: CardList<Project>,
  args: {
    'aria-label': 'Projects',
    items: projects,
    getKey: (project) => project.slug,
    renderItem: renderProject,
  },
} satisfies Meta<typeof CardList<Project>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NarrowColumns: Story = { args: { minColumnWidth: '10rem' } };
/** A column wider than any phone, which `min()` holds to the width there is. */
export const WideColumns: Story = { args: { minColumnWidth: '40rem' } };
export const Loading: Story = { args: { items: [], loading: true } };
export const LoadingFewer: Story = { args: { items: [], loading: true, skeletonCount: 2 } };
export const Refreshing: Story = { args: { loading: true } };
export const Empty: Story = { args: { items: [], emptyState: <p>No projects yet.</p> } };
export const EmptyWithoutMessage: Story = { args: { items: [] } };
export const Dark: Story = { globals: { theme: 'dark' } };
export const DarkLoading: Story = {
  globals: { theme: 'dark' },
  args: { items: [], loading: true },
};
