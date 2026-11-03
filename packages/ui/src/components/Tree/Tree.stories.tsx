import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Tree, type TreeItem, type TreeProps } from './Tree';

const items: TreeItem[] = [
  {
    id: 'guides',
    label: 'Guides',
    children: [
      { id: 'install', label: 'Installing' },
      {
        id: 'themes',
        label: 'Themes',
        children: [
          { id: 'light', label: 'Light theme' },
          { id: 'dark', label: 'Dark theme' },
        ],
      },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    children: [
      { id: 'tokens', label: 'Tokens' },
      { id: 'legacy', label: 'Legacy tokens', disabled: true },
    ],
  },
  { id: 'changelog', label: 'Changelog' },
];

const allOpen = ['guides', 'themes', 'reference'];

const meta = {
  title: 'Data display/Tree',
  component: Tree,
  args: {
    items,
    'aria-label': 'Documentation',
    defaultExpandedIds: ['guides'],
    onExpandedChange: fn(),
    onSelectedChange: fn(),
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleSelection: Story = {
  args: { selectionMode: 'single', defaultSelectedIds: ['install'] },
};
export const MultipleSelection: Story = {
  args: {
    selectionMode: 'multiple',
    defaultExpandedIds: allOpen,
    defaultSelectedIds: ['install', 'tokens'],
  },
};
export const DisabledItems: Story = {
  args: { selectionMode: 'single', defaultExpandedIds: allOpen },
};
export const WithIcons: Story = {
  args: {
    items: [
      { id: 'photos', label: 'Photos', icon: <span>P</span> },
      { id: 'notes', label: 'Notes', icon: <span>N</span> },
    ],
  },
};

/** Fourteen levels and a label with no break in it, for a phone's width. */
const deepItems = Array.from({ length: 14 }).reduceRight<TreeItem[]>(
  (children, _unused, depth) => [
    {
      id: `level-${depth}`,
      label:
        depth === 13 ? 'an-exceptionally-long-file-name-with-no-spaces.tar.gz' : `Level ${depth}`,
      children,
    },
  ],
  [],
);
export const DeepAndLong: Story = {
  args: {
    items: deepItems,
    selectionMode: 'single',
    defaultExpandedIds: Array.from({ length: 13 }, (_unused, depth) => `level-${depth}`),
  },
};

export const RightToLeft: Story = {
  args: { selectionMode: 'single', defaultSelectedIds: ['install'] },
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
};

function ControlledTree(props: TreeProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(['guides']);
  const [selectedIds, setSelectedIds] = useState<string[]>(['install']);
  return (
    <Tree
      {...props}
      selectionMode="single"
      expandedIds={expandedIds}
      onExpandedChange={setExpandedIds}
      selectedIds={selectedIds}
      onSelectedChange={setSelectedIds}
    />
  );
}
export const Controlled: Story = { render: (args) => <ControlledTree {...args} /> };

function LabelledTree(props: TreeProps) {
  return (
    <>
      <h2 id="tree-heading">Documentation</h2>
      <Tree {...props} aria-label={undefined} aria-labelledby="tree-heading" />
    </>
  );
}
export const LabelledByHeading: Story = { render: (args) => <LabelledTree {...args} /> };

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    selectionMode: 'multiple',
    defaultExpandedIds: allOpen,
    defaultSelectedIds: ['install'],
  },
};
