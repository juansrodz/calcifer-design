import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from '../Tag/Tag';
import { Descriptions, type DescriptionsItem } from './Descriptions';

const items: DescriptionsItem[] = [
  { id: 'lead', label: 'Project lead', value: 'Ada Lovelace' },
  { id: 'status', label: 'Status', value: <Tag tone="accent">Live</Tag> },
  { id: 'region', label: 'Region', value: 'us-east-1' },
  { id: 'budget', label: 'Budget', value: null },
  {
    id: 'summary',
    label: 'Summary',
    value: 'A description long enough to want the whole row of the grid to itself.',
    span: 2,
  },
];

const meta = {
  title: 'Data/Descriptions',
  component: Descriptions,
  args: { items },
} satisfies Meta<typeof Descriptions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const OneColumn: Story = { args: { columns: 1 } };
export const ThreeColumns: Story = { args: { columns: 3 } };
export const WithHeading: Story = { args: { heading: 'Project details' } };
export const HeadingLevelTwo: Story = { args: { heading: 'Project details', headingLevel: 2 } };
export const CustomEmptyText: Story = { args: { emptyText: 'Not set' } };
export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { heading: 'Project details', columns: 3 },
};
