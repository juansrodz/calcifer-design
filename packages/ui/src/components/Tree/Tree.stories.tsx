import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, within } from 'storybook/test';
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
  // Runs in a browser only (jsdom has no transitions). A closed branch mounting in this page must
  // land pointing left with no turn running: the direction is written with the turns held still,
  // so the glyph never spins through a half turn from its first, left-to-right guess. An ordinary
  // open and close must still turn, which a direction written (and held) on every render would
  // stop. The story mounts itself and clicks the toggle itself, so each check comes in the same
  // task as what it checks, well inside a turn's 120 ms.
  play: async ({ mount, canvasElement }) => {
    await mount();
    const reference = within(canvasElement).getByRole('treeitem', { name: 'Reference' });
    const toggle = reference.querySelector<HTMLElement>('[data-toggle]');
    const chevron = toggle?.querySelector('svg');
    if (!toggle || !chevron) throw new Error('Reference has no chevron');
    await expect(chevron.getAnimations()).toHaveLength(0);
    await expect(getComputedStyle(chevron).transform).toBe('matrix(0, 1, -1, 0, 0, 0)');

    // React commits a click's render in a microtask. The close waits for the open's turn to finish:
    // a turn reversed before it has run a frame is cancelled, not turned back.
    const clickAndGetTurns = async () => {
      toggle.click();
      await Promise.resolve();
      return chevron.getAnimations();
    };
    const opening = await clickAndGetTurns();
    await expect(opening).toHaveLength(1);
    await Promise.all(opening.map((turn) => turn.finished));
    await expect(await clickAndGetTurns()).toHaveLength(1);
  },
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
