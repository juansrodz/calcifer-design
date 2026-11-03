import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from '../Tag/Tag';
import { ViewField } from './ViewField';

const meta = {
  title: 'Data/ViewField',
  component: ViewField,
  args: { label: 'Project lead', children: 'Ada Lovelace' },
} satisfies Meta<typeof ViewField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Inline: Story = { args: { layout: 'inline' } };
export const RichValue: Story = {
  args: { label: 'Status', children: <Tag tone="accent">Live</Tag> },
};
export const Empty: Story = { args: { children: undefined } };
export const CustomEmptyText: Story = {
  args: { children: undefined, emptyText: 'Not assigned yet' },
};
export const LongValue: Story = {
  args: {
    layout: 'inline',
    label: 'Repository',
    children: 'https://example.com/an/unbroken/address/that/is/longer/than/a/390px/screen/is/wide',
  },
};
export const Dark: Story = { globals: { theme: 'dark' } };
